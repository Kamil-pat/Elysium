/* =========================================================
   ELYSIUM
   CONTACT FORM
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById(
                "contact-form"
            );


        if (!form) {
            return;
        }


        let submissionInProgress = false;


        /* =================================================
           FORM SUBMISSION
           ================================================= */

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                if (submissionInProgress) {
                    return;
                }


                /* =========================================
                   FIELDS
                   ========================================= */

                const nameInput =
                    document.getElementById(
                        "contact-name"
                    );

                const emailInput =
                    document.getElementById(
                        "contact-email"
                    );

                const phoneInput =
                    document.getElementById(
                        "contact-phone"
                    );

                const subjectInput =
                    document.getElementById(
                        "contact-subject"
                    );

                const messageInput =
                    document.getElementById(
                        "contact-message"
                    );


                /* =========================================
                   VALUES
                   ========================================= */

                const name =
                    nameInput?.value.trim() || "";

                const email =
                    emailInput?.value.trim() || "";

                const phone =
                    phoneInput?.value.trim() || "";

                const subject =
                    subjectInput?.value.trim() || "";

                const message =
                    messageInput?.value.trim() || "";


                /* =========================================
                   VALIDATION
                   ========================================= */

                if (!name) {

                    showContactMessage(
                        "Please enter your name.",
                        "error"
                    );

                    nameInput?.focus();

                    return;
                }


                if (!email) {

                    showContactMessage(
                        "Please enter your email address.",
                        "error"
                    );

                    emailInput?.focus();

                    return;
                }


                if (!isValidEmail(email)) {

                    showContactMessage(
                        "Please enter a valid email address.",
                        "error"
                    );

                    emailInput?.focus();

                    return;
                }


                if (!subject) {

                    showContactMessage(
                        "Please enter a subject.",
                        "error"
                    );

                    subjectInput?.focus();

                    return;
                }


                if (!message) {

                    showContactMessage(
                        "Please enter a message.",
                        "error"
                    );

                    messageInput?.focus();

                    return;
                }


                /* =========================================
                   SUBMIT BUTTON
                   ========================================= */

                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                const originalButtonText =
                    submitButton
                        ? submitButton.textContent
                        : "";


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Sending...";

                }


                /* =========================================
                   CLEAR OLD MESSAGE
                   ========================================= */

                clearContactMessage();

                submissionInProgress = true;


                try {

                    /* =====================================
                       SEND TO SUPABASE EDGE FUNCTION
                       ===================================== */

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .functions
                            .invoke(
                                "contact-message",
                                {

                                    body: {

                                        customer_name:
                                            name,

                                        customer_email:
                                            email,

                                        customer_phone:
                                            phone || null,

                                        subject:
                                            subject,

                                        message:
                                            message

                                    }

                                }
                            );


                    /* =====================================
                       EDGE FUNCTION ERROR
                       ===================================== */

                    if (error) {

                        console.error(
                            "Contact form error:",
                            error
                        );

                        throw new Error(
                            "Unable to send your message."
                        );

                    }


                    if (
                        !data ||
                        !data.success
                    ) {

                        throw new Error(
                            data?.error ||
                            "Unable to send your message."
                        );

                    }


                    /* =====================================
                       SUCCESS
                       ===================================== */

                    showContactMessage(
                        "Thank you for reaching out. Your message has been sent successfully.",
                        "success"
                    );


                    /* =====================================
                       CLEAR FORM
                       ===================================== */

                    form.reset();


                } catch (error) {

                    console.error(
                        "Contact form submission failed:",
                        error
                    );


                    showContactMessage(
                        error.message ||
                        "Something went wrong. Please try again.",
                        "error"
                    );


                } finally {

                    submissionInProgress = false;

                    /* =====================================
                       RESTORE BUTTON
                       ===================================== */

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            originalButtonText;

                    }

                }

            }
        );


        /* =================================================
           EMAIL VALIDATION
           ================================================= */

        function isValidEmail(
            email
        ) {

            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email);

        }


        /* =================================================
           SHOW MESSAGE
           ================================================= */

        function showContactMessage(
            message,
            type
        ) {

            let messageElement =
                document.getElementById(
                    "contact-form-message"
                );


            if (!messageElement) {

                messageElement =
                    document.createElement(
                        "div"
                    );

                messageElement.id =
                    "contact-form-message";

                form.prepend(
                    messageElement
                );

            }


            messageElement.textContent =
                message;


            messageElement.className =
                `contact-form-message ${type}`;


            messageElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }


        /* =================================================
           CLEAR MESSAGE
           ================================================= */

        function clearContactMessage() {

            const messageElement =
                document.getElementById(
                    "contact-form-message"
                );


            if (messageElement) {

                messageElement.remove();

            }

        }

    }
);