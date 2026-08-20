/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   PRIVATE ROOM REQUEST FORM
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("private-room-form");

    const submitButton =
        document.getElementById(
            "private-request-button"
        );

    const errorMessage =
        document.getElementById(
            "private-form-error"
        );

    const successMessage =
        document.getElementById(
            "private-form-success"
        );

    const dateInput =
        document.getElementById(
            "requested-date"
        );

    const startTimeInput =
        document.getElementById(
            "start-time"
        );

    const endTimeInput =
        document.getElementById(
            "end-time"
        );

    const guestCountInput =
        document.getElementById(
            "guest-count"
        );


    /* =====================================================
       MAKE SURE FORM EXISTS
       ===================================================== */

    if (!form) {
        return;
    }


    let submissionInProgress = false;


    /* =====================================================
       SET MINIMUM DATE
       ===================================================== */

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    const todayString =
        `${year}-${month}-${day}`;

    dateInput.min =
        todayString;


    /* =====================================================
       ERROR MESSAGE
       ===================================================== */

    function showError(message) {

        errorMessage.textContent =
            message;

        errorMessage.hidden =
            false;

        errorMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /* =====================================================
       HIDE ERROR
       ===================================================== */

    function hideError() {

        errorMessage.textContent =
            "";

        errorMessage.hidden =
            true;

    }


    /* =====================================================
       BUTTON LOADING STATE
       ===================================================== */

    function setLoading(
        loading
    ) {

        submitButton.disabled =
            loading;


        if (loading) {

            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent =
                "Sending Request...";

            submitButton.classList.add(
                "loading"
            );

        } else {

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Send Private Room Request";

            submitButton.classList.remove(
                "loading"
            );

        }

    }


    /* =====================================================
       DATE VALIDATION
       ===================================================== */

    function validateDate() {

        const selectedDate =
            dateInput.value;


        if (!selectedDate) {

            return {
                valid: false,
                message:
                    "Please select a requested date."
            };

        }


        const selected =
            new Date(
                `${selectedDate}T12:00:00`
            );

        const now =
            new Date();

        const currentDay =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        if (
            selected <
            currentDay
        ) {

            return {
                valid: false,
                message:
                    "Please select a future date."
            };

        }


        return {
            valid: true
        };

    }


    /* =====================================================
       TIME VALIDATION
       ===================================================== */

    function validateTimes() {

        const start =
            startTimeInput.value;

        const end =
            endTimeInput.value;


        if (!start) {

            return {
                valid: false,
                message:
                    "Please select a preferred start time."
            };

        }


        if (!end) {

            return {
                valid: false,
                message:
                    "Please select a preferred end time."
            };

        }


        if (end <= start) {

            return {
                valid: false,
                message:
                    "Your preferred end time must be after your start time."
            };

        }


        return {
            valid: true
        };

    }


    /* =====================================================
       GUEST COUNT VALIDATION
       ===================================================== */

    function validateGuestCount() {

        const guests =
            Number(
                guestCountInput.value
            );


        if (
            !guestCountInput.value ||
            !Number.isInteger(guests) ||
            guests < 1
        ) {

            return {
                valid: false,
                message:
                    "Please enter a valid number of guests."
            };

        }


        return {
            valid: true
        };

    }


    /* =====================================================
       FORM VALIDATION
       ===================================================== */

    function validateForm() {

        hideError();


        if (
            !form.checkValidity()
        ) {

            form.reportValidity();

            return false;

        }


        const dateResult =
            validateDate();


        if (!dateResult.valid) {

            showError(
                dateResult.message
            );

            return false;

        }


        const timeResult =
            validateTimes();


        if (!timeResult.valid) {

            showError(
                timeResult.message
            );

            return false;

        }


        const guestResult =
            validateGuestCount();


        if (!guestResult.valid) {

            showError(
                guestResult.message
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       SUBMIT FORM
       ===================================================== */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (submissionInProgress) {
                return;
            }


            if (
                !validateForm()
            ) {

                return;

            }


            setLoading(true);

            submissionInProgress = true;


            try {

                const formData =
                    new FormData(
                        form
                    );


                /* =========================================
                   COLLECT FORM DATA
                   ========================================= */

                const requestData = {

                    customer_name:
                        formData
                            .get(
                                "customer_name"
                            )
                            ?.trim(),

                    customer_email:
                        formData
                            .get(
                                "customer_email"
                            )
                            ?.trim(),

                    customer_phone:
                        formData
                            .get(
                                "customer_phone"
                            )
                            ?.trim() || null,

                    requested_date:
                        formData.get(
                            "requested_date"
                        ),

                    preferred_start_time:
                        formData.get(
                            "preferred_start_time"
                        ),

                    preferred_end_time:
                        formData.get(
                            "preferred_end_time"
                        ),

                    guest_count:
                        Number(
                            formData.get(
                                "guest_count"
                            )
                        ),

                    event_type:
                        formData
                            .get(
                                "event_type"
                            )
                            ?.trim() || null,

                    notes:
                        formData
                            .get(
                                "notes"
                            )
                            ?.trim() || null

                };


                /* =========================================
                   CALL SUPABASE EDGE FUNCTION
                   ========================================= */

                const {
                    data,
                    error
                } =
                    await supabaseClient.functions.invoke(
                        "private-room-request",
                        {
                            body:
                                requestData
                        }
                    );


                /* =========================================
                   EDGE FUNCTION ERROR
                   ========================================= */

                if (error) {

                    console.error(
                        "Edge Function error:",
                        error
                    );

                    throw new Error(
                        "We were unable to send your request. Please try again."
                    );

                }


                /* =========================================
                   APPLICATION ERROR
                   ========================================= */

                if (
                    !data ||
                    data.success !== true
                ) {

                    throw new Error(
                        data?.error ||
                        "We were unable to send your request. Please try again."
                    );

                }


                /* =========================================
                   SUCCESS
                   ========================================= */

                showSuccess();


            } catch (error) {

                console.error(
                    "Private room request failed:",
                    error
                );


                showError(
                    error.message ||
                    "Something went wrong. Please try again."
                );


                setLoading(false);

                submissionInProgress = false;

            }

        }
    );


    /* =====================================================
       SHOW SUCCESS
       ===================================================== */

    function showSuccess() {

        form.hidden =
            true;

        successMessage.hidden =
            false;


        successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        form.reset();

    }


    /* =====================================================
       CLEAR ERROR WHEN USER CHANGES INPUT
       ===================================================== */

    dateInput.addEventListener(
        "change",
        hideError
    );


    startTimeInput.addEventListener(
        "change",
        hideError
    );


    endTimeInput.addEventListener(
        "change",
        hideError
    );


    guestCountInput.addEventListener(
        "input",
        () => {

            if (
                Number(
                    guestCountInput.value
                ) < 1
            ) {

                guestCountInput.value =
                    "";

            }

            hideError();

        }
    );

});