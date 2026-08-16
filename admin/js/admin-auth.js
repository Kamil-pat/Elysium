/* =========================================================
   ELYSIUM ADMIN AUTHENTICATION
   ========================================================= */

console.log("ELYSIUM ADMIN AUTH JS LOADED");


document.addEventListener("DOMContentLoaded", async () => {

    console.log("Admin DOM loaded");


    /* =====================================================
       GET ELEMENTS
       ===================================================== */

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


    /* =====================================================
       VERIFY ELEMENTS
       ===================================================== */

    console.log("Login form:", loginForm);
    console.log("Login button:", loginButton);


    if (!loginForm) {

        console.error(
            "ERROR: loginForm was not found."
        );

        return;

    }


    if (!window.supabaseClient) {

        console.error(
            "ERROR: Supabase client was not found."
        );

        showError(
            "Unable to connect to Elysium services. Please refresh the page."
        );

        return;

    }


    /* =====================================================
       FORCE INITIAL LOGIN STATE
       ===================================================== */

    showLoginScreen();


    /* =====================================================
       LOGIN
       ===================================================== */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            console.log(
                "LOGIN FORM SUBMITTED"
            );


            clearError();


            const email =
                loginEmail.value
                    .trim()
                    .toLowerCase();


            const password =
                loginPassword.value;


            console.log(
                "Login email:",
                email
            );


            if (!email || !password) {

                showError(
                    "Please enter your email and password."
                );

                return;

            }


            loginButton.disabled =
                true;

            loginButton.textContent =
                "SIGNING IN...";


            try {

                console.log(
                    "Calling Supabase..."
                );


                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signInWithPassword({

                            email: email,

                            password: password

                        });


                console.log(
                    "Supabase response:",
                    data,
                    error
                );


                if (error) {

                    console.error(
                        "Supabase login error:",
                        error
                    );

                    showError(
                        getFriendlyError(error)
                    );

                    return;

                }


                if (
                    !data ||
                    !data.user
                ) {

                    showError(
                        "Login failed. Please try again."
                    );

                    return;

                }


                /* =========================================
                   VERIFY ADMIN
                   ========================================= */

                console.log(
                    "Checking admin profile..."
                );


                const {
                    data: admin,
                    error: adminError
                } =
                    await window.supabaseClient
                        .from("admin_profiles")
                        .select(
                            "id, email, is_admin"
                        )
                        .eq(
                            "id",
                            data.user.id
                        )
                        .eq(
                            "is_admin",
                            true
                        )
                        .maybeSingle();


                console.log(
                    "Admin result:",
                    admin,
                    adminError
                );


                if (adminError) {

                    console.error(
                        "Admin verification error:",
                        adminError
                    );

                    showError(
                        "We couldn't verify your manager permissions."
                    );

                    await window.supabaseClient
                        .auth
                        .signOut();

                    return;

                }


                if (!admin) {

                    showError(
                        "This account does not have Elysium manager access."
                    );

                    await window.supabaseClient
                        .auth
                        .signOut();

                    return;

                }


                /* =========================================
                   SUCCESS
                   ========================================= */

                console.log(
                    "ELYSIUM ADMIN LOGIN SUCCESS"
                );


                showDashboard(
                    data.user
                );


            } catch (error) {

                console.error(
                    "LOGIN EXCEPTION:",
                    error
                );

                showError(
                    "Something went wrong while signing in."
                );

            } finally {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "SIGN IN";

            }

        }
    );


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                console.log(
                    "Logging out..."
                );


                await window.supabaseClient
                    .auth
                    .signOut();


                showLoginScreen();

            }
        );

    }


    /* =====================================================
       CHECK EXISTING SESSION
       ===================================================== */

    await checkExistingSession();


    /* =====================================================
       FUNCTIONS
       ===================================================== */


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


            if (
                !data ||
                !data.session
            ) {

                showLoginScreen();

                return;

            }


            console.log(
                "Existing session found."
            );


            const user =
                data.session.user;


            const {
                data: admin,
                error: adminError
            } =
                await window.supabaseClient
                    .from("admin_profiles")
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


            if (
                adminError ||
                !admin
            ) {

                await window.supabaseClient
                    .auth
                    .signOut();

                showLoginScreen();

                return;

            }


            showDashboard(
                user
            );

        } catch (error) {

            console.error(
                "Session check failed:",
                error
            );

            showLoginScreen();

        }

    }


    function showLoginScreen() {

        /*
         * Login visible
         */

        loginScreen.hidden =
            false;


        /*
         * Dashboard completely hidden
         */

        adminDashboard.hidden =
            true;


        document.body.classList
            .remove(
                "admin-authenticated"
            );

    }


    function showDashboard(
        user
    ) {

        /*
         * Login completely hidden
         */

        loginScreen.hidden =
            true;


        /*
         * Dashboard visible
         */

        adminDashboard.hidden =
            false;


        document.body.classList
            .add(
                "admin-authenticated"
            );


        if (
            adminUserEmail &&
            user
        ) {

            adminUserEmail.textContent =
                user.email || "Manager";

        }


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


    function showError(
        message
    ) {

        if (!loginError) {

            return;

        }


        loginError.textContent =
            message;

        loginError.hidden =
            false;

    }


    function clearError() {

        if (!loginError) {

            return;

        }


        loginError.textContent =
            "";

        loginError.hidden =
            true;

    }


    function getFriendlyError(
        error
    ) {

        if (
            error &&
            error.message ===
            "Invalid login credentials"
        ) {

            return (
                "The email or password is incorrect."
            );

        }


        if (
            error &&
            error.message ===
            "Email not confirmed"
        ) {

            return (
                "Please confirm your email address before signing in."
            );

        }


        return (
            error?.message ||
            "Unable to sign in."
        );

    }

});