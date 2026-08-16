/* =========================================================
   ELYSIUM
   COCKTAIL CLASS BOOKING
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const classId =
        params.get("id");


    const loading =
        document.getElementById(
            "booking-loading"
        );

    const layout =
        document.getElementById(
            "booking-layout"
        );

    const success =
        document.getElementById(
            "booking-success"
        );

    const unavailable =
        document.getElementById(
            "booking-unavailable"
        );

    const form =
        document.getElementById(
            "class-booking-form"
        );


    let classData = null;


    /* =====================================================
       NO CLASS ID
       ===================================================== */

    if (!classId) {

        showUnavailable();

        return;

    }


    /* =====================================================
       LOAD CLASS
       ===================================================== */

    async function loadClass() {

        try {

            /*
             * We use the availability function instead of
             * querying the bookings table directly.
             *
             * This means the customer only gets public
             * availability information.
             */

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "get_cocktail_class_availability"
            );


            if (error) {
                throw error;
            }


            classData =
                data?.find(
                    (item) =>
                        item.id === classId
                );


            /*
             * If the class isn't returned, it is either:
             *
             * - full
             * - hidden
             * - doesn't exist
             */

            if (!classData) {

                showUnavailable();

                return;

            }


            renderClass(
                classData
            );


        } catch (error) {

            console.error(
                "Unable to load class:",
                error
            );


            showUnavailable();

        }

    }


    /* =====================================================
       RENDER CLASS
       ===================================================== */

    function renderClass(data) {

        document.getElementById(
            "booking-class-date"
        ).textContent =
            formatDate(
                data.class_date
            );


        document.getElementById(
            "booking-class-title"
        ).textContent =
            data.title ||
            "Cocktail Class";


        document.getElementById(
            "booking-class-description"
        ).textContent =
            data.description || "";


        document.getElementById(
            "booking-class-time"
        ).textContent =
            formatTimeRange(
                data.start_time,
                data.end_time
            );


        document.getElementById(
            "booking-class-price"
        ).textContent =
            `$${Number(
                data.price
            ).toFixed(2)} / person`;


        document.getElementById(
            "booking-class-spots"
        ).textContent =
            `${data.spots_remaining} ${
                Number(data.spots_remaining) === 1
                    ? "spot"
                    : "spots"
            } remaining`;


        /*
         * Set class image.
         */

        const imageContainer =
            document.getElementById(
                "booking-class-image"
            );


        if (data.image_url) {

            imageContainer.innerHTML = `
                <img
                    src="${escapeAttribute(
                        data.image_url
                    )}"
                    alt="${escapeAttribute(
                        data.title ||
                        "Elysium cocktail class"
                    )}"
                >
            `;

        } else {

            imageContainer.innerHTML = `
                <div class="booking-image-placeholder">
                    <span>ELYSIUM</span>
                </div>
            `;

        }


        /*
         * Create guest options based on actual
         * available capacity.
         */

        populateGuestOptions(
            data.spots_remaining
        );


        loading.hidden = true;

        layout.hidden = false;

    }


    /* =====================================================
       GUEST OPTIONS
       ===================================================== */

    function populateGuestOptions(
        spotsRemaining
    ) {

        const select =
            document.getElementById(
                "guest-count"
            );


        select.innerHTML = `
            <option value="">
                Select number of guests
            </option>
        `;


        /*
         * Limit the maximum selection to the
         * number of spots remaining.
         *
         * We also cap the selector at 10 per booking.
         * If Elysium later wants larger group bookings,
         * this can be changed in one place.
         */

        const maximum =
            Math.min(
                Number(spotsRemaining),
                10
            );


        for (
            let i = 1;
            i <= maximum;
            i++
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = i;

            option.textContent =
                `${i} ${
                    i === 1
                        ? "Guest"
                        : "Guests"
                }`;

            select.appendChild(
                option
            );

        }


        document.getElementById(
            "guest-count-help"
        ).textContent =
            `${spotsRemaining} ${
                Number(spotsRemaining) === 1
                    ? "spot"
                    : "spots"
            } currently available.`;

    }


    /* =====================================================
       TOTAL
       ===================================================== */

    document.getElementById(
        "guest-count"
    ).addEventListener(
        "change",
        updateTotal
    );


    function updateTotal() {

        const guests =
            Number(
                document.getElementById(
                    "guest-count"
                ).value
            );


        if (
            !classData ||
            !guests
        ) {

            document.getElementById(
                "booking-total"
            ).textContent =
                "$0.00";

            return;

        }


        const total =
            guests *
            Number(classData.price);


        document.getElementById(
            "booking-total"
        ).textContent =
            `$${total.toFixed(2)}`;

    }


    /* =====================================================
       SUBMIT BOOKING
       ===================================================== */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!classData) {
                return;
            }


            const submitButton =
                document.getElementById(
                    "booking-submit"
                );


            const errorBox =
                document.getElementById(
                    "booking-form-error"
                );


            errorBox.hidden = true;


            const guestCount =
                Number(
                    document.getElementById(
                        "guest-count"
                    ).value
                );


            const name =
                document.getElementById(
                    "customer-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "customer-email"
                ).value.trim();


            const phone =
                document.getElementById(
                    "customer-phone"
                ).value.trim();


            const notes =
                document.getElementById(
                    "booking-notes"
                ).value.trim();


            if (
                !guestCount ||
                guestCount < 1
            ) {

                showFormError(
                    "Please select the number of guests."
                );

                return;

            }


            if (!name) {

                showFormError(
                    "Please enter your name."
                );

                return;

            }


            if (!email) {

                showFormError(
                    "Please enter your email address."
                );

                return;

            }


            /*
             * Disable the button while the request
             * is being processed.
             */

            submitButton.disabled = true;

            submitButton.textContent =
                "Submitting...";


            try {

                /*
                 * The database function performs the
                 * FINAL capacity check.
                 */

                const {
                    data,
                    error
                } = await supabaseClient.rpc(
                    "book_cocktail_class",
                    {
                        p_class_id:
                            classData.id,

                        p_customer_name:
                            name,

                        p_customer_email:
                            email,

                        p_customer_phone:
                            phone || null,

                        p_number_of_guests:
                            guestCount,

                        p_notes:
                            notes || null
                    }
                );


                if (error) {
                    throw error;
                }


                const result =
                    Array.isArray(data)
                        ? data[0]
                        : data;


                /*
                 * Database rejected the booking.
                 *
                 * Most likely another customer booked
                 * the remaining spots while this customer
                 * was filling out the form.
                 */

                if (
                    !result ||
                    result.success !== true
                ) {

                    showFormError(
                        result?.error ||
                        "We're sorry, those spots are no longer available."
                    );


                    /*
                     * Reload current availability.
                     */

                    await loadClass();


                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Request My Spots";

                    return;

                }


                /*
                 * Success.
                 */

                showSuccess(
                    result
                );


            } catch (error) {

                console.error(
                    "Booking error:",
                    error
                );


                showFormError(
                    "Something went wrong while submitting your request. Please try again."
                );


                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Request My Spots";

            }

        }
    );


    /* =====================================================
       SUCCESS
       ===================================================== */

    function showSuccess(
        result
    ) {

        layout.hidden = true;

        success.hidden = false;


        const remaining =
            Number(
                result.spots_remaining
            );


        document.getElementById(
            "booking-success-message"
        ).textContent =
            `We've received your request for ${
                document.getElementById(
                    "guest-count"
                ).value
            } ${
                Number(
                    document.getElementById(
                        "guest-count"
                    ).value
                ) === 1
                    ? "guest"
                    : "guests"
            }. Elysium will contact you with confirmation details. ${
                remaining > 0
                    ? `${remaining} spots remain in this class.`
                    : ""
            }`;

    }


    /* =====================================================
       UNAVAILABLE
       ===================================================== */

    function showUnavailable() {

        loading.hidden = true;

        layout.hidden = true;

        unavailable.hidden = false;

    }


    /* =====================================================
       FORM ERROR
       ===================================================== */

    function showFormError(
        message
    ) {

        const errorBox =
            document.getElementById(
                "booking-form-error"
            );


        errorBox.textContent =
            message;

        errorBox.hidden = false;

        errorBox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /* =====================================================
       DATE
       ===================================================== */

    function formatDate(
        dateString
    ) {

        const date =
            new Date(
                `${dateString}T12:00:00`
            );


        return new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        ).format(date);

    }


    /* =====================================================
       TIME
       ===================================================== */

    function formatTime(
        timeString
    ) {

        if (!timeString) {
            return "";
        }


        const [
            hours,
            minutes
        ] =
            timeString
                .split(":")
                .map(Number);


        const date =
            new Date();


        date.setHours(
            hours,
            minutes,
            0,
            0
        );


        return new Intl.DateTimeFormat(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(date);

    }


    function formatTimeRange(
        start,
        end
    ) {

        const startTime =
            formatTime(start);

        const endTime =
            formatTime(end);


        return endTime
            ? `${startTime} – ${endTime}`
            : startTime;

    }


    /* =====================================================
       ATTRIBUTE ESCAPING
       ===================================================== */

    function escapeAttribute(
        value
    ) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            );

    }


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadClass();

});