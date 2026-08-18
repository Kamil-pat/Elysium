/* =========================================================
   PRIVATE ROOM REQUEST MANAGER
   ========================================================= */

    async function loadPrivateRoomManager() {

        const container =
            document.getElementById(
                "privateRoomManager"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-loading">
                Loading private room requests...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("private_room_bookings")
                    .select(`
                        id,
                        slot_id,
                        customer_name,
                        customer_email,
                        customer_phone,
                        guest_count,
                        event_type,
                        notes,
                        status,
                        created_at,
                        preferred_start_time,
                        preferred_end_time,
                        request_number,

                        private_room_slots (
                            reservation_date,
                            start_time,
                            end_time,
                            title,
                            description
                        )
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {
                throw error;
            }


            renderPrivateRoomRequests(
                container,
                data || []
            );


        } catch (error) {

            console.error(
                "Private room request loading error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty-state">

                    <span>!</span>

                    <p>
                        Unable to load private room requests.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Unknown error"
                        )}
                    </small>

                </div>
            `;

        }

    }


    /* =========================================================
    RENDER REQUESTS
    ========================================================= */

    function renderPrivateRoomRequests(
        container,
        requests
    ) {

        if (!requests.length) {

            container.innerHTML = `
                <div class="admin-empty-state">

                    <span>◇</span>

                    <p>
                        No private room requests yet.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = `

            <div
                class="private-room-request-list"
            >

                ${
                    requests
                        .map(
                            renderPrivateRoomRequest
                        )
                        .join("")
                }

            </div>

        `;


        attachPrivateRoomRequestActions();

    }


    /* =========================================================
    RENDER SINGLE REQUEST
    ========================================================= */

    function renderPrivateRoomRequest(request) {

        const slot =
            request.private_room_slots ||
            {};

        const status =
            request.status ||
            "pending";

        const reservationDate =
            formatPrivateRoomDate(
                slot.reservation_date
            );

        const startTime =
            formatPrivateRoomTime(
                request.preferred_start_time
            );

        const endTime =
            formatPrivateRoomTime(
                request.preferred_end_time
            );

        const requestNumber =
            request.request_number ||
            "";

        return `

            <article
                class="private-room-booking-card"
                data-request-id="${escapeAttribute(
                    request.id
                )}"
            >

                <!-- =========================================
                    CARD HEADER
                    ========================================= -->

                <div class="private-room-card-header">

                    <div>

                        <span class="admin-eyebrow">
                            PRIVATE EVENT
                        </span>

                        <h3>
                            ${escapeHtml(
                                request.customer_name ||
                                "Unnamed Guest"
                            )}
                        </h3>

                        <h2>
                            ${escapeHtml(
                                request.request_number
                            )}
                        </h2>

                    </div>

                    <span
                        class="
                            admin-status
                            ${escapeHtml(status)}
                        "
                    >
                        ${escapeHtml(status)}
                    </span>

                </div>


                <!-- =========================================
                    EVENT INFORMATION
                    ========================================= -->

                <div class="private-room-card-event">

                    <div class="private-room-event-main">

                        <span class="private-room-event-icon">
                            ◇
                        </span>

                        <div>

                            <strong>
                                ${escapeHtml(
                                    slot.title ||
                                    "Private Room"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    reservationDate
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="private-room-event-time">

                        <strong>
                            ${escapeHtml(
                                startTime
                            )}

                            ${
                                endTime
                                    ? `
                                        – 
                                        ${escapeHtml(
                                            endTime
                                        )}
                                    `
                                    : ""
                            }
                        </strong>

                        <span>
                            ${
                                Number(
                                    request.guest_count
                                ) || 0
                            }
                            guests
                        </span>

                    </div>

                </div>


                <!-- =========================================
                    CUSTOMER INFORMATION
                    ========================================= -->

                <div class="private-room-card-grid">

                    <div class="private-room-info">

                        <span>
                            EMAIL
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.customer_email ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="private-room-info">

                        <span>
                            PHONE
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.customer_phone ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="private-room-info">

                        <span>
                            EVENT TYPE
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.event_type ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="private-room-info">

                        <span>
                            GUESTS
                        </span>

                        <strong>
                            ${
                                Number(
                                    request.guest_count
                                ) || 0
                            }
                        </strong>

                    </div>

                </div>


                <!-- =========================================
                    NOTES
                    ========================================= -->

                ${
                    request.notes
                        ? `

                            <div
                                class="
                                    private-room-card-notes
                                "
                            >

                                <span>
                                    CUSTOMER NOTES
                                </span>

                                <p>
                                    ${escapeHtml(
                                        request.notes
                                    )}
                                </p>

                            </div>

                        `
                        : ""
                }


                <!-- =========================================
                    SLOT DESCRIPTION
                    ========================================= -->

                ${
                    slot.description
                        ? `

                            <div
                                class="
                                    private-room-card-notes
                                "
                            >

                                <span>
                                    ROOM DETAILS
                                </span>

                                <p>
                                    ${escapeHtml(
                                        slot.description
                                    )}
                                </p>

                            </div>

                        `
                        : ""
                }


                <!-- =========================================
                    FOOTER
                    ========================================= -->

                <div class="private-room-card-footer">

                    <div>

                        <span>
                            Submitted
                        </span>

                        <strong>
                            ${formatPrivateRoomDateTime(
                                request.created_at
                            )}
                        </strong>

                    </div>


                    <div
                        class="
                            private-room-card-actions
                        "
                    >

                        <select
                            class="
                                admin-form-select
                                private-room-status-select
                            "
                            data-request-id="${escapeAttribute(
                                request.id
                            )}"
                        >

                            <option
                                value="pending"
                                ${
                                    status ===
                                    "pending"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pending
                            </option>

                            <option
                                value="confirmed"
                                ${
                                    status ===
                                    "confirmed"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Confirmed
                            </option>

                            <option
                                value="declined"
                                ${
                                    status ===
                                    "declined"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Declined
                            </option>

                        </select>


                        <button
                            type="button"
                            class="
                                admin-gold-button
                                private-room-save-status
                            "
                            data-request-id="${escapeAttribute(
                                request.id
                            )}"
                        >
                            SAVE
                        </button>


                        <button
                            type="button"
                            class="
                                private-room-delete-button
                            "
                            data-request-id="${escapeAttribute(
                                request.id
                            )}"
                        >
                            DELETE
                        </button>

                    </div>

                </div>

            </article>

        `;
    }


    /* =========================================================
    STATUS ACTIONS
    ========================================================= */

    function attachPrivateRoomRequestActions() {

        /*
        * SAVE STATUS
        */

        document
            .querySelectorAll(
                ".private-room-save-status"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const requestId =
                                button.dataset
                                    .requestId;


                            const select =
                                document.querySelector(
                                    `.private-room-status-select[data-request-id="${requestId}"]`
                                );


                            if (!select) {
                                return;
                            }


                            await updatePrivateRoomStatus(
                                requestId,
                                select.value,
                                button
                            );

                        }
                    );

                }
            );


        /*
        * DELETE BOOKING
        */

        document
            .querySelectorAll(
                ".private-room-delete-button"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const requestId =
                                button.dataset
                                    .requestId;


                            await deletePrivateRoomBooking(
                                requestId,
                                button
                            );

                        }
                    );

                }
            );

    }


    /* =========================================================
    UPDATE STATUS
    ========================================================= */

    async function updatePrivateRoomStatus(
        requestId,
        status,
        button
    ) {

        const originalText =
            button.textContent;


        button.disabled =
            true;

        button.textContent =
            "SAVING...";


        try {

            const {
                error
            } =
                await window.supabaseClient
                    .from(
                        "private_room_bookings"
                    )
                    .update({
                        status: status
                    })
                    .eq(
                        "id",
                        requestId
                    );


            if (error) {
                throw error;
            }


            await loadPrivateRoomManager();


            /*
            * Refresh dashboard counts/recent requests
            * if those functions are available.
            */

            if (
                typeof loadDashboardData ===
                "function"
            ) {

                await loadDashboardData();

            }


        } catch (error) {

            console.error(
                "Private room status update error:",
                error
            );


            alert(
                error.message ||
                "Unable to update request status."
            );


            button.disabled =
                false;

            button.textContent =
                originalText;

        }

    }


    /* =========================================================
    DATE FORMATTING
    ========================================================= */

    function formatPrivateRoomDate(
        value
    ) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(
                `${value}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

        }


        return date.toLocaleDateString(
            undefined,
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

    }

        /* =========================================================
    DELETE PRIVATE ROOM BOOKING
    ========================================================= */

    async function deletePrivateRoomBooking(
        requestId,
        button
    ) {

        const confirmed =
            window.confirm(
                "Are you sure you want to permanently delete this private room booking?"
            );


        if (!confirmed) {
            return;
        }


        const card =
            button.closest(
                ".private-room-booking-card"
            );


        const originalText =
            button.textContent;


        button.disabled =
            true;

        button.textContent =
            "DELETING...";


        try {

            const {
                error
            } =
                await window.supabaseClient
                    .from(
                        "private_room_bookings"
                    )
                    .delete()
                    .eq(
                        "id",
                        requestId
                    );


            if (error) {
                throw error;
            }


            /*
            * Remove the card immediately.
            */

            if (card) {

                card.classList.add(
                    "private-room-card-removing"
                );


                setTimeout(
                    () => {

                        card.remove();

                    },
                    250
                );

            }


            /*
            * Refresh dashboard information.
            */

            if (
                typeof loadDashboardData ===
                "function"
            ) {

                await loadDashboardData();

            }


            /*
            * If there are no cards left,
            * reload the manager so the
            * "No requests" message appears.
            */

            const remainingCards =
                document.querySelectorAll(
                    ".private-room-booking-card"
                );


            if (
                remainingCards.length === 0
            ) {

                await loadPrivateRoomManager();

            }


        } catch (error) {

            console.error(
                "Private room booking deletion error:",
                error
            );


            alert(
                error.message ||
                "Unable to delete this booking."
            );


            button.disabled =
                false;

            button.textContent =
                originalText;

        }

    }


    /* =========================================================
    TIME FORMATTING
    ========================================================= */

    function formatPrivateRoomTime(
        value
    ) {

        if (!value) {
            return "";
        }


        const parts =
            value
                .split(":");


        if (
            parts.length < 2
        ) {

            return value;

        }


        const hours =
            Number(
                parts[0]
            );


        const minutes =
            parts[1];


        if (
            Number.isNaN(hours)
        ) {

            return value;

        }


        const suffix =
            hours >= 12
                ? "PM"
                : "AM";


        const displayHour =
            hours % 12 ||
            12;


        return `${displayHour}:${minutes} ${suffix}`;

    }


    /* =========================================================
    CREATED DATE/TIME
    ========================================================= */

    function formatPrivateRoomDateTime(
        value
    ) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleString(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }