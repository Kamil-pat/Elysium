/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   COCKTAIL CLASS MANAGER
   ========================================================= */


/* =========================================================
   STATE
   ========================================================= */

let cocktailClasses = [];

let editingCocktailClassId = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeCocktailClassManager() {

    await loadCocktailClasses();

}


/* =========================================================
   LOAD CLASSES
   ========================================================= */

async function loadCocktailClasses() {

    const container =
        document.getElementById(
            "cocktailClassManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-loading">
            Loading cocktail classes...
        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("cocktail_classes")
                .select("*")
                .order(
                    "class_date",
                    {
                        ascending: true
                    }
                )
                .order(
                    "start_time",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        cocktailClasses =
            data || [];


        await loadBookingCounts();


        renderCocktailClasses();


    } catch (error) {

        console.error(
            "Unable to load cocktail classes:",
            error
        );


        container.innerHTML = `

            <div class="admin-empty-state">

                <span>!</span>

                <p>
                    Unable to load cocktail classes.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   LOAD BOOKING COUNTS
   ========================================================= */

async function loadBookingCounts() {

    if (
        !cocktailClasses.length
    ) {

        return;

    }


    try {

        const classIds =
            cocktailClasses.map(
                (item) => item.id
            );


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "cocktail_class_bookings"
                )
                .select(
                    "class_id, number_of_guests, status"
                )
                .in(
                    "class_id",
                    classIds
                );


        if (error) {

            throw error;

        }


        const bookings =
            data || [];


        cocktailClasses =
            cocktailClasses.map(
                (classItem) => {

                    /*
                     * We count all bookings except
                     * explicitly declined/cancelled ones.
                     *
                     * Pending bookings therefore temporarily
                     * hold their requested spots.
                     */

                    const classBookings =
                        bookings.filter(
                            (booking) =>
                                booking.class_id ===
                                classItem.id
                        );


                    const bookedGuests =
                        classBookings.reduce(
                            (
                                total,
                                booking
                            ) => {

                                const status =
                                    String(
                                        booking.status ||
                                        "pending"
                                    ).toLowerCase();


                                if (
                                    status ===
                                        "declined" ||
                                    status ===
                                        "cancelled" ||
                                    status ===
                                        "canceled"
                                ) {

                                    return total;

                                }


                                return (
                                    total +
                                    (
                                        Number(
                                            booking.number_of_guests
                                        ) || 0
                                    )
                                );

                            },
                            0
                        );


                    return {

                        ...classItem,

                        bookedGuests,

                        remainingSpots:
                            Math.max(
                                0,
                                (
                                    Number(
                                        classItem.capacity
                                    ) || 0
                                ) -
                                bookedGuests
                            )

                    };

                }
            );


    } catch (error) {

        console.error(
            "Unable to load booking counts:",
            error
        );


        cocktailClasses =
            cocktailClasses.map(
                (classItem) => ({

                    ...classItem,

                    bookedGuests: 0,

                    remainingSpots:
                        Number(
                            classItem.capacity
                        ) || 0

                })
            );

    }

}


/* =========================================================
   RENDER CLASSES
   ========================================================= */

function renderCocktailClasses() {

    const container =
        document.getElementById(
            "cocktailClassManager"
        );


    if (!container) {

        return;

    }


    if (
        !cocktailClasses.length
    ) {

        container.innerHTML = `

            <div class="admin-empty-state">

                <span>◯</span>

                <p>
                    No cocktail classes have been created yet.
                </p>

                <button
                    type="button"
                    class="admin-gold-button"
                    id="emptyAddClassButton"
                >
                    + ADD COCKTAIL CLASS
                </button>

            </div>

        `;


        const emptyButton =
            document.getElementById(
                "emptyAddClassButton"
            );


        if (emptyButton) {

            emptyButton.addEventListener(
                "click",
                () => {
                    openCocktailClassModal();
                }
            );

        }


        return;

    }


    container.innerHTML = `

        <div class="admin-section-toolbar">

            <div>
                <p class="admin-eyebrow">
                    EXPERIENCES
                </p>

                <h2>
                    Cocktail Classes
                </h2>

                <p class="admin-toolbar-description">
                    Create and manage cocktail classes,
                    availability, capacity, and registrations.
                </p>
            </div>

            <button
                type="button"
                class="admin-gold-button"
                id="addCocktailClassButton"
            >
                + ADD COCKTAIL CLASS
            </button>

        </div>


        <div class="admin-class-list">

            ${
                cocktailClasses
                    .map(
                        renderCocktailClass
                    )
                    .join("")
            }

        </div>

    `;
    
    document
        .getElementById(
            "addCocktailClassButton"
        )
        .addEventListener(
            "click",
            () => {
                openCocktailClassModal();
            }
        );

    attachClassActionListeners();

}


/* =========================================================
   RENDER ONE CLASS
   ========================================================= */

function renderCocktailClass(
    classItem
) {

    const booked =
        Number(
            classItem.bookedGuests
        ) || 0;


    const capacity =
        Number(
            classItem.capacity
        ) || 0;


    const remaining =
        Math.max(
            0,
            capacity - booked
        );


    const soldOut =
        capacity > 0 &&
        remaining === 0;


    const visible =
        classItem.is_visible !== false;


    const classDate =
        formatClassDate(
            classItem.class_date
        );


    const startTime =
        formatClassTime(
            classItem.start_time
        );


    const endTime =
        classItem.end_time
            ? formatClassTime(
                classItem.end_time
            )
            : "";


    return `

        <article
            class="admin-class-card"
            data-class-id="${escapeAttribute(
                classItem.id
            )}"
        >

            ${
                classItem.image_url
                ? `
                    <div
                        class="admin-class-card-image"
                    >

                        <img
                            src="${escapeAttribute(
                                classItem.image_url
                            )}"
                            alt="${escapeAttribute(
                                classItem.title ||
                                "Cocktail class"
                            )}"
                        >

                    </div>
                `
                : ""
            }


            <div class="admin-class-card-content">


                <div
                    class="admin-class-card-top"
                >

                    <div>

                        <span
                            class="
                                admin-eyebrow
                            "
                        >
                            COCKTAIL CLASS
                        </span>

                        <h3>
                            ${
                                escapeHtml(
                                    classItem.title ||
                                    "Cocktail Class"
                                )
                            }
                        </h3>

                    </div>


                    <span
                        class="
                            admin-status
                            ${
                                soldOut
                                ? "declined"
                                : visible
                                    ? "confirmed"
                                    : "pending"
                            }
                        "
                    >

                        ${
                            soldOut
                            ? "Sold Out"
                            : visible
                                ? "Active"
                                : "Hidden"
                        }

                    </span>

                </div>


                <div
                    class="admin-class-date"
                >

                    <strong>
                        ${classDate}
                    </strong>

                    <span>
                        ${startTime}
                        ${
                            endTime
                            ? ` – ${endTime}`
                            : ""
                        }
                    </span>

                </div>


                ${
                    classItem.description
                    ? `
                        <p
                            class="
                                admin-class-description
                            "
                        >
                            ${
                                escapeHtml(
                                    classItem.description
                                )
                            }
                        </p>
                    `
                    : ""
                }


                <div
                    class="
                        admin-class-capacity
                    "
                >

                    <div>

                        <span>
                            BOOKED
                        </span>

                        <strong>
                            ${booked}
                        </strong>

                    </div>


                    <div>

                        <span>
                            CAPACITY
                        </span>

                        <strong>
                            ${capacity}
                        </strong>

                    </div>


                    <div>

                        <span>
                            SPOTS LEFT
                        </span>

                        <strong
                            class="
                                ${
                                    soldOut
                                    ? "sold-out"
                                    : ""
                                }
                            "
                        >
                            ${remaining}
                        </strong>

                    </div>


                    ${
                        classItem.price !== null &&
                        classItem.price !== undefined
                        ? `
                            <div>

                                <span>
                                    PRICE
                                </span>

                                <strong>
                                    $${Number(
                                        classItem.price
                                    ).toFixed(2)}
                                </strong>

                            </div>
                        `
                        : ""
                    }

                </div>


                <div
                    class="admin-class-actions"
                >

                    <button
                        type="button"
                        class="admin-secondary-button"
                        data-edit-class="${
                            classItem.id
                        }"
                    >
                        EDIT
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        data-view-class-bookings="${
                            classItem.id
                        }"
                    >
                        BOOKINGS
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        data-toggle-class="${
                            classItem.id
                        }"
                    >
                        ${
                            visible
                            ? "HIDE"
                            : "SHOW"
                        }
                    </button>


                    <button
                        type="button"
                        class="admin-danger-button"
                        data-delete-class="${
                            classItem.id
                        }"
                    >
                        DELETE
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   ACTION LISTENERS
   ========================================================= */

function attachClassActionListeners() {

    document
        .querySelectorAll(
            "[data-edit-class]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        openCocktailClassModal(
                            button.dataset.editClass
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-toggle-class]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleCocktailClassVisibility(
                            button.dataset.toggleClass
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-delete-class]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteCocktailClass(
                            button.dataset.deleteClass
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-view-class-bookings]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        viewCocktailClassBookings(
                            button.dataset
                                .viewClassBookings
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ADD / EDIT MODAL
   ========================================================= */

function openCocktailClassModal(
    classId = null
) {

    editingCocktailClassId =
        classId;


    const existing =
        classId
        ? cocktailClasses.find(
            (item) =>
                item.id === classId
        )
        : null;


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "cocktailClassModal";


    modal.className =
        "admin-modal-overlay";


    modal.innerHTML = `

        <div
            class="admin-modal"
        >

            <div
                class="admin-modal-header"
            >

                <div>

                    <p
                        class="admin-eyebrow"
                    >
                        ${
                            existing
                            ? "EDIT CLASS"
                            : "NEW EXPERIENCE"
                        }
                    </p>

                    <h2>
                        ${
                            existing
                            ? "Edit Cocktail Class"
                            : "Add Cocktail Class"
                        }
                    </h2>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeCocktailClassModal"
                >
                    ×
                </button>

            </div>


            <form
                id="cocktailClassForm"
                class="admin-class-form"
            >


                <div
                    class="admin-form-grid"
                >

                    <div
                        class="
                            admin-form-group
                            admin-form-full
                        "
                    >

                        <label
                            for="classTitle"
                        >
                            Class Name
                        </label>

                        <input
                            type="text"
                            id="classTitle"
                            required
                            value="${escapeAttribute(
                                existing?.title ||
                                ""
                            )}"
                            placeholder="Cocktail Class"
                        >

                    </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="classDate"
                        >
                            Date
                        </label>

                        <input
                            type="date"
                            id="classDate"
                            required
                            value="${escapeAttribute(
                                existing?.class_date ||
                                ""
                            )}"
                        >

                    </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="classCapacity"
                        >
                            Capacity
                        </label>

                        <input
                            type="number"
                            id="classCapacity"
                            min="1"
                            step="1"
                            required
                            value="${existing?.capacity ?? ""}"
                            placeholder="20"
                        >

                    </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="classStartTime"
                        >
                            Start Time
                        </label>

                        <input
                            type="time"
                            id="classStartTime"
                            required
                            value="${escapeAttribute(
                                existing?.start_time ||
                                ""
                            )}"
                        >

                    </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="classEndTime"
                        >
                            End Time
                        </label>

                        <input
                            type="time"
                            id="classEndTime"
                            value="${escapeAttribute(
                                existing?.end_time ||
                                ""
                            )}"
                        >

                    </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="classPrice"
                        >
                            Price Per Guest
                        </label>

                        <input
                            type="number"
                            id="classPrice"
                            min="0"
                            step="0.01"
                            value="${
                                existing?.price ??
                                ""
                            }"
                            placeholder="75.00"
                        >

                    </div>


                    <div
                        class="
                            admin-form-group
                            admin-form-full
                        "
                    >

                        <label for="classImageFile">
                            Class Image
                        </label>

                        <input
                            type="file"
                            id="classImageFile"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                        >

                        <small class="admin-form-help">
                            Choose an image from your computer.
                            Maximum size: 10 MB.
                        </small>


                        ${
                            existing?.image_url
                            ? `
                                <div class="admin-class-image-preview">

                                    <img
                                        src="${escapeAttribute(
                                            existing.image_url
                                        )}"
                                        alt="Current cocktail class image"
                                        id="currentClassImage"
                                    >

                                    <span>
                                        Current class image
                                    </span>

                                </div>
                            `
                            : ""
                        }

                    </div>


                    <div
                        class="
                            admin-form-group
                            admin-form-full
                        "
                    >

                        <label
                            for="classDescription"
                        >
                            Description
                        </label>

                        <textarea
                            id="classDescription"
                            rows="5"
                            placeholder="Describe the cocktail class..."
                        >${
                            escapeHtml(
                                existing?.description ||
                                ""
                            )
                        }</textarea>

                    </div>


                    <div
                        class="
                            admin-form-group
                            admin-checkbox-group
                            admin-form-full
                        "
                    >

                        <label
                            class="admin-checkbox-label"
                        >

                            <input
                                type="checkbox"
                                id="classVisible"
                                ${
                                    existing?.is_visible !==
                                    false
                                    ? "checked"
                                    : ""
                                }
                            >

                            <span>
                                Show this class on the
                                public website
                            </span>

                        </label>

                    </div>

                </div>


                <div
                    id="cocktailClassFormError"
                    class="admin-form-error"
                    hidden
                ></div>


                <div
                    class="admin-modal-footer"
                >

                    <button
                        type="button"
                        class="admin-secondary-button"
                        id="cancelCocktailClass"
                    >
                        CANCEL
                    </button>


                    <button
                        type="submit"
                        class="admin-gold-button"
                        id="saveCocktailClass"
                    >
                        ${
                            existing
                            ? "SAVE CHANGES"
                            : "CREATE CLASS"
                        }
                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeCocktailClassModal"
        )
        .addEventListener(
            "click",
            closeCocktailClassModal
        );


    document
        .getElementById(
            "cancelCocktailClass"
        )
        .addEventListener(
            "click",
            closeCocktailClassModal
        );


    document
        .getElementById(
            "cocktailClassForm"
        )
        .addEventListener(
            "submit",
            saveCocktailClass
        );


    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                closeCocktailClassModal();

            }

        }
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCocktailClassModal() {

    const modal =
        document.getElementById(
            "cocktailClassModal"
        );


    if (modal) {

        modal.remove();

    }


    editingCocktailClassId =
        null;

}


/* =========================================================
   SAVE CLASS
   ========================================================= */

async function saveCocktailClass(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveCocktailClass"
        );


    const errorElement =
        document.getElementById(
            "cocktailClassFormError"
        );


    const title =
        document.getElementById(
            "classTitle"
        ).value.trim();


    const classDate =
        document.getElementById(
            "classDate"
        ).value;


    const startTime =
        document.getElementById(
            "classStartTime"
        ).value;


    const endTime =
        document.getElementById(
            "classEndTime"
        ).value || null;


    const capacity =
        Number(
            document.getElementById(
                "classCapacity"
            ).value
        );


    const priceValue =
        document.getElementById(
            "classPrice"
        ).value;


    const price =
        priceValue === ""
        ? null
        : Number(
            priceValue
        );


    const imageFile =
        document.getElementById(
            "classImageFile"
        ).files[0];

    let imageUrl = null;

    if (editingCocktailClassId) {

        const currentClass =
            cocktailClasses.find(
                (item) =>
                    item.id ===
                    editingCocktailClassId
            );

        imageUrl =
            currentClass?.image_url ||
            null;
    }


    if (imageFile) {

        imageUrl =
            await uploadCocktailClassImage(
                imageFile
            );

    }


    const description =
        document.getElementById(
            "classDescription"
        ).value.trim() ||
        null;


    const isVisible =
        document.getElementById(
            "classVisible"
        ).checked;


    if (
        !title ||
        !classDate ||
        !startTime ||
        !capacity
    ) {

        showClassFormError(
            "Please complete all required fields."
        );

        return;

    }


    if (
        capacity < 1
    ) {

        showClassFormError(
            "Capacity must be at least 1."
        );

        return;

    }


    if (
        price !== null &&
        (
            Number.isNaN(price) ||
            price < 0
        )
    ) {

        showClassFormError(
            "Please enter a valid price."
        );

        return;

    }


    /*
     * Don't allow a class to be created in the past.
     */

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    if (
        classDate < today
    ) {

        showClassFormError(
            "The class date cannot be in the past."
        );

        return;

    }


    button.disabled =
        true;

    button.textContent =
        editingCocktailClassId
        ? "SAVING..."
        : "CREATING...";



    try {

        const payload = {

            class_date:
                classDate,

            start_time:
                startTime,

            end_time:
                endTime,

            title:
                title,

            description:
                description,

            capacity:
                capacity,

            price:
                price,

            image_url:
                imageUrl,

            is_visible:
                isVisible

        };


        let result;


        if (
            editingCocktailClassId
        ) {

            result =
                await window.supabaseClient
                    .from(
                        "cocktail_classes"
                    )
                    .update(
                        {
                            ...payload,

                            updated_at:
                                new Date()
                                    .toISOString()

                        }
                    )
                    .eq(
                        "id",
                        editingCocktailClassId
                    )
                    .select()
                    .single();

        } else {

            result =
                await window.supabaseClient
                    .from(
                        "cocktail_classes"
                    )
                    .insert(
                        payload
                    )
                    .select()
                    .single();

        }


        if (result.error) {

            throw result.error;

        }


        closeCocktailClassModal();


        await loadCocktailClasses();


    } catch (error) {

        console.error(
            "Unable to save cocktail class:",
            error
        );


        showClassFormError(
            error.message ||
            "Unable to save the cocktail class."
        );


        button.disabled =
            false;

        button.textContent =
            editingCocktailClassId
            ? "SAVE CHANGES"
            : "CREATE CLASS";

    }

}


/* =========================================================
   DELETE CLASS
   ========================================================= */

async function deleteCocktailClass(
    classId
) {

    const classItem =
        cocktailClasses.find(
            (item) =>
                item.id === classId
        );


    if (!classItem) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${classItem.title || "this cocktail class"}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from(
                    "cocktail_classes"
                )
                .delete()
                .eq(
                    "id",
                    classId
                );


        if (error) {

            /*
             * If bookings reference this class,
             * PostgreSQL may prevent deletion.
             */

            console.error(
                "Class deletion error:",
                error
            );


            alert(
                "This class could not be deleted. If customers have already registered, you may need to cancel/hide the class instead."
            );


            return;

        }


        await loadCocktailClasses();


    } catch (error) {

        console.error(
            "Delete class exception:",
            error
        );


        alert(
            "Unable to delete this cocktail class."
        );

    }

}


/* =========================================================
   HIDE / SHOW CLASS
   ========================================================= */

async function toggleCocktailClassVisibility(
    classId
) {

    const classItem =
        cocktailClasses.find(
            (item) =>
                item.id === classId
        );


    if (!classItem) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from(
                    "cocktail_classes"
                )
                .update(
                    {
                        is_visible:
                            !classItem.is_visible,

                        updated_at:
                            new Date()
                                .toISOString()

                    }
                )
                .eq(
                    "id",
                    classId
                );


        if (error) {

            throw error;

        }


        await loadCocktailClasses();


    } catch (error) {

        console.error(
            "Visibility update error:",
            error
        );


        alert(
            "Unable to update class visibility."
        );

    }

}


/* =========================================================
   VIEW BOOKINGS
   ========================================================= */

async function viewCocktailClassBookings(
    classId
) {

    const classItem =
        cocktailClasses.find(
            (item) =>
                item.id === classId
        );


    if (!classItem) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "cocktail_class_bookings"
                )
                .select("*")
                .eq(
                    "class_id",
                    classId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        renderBookingsModal(
            classItem,
            data || []
        );


    } catch (error) {

        console.error(
            "Unable to load class bookings:",
            error
        );


        alert(
            "Unable to load class bookings."
        );

    }

}


/* =========================================================
   BOOKINGS MODAL
   ========================================================= */

function renderBookingsModal(
    classItem,
    bookings
) {

    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "admin-modal-overlay";


    const activeBookings =
        bookings.filter(
            (booking) => {

                const status =
                    String(
                        booking.status ||
                        "pending"
                    ).toLowerCase();


                return (
                    status !== "declined" &&
                    status !== "cancelled" &&
                    status !== "canceled"
                );

            }
        );


    const bookedGuests =
        activeBookings.reduce(
            (
                total,
                booking
            ) => {

                return (
                    total +
                    (
                        Number(
                            booking.number_of_guests
                        ) || 0
                    )
                );

            },
            0
        );


    modal.innerHTML = `

        <div
            class="admin-modal admin-bookings-modal"
        >

            <div
                class="admin-modal-header"
            >

                <div>

                    <p
                        class="admin-eyebrow"
                    >
                        REGISTRATIONS
                    </p>

                    <h2>
                        ${
                            escapeHtml(
                                classItem.title ||
                                "Cocktail Class"
                            )
                        }
                    </h2>

                    <p
                        class="
                            admin-modal-subtitle
                        "
                    >
                        ${
                            formatClassDate(
                                classItem.class_date
                            )
                        }
                        ·
                        ${
                            formatClassTime(
                                classItem.start_time
                            )
                        }
                    </p>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeBookingsModal"
                >
                    ×
                </button>

            </div>


            <div
                class="admin-booking-summary"
            >

                <div>

                    <span>
                        CAPACITY
                    </span>

                    <strong>
                        ${classItem.capacity}
                    </strong>

                </div>


                <div>

                    <span>
                        BOOKED
                    </span>

                    <strong>
                        ${bookedGuests}
                    </strong>

                </div>


                <div>

                    <span>
                        SPOTS LEFT
                    </span>

                    <strong>
                        ${
                            Math.max(
                                0,
                                Number(
                                    classItem.capacity
                                ) -
                                bookedGuests
                            )
                        }
                    </strong>

                </div>

            </div>


            <div
                class="admin-bookings-list"
            >

                ${
                    bookings.length
                    ? bookings
                        .map(
                            renderBookingRow
                        )
                        .join("")
                    : `
                        <div
                            class="
                                admin-empty-state
                            "
                        >

                            <span>
                                ◯
                            </span>

                            <p>
                                No registrations yet.
                            </p>

                        </div>
                    `
                }

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeBookingsModal"
        )
        .addEventListener(
            "click",
            () => modal.remove()
        );


    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

            }

        }
    );

}


/* =========================================================
   BOOKING ROW
   ========================================================= */

function renderBookingRow(
    booking
) {

    const status =
        String(
            booking.status ||
            "pending"
        ).toLowerCase();


    return `

        <div
            class="admin-booking-row"
        >

            <div>

                <strong>
                    ${
                        escapeHtml(
                            booking.customer_name
                        )
                    }
                </strong>

                <span>
                    ${
                        escapeHtml(
                            booking.customer_email
                        )
                    }
                </span>

                ${
                    booking.customer_phone
                    ? `
                        <span>
                            ${
                                escapeHtml(
                                    booking.customer_phone
                                )
                            }
                        </span>
                    `
                    : ""
                }

            </div>


            <div>

                <strong>
                    ${
                        Number(
                            booking.number_of_guests
                        ) || 0
                    }
                    guests
                </strong>

                <span>
                    ${
                        formatBookingStatus(
                            status
                        )
                    }
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   FORM ERROR
   ========================================================= */

function showClassFormError(
    message
) {

    const element =
        document.getElementById(
            "cocktailClassFormError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;

    element.hidden =
        false;

}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatClassDate(
    dateString
) {

    if (!dateString) {

        return "Date unavailable";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* =========================================================
   TIME FORMATTING
   ========================================================= */

function formatClassTime(
    timeString
) {

    if (!timeString) {

        return "";

    }


    const parts =
        String(
            timeString
        ).split(":");


    if (
        parts.length < 2
    ) {

        return timeString;

    }


    let hours =
        Number(
            parts[0]
        );


    const minutes =
        parts[1];


    if (
        Number.isNaN(hours)
    ) {

        return timeString;

    }


    const period =
        hours >= 12
        ? "PM"
        : "AM";


    hours =
        hours % 12 || 12;


    return `${hours}:${minutes} ${period}`;

}


/* =========================================================
   BOOKING STATUS
   ========================================================= */

function formatBookingStatus(
    status
) {

    if (
        status === "confirmed"
    ) {

        return "Confirmed";

    }


    if (
        status === "declined"
    ) {

        return "Declined";

    }


    if (
        status === "cancelled" ||
        status === "canceled"
    ) {

        return "Cancelled";

    }


    return "Pending";

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}

/* =========================================================
   COCKTAIL CLASS IMAGE UPLOAD
   ========================================================= */

async function uploadCocktailClassImage(file) {

    if (!file) {

        throw new Error(
            "No image was selected."
        );

    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Please upload a JPG, PNG, WEBP, or AVIF image."
        );

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "The image must be smaller than 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const storagePath =
        `cocktail-classes/${fileName}`;


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                "elysium-media"
            )
            .upload(
                storagePath,
                file,
                {
                    cacheControl:
                        "3600",

                    contentType:
                        file.type,

                    upsert:
                        false
                }
            );


    if (error) {

        throw error;

    }


    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(
                "elysium-media"
            )
            .getPublicUrl(
                storagePath
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "The image uploaded, but a public URL could not be created."
        );

    }


    return data.publicUrl;
}