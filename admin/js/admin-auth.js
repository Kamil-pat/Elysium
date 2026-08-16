/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   ADMIN AUTHENTICATION
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginScreen =
    document.getElementById("loginScreen");

const adminDashboard =
    document.getElementById("adminDashboard");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const logoutButton =
    document.getElementById("logoutButton");

const adminUserEmail =
    document.getElementById("adminUserEmail");


/* =========================================================
   WAIT FOR SUPABASE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * supabase.js creates:
         *
         * window.supabaseClient
         *
         * We wait until the deferred scripts have
         * finished loading.
         */

        if (
            !window.supabaseClient
        ) {

            showLoginError(
                "Unable to connect to Elysium services. Please refresh the page."
            );

            return;

        }


        await checkExistingSession();

    }
);


/* =========================================================
   CHECK EXISTING SESSION
   ========================================================= */

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            showLoginScreen();

            return;

        }


        const session =
            data.session;


        if (!session) {

            showLoginScreen();

            return;

        }


        /*
         * A session exists.
         *
         * We still verify that this user is
         * actually an Elysium admin.
         */

        const isAdmin =
            await verifyAdmin(
                session.user
            );


        if (!isAdmin) {

            await window.supabaseClient
                .auth
                .signOut();


            showLoginError(
                "This account does not have Elysium manager access."
            );

            return;

        }


        showDashboard(
            session.user
        );

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        showLoginScreen();

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        clearLoginError();


        const email =
            loginEmail.value
                .trim()
                .toLowerCase();


        const password =
            loginPassword.value;


        if (
            !email ||
            !password
        ) {

            showLoginError(
                "Please enter your email and password."
            );

            return;

        }


        setLoginLoading(
            true
        );


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .auth
                    .signInWithPassword({

                        email,

                        password,

                    });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                showLoginError(
                    getLoginErrorMessage(
                        error
                    )
                );

                return;

            }


            if (
                !data.user
            ) {

                showLoginError(
                    "We could not verify your account."
                );

                return;

            }


            /*
             * IMPORTANT:
             *
             * Successfully signing into Supabase
             * does NOT automatically make someone
             * an Elysium administrator.
             *
             * We check admin_profiles next.
             */

            const isAdmin =
                await verifyAdmin(
                    data.user
                );


            if (!isAdmin) {

                await window.supabaseClient
                    .auth
                    .signOut();


                showLoginError(
                    "This account does not have Elysium manager access."
                );

                return;

            }


            loginPassword.value =
                "";


            showDashboard(
                data.user
            );


        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );

            showLoginError(
                "Something went wrong while signing in. Please try again."
            );

        } finally {

            setLoginLoading(
                false
            );

        }

    }
);


/* =========================================================
   VERIFY ADMIN
   ========================================================= */

async function verifyAdmin(
    user
) {

    if (
        !user ||
        !user.id
    ) {

        return false;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "admin_profiles"
                )
                .select(
                    "id, email, is_admin"
                )
                .eq(
                    "id",
                    user.id
                )
                .eq(
                    "is_admin",
                    true
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Admin verification error:",
                error
            );

            return false;

        }


        return Boolean(
            data
        );


    } catch (error) {

        console.error(
            "Admin verification failed:",
            error
        );

        return false;

    }

}


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard(
    user
) {

    loginScreen.hidden =
        true;

    adminDashboard.hidden =
        false;


    if (
        adminUserEmail &&
        user
    ) {

        adminUserEmail.textContent =
            user.email || "Manager";

    }


    /*
     * Tell the rest of the admin application
     * that authentication is complete.
     */

    window.dispatchEvent(
        new CustomEvent(
            "elysiumAdminReady",
            {
                detail: {
                    user
                }
            }
        )
    );

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLoginScreen() {

    loginScreen.hidden =
        false;

    adminDashboard.hidden =
        true;


    if (
        loginEmail
    ) {

        loginEmail.focus();

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (
    logoutButton
) {

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled =
                true;


            try {

                const {
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    return;

                }


                showLoginScreen();


            } catch (error) {

                console.error(
                    "Unexpected logout error:",
                    error
                );

            } finally {

                logoutButton.disabled =
                    false;

            }

        }
    );

}


/* =========================================================
   AUTH STATE CHANGES
   ========================================================= */

if (
    window.supabaseClient
) {

    window.supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                /*
                 * SIGNED_OUT
                 */

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    showLoginScreen();

                    return;

                }


                /*
                 * INITIAL_SESSION is handled by
                 * checkExistingSession().
                 *
                 * We don't want to duplicate
                 * verification here.
                 */

                if (
                    event ===
                    "INITIAL_SESSION"
                ) {

                    return;

                }

            }
        );

}


/* =========================================================
   LOGIN LOADING STATE
   ========================================================= */

function setLoginLoading(
    loading
) {

    if (
        !loginButton
    ) {

        return;

    }


    loginButton.disabled =
        loading;


    if (
        loading
    ) {

        loginButton.dataset
            .originalText =
                loginButton.textContent;

        loginButton.textContent =
            "SIGNING IN...";

    } else {

        loginButton.textContent =
            loginButton.dataset
                .originalText ||
            "SIGN IN";

    }

}


/* =========================================================
   LOGIN ERROR
   ========================================================= */

function showLoginError(
    message
) {

    if (
        !loginError
    ) {

        return;

    }


    loginError.textContent =
        message;

    loginError.hidden =
        false;

}


function clearLoginError() {

    if (
        !loginError
    ) {

        return;

    }


    loginError.textContent =
        "";

    loginError.hidden =
        true;

}


/* =========================================================
   FRIENDLY LOGIN ERRORS
   ========================================================= */

function getLoginErrorMessage(
    error
) {

    if (
        !error
    ) {

        return "Unable to sign in.";

    }


    switch (
        error.message
    ) {

        case "Invalid login credentials":

            return "The email or password is incorrect.";


        case "Email not confirmed":

            return "Please confirm your email address before signing in.";


        default:

            return (
                error.message ||
                "Unable to sign in. Please try again."
            );

    }

}