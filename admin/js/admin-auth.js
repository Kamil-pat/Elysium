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

    const passwordToggle =
        document.getElementById("adminPasswordToggle");


    passwordToggle?.addEventListener(
        "click",
        () => {

            const isVisible =
                loginPassword.type === "text";

            loginPassword.type =
                isVisible
                    ? "password"
                    : "text";

            passwordToggle.textContent =
                isVisible
                    ? "SHOW"
                    : "HIDE";

            passwordToggle.setAttribute(
                "aria-label",
                isVisible
                    ? "Show password"
                    : "Hide password"
            );

            passwordToggle.setAttribute(
                "aria-pressed",
                String(!isVisible)
            );

        }
    );


    const LOGIN_ATTEMPT_LIMIT = 5;
    const LOGIN_ATTEMPT_WINDOW_MS = 60 * 30 * 1000;
    const LOGIN_ATTEMPTS_STORAGE_KEY =
        "elysiumAdminLoginAttempts";


    const getRecentLoginAttempts = () => {

        const now = Date.now();
        let attempts = [];

        try {

            attempts = JSON.parse(
                localStorage.getItem(
                    LOGIN_ATTEMPTS_STORAGE_KEY
                ) || "[]"
            );

        } catch {

            attempts = [];

        }

        attempts = attempts.filter(
            (timestamp) =>
                Number.isFinite(timestamp) &&
                now - timestamp < LOGIN_ATTEMPT_WINDOW_MS
        );

        localStorage.setItem(
            LOGIN_ATTEMPTS_STORAGE_KEY,
            JSON.stringify(attempts)
        );

        return attempts;

    };


    const recordFailedLoginAttempt = () => {

        const attempts = getRecentLoginAttempts();

        attempts.push(Date.now());

        localStorage.setItem(
            LOGIN_ATTEMPTS_STORAGE_KEY,
            JSON.stringify(attempts)
        );

        return attempts.length;

    };


    const clearLoginAttempts = () => {

        localStorage.removeItem(
            LOGIN_ATTEMPTS_STORAGE_KEY
        );

    };


    const showLoginAttemptLimit = (
        attemptCount
    ) => {

        const remainingAttempts =
            LOGIN_ATTEMPT_LIMIT - attemptCount;

        showError(
            remainingAttempts > 0
                ? `Incorrect login. You have a limit of ${LOGIN_ATTEMPT_LIMIT} login attempts per hour. ${remainingAttempts} ${remainingAttempts === 1 ? "attempt" : "attempts"} remaining.`
                : "You have reached the limit of 5 login attempts per hour. Please try again later."
        );

        if (
            attemptCount >= LOGIN_ATTEMPT_LIMIT
        ) {

            loginButton.disabled = true;
            loginButton.textContent = "TRY AGAIN LATER";

        }

    };


    const recentLoginAttempts =
        getRecentLoginAttempts();


    if (
        recentLoginAttempts.length >=
        LOGIN_ATTEMPT_LIMIT
    ) {

        loginButton.disabled = true;
        loginButton.textContent = "TRY AGAIN LATER";

        showLoginAttemptLimit(
            recentLoginAttempts.length
        );

    }


    /* =====================================================
       VERIFY ELEMENTS
       ===================================================== */


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


            if (
                getRecentLoginAttempts().length >=
                LOGIN_ATTEMPT_LIMIT
            ) {

                showLoginAttemptLimit(
                    LOGIN_ATTEMPT_LIMIT
                );

                return;

            }

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



                if (error) {

                    console.error(
                        "Supabase login error:",
                        error
                    );

                    const attemptCount =
                        recordFailedLoginAttempt();

                    showLoginAttemptLimit(
                        attemptCount
                    );

                    return;

                }


                if (
                    !data ||
                    !data.user
                ) {

                    const attemptCount =
                        recordFailedLoginAttempt();

                    showLoginAttemptLimit(
                        attemptCount
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

                clearLoginAttempts();


            } catch (error) {

                console.error(
                    "LOGIN EXCEPTION:",
                    error
                );

                showError(
                    "Something went wrong while signing in."
                );

            } finally {

                const attemptsAfterLogin =
                    getRecentLoginAttempts().length;

                const loginLimitReached =
                    attemptsAfterLogin >=
                    LOGIN_ATTEMPT_LIMIT;

                loginButton.disabled =
                    loginLimitReached;

                loginButton.textContent =
                    loginLimitReached
                        ? "TRY AGAIN LATER"
                        : "SIGN IN";

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
         REQUIRE LOGIN AFTER PAGE LOAD
         ===================================================== */

     await logOutOnPageLoad();


    /* =====================================================
       FUNCTIONS
       ===================================================== */


    async function logOutOnPageLoad() {

        try {

            await window.supabaseClient
                .auth
                .signOut();

            showLoginScreen();

        } catch (error) {

            console.error(
                "Page-load logout failed:",
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