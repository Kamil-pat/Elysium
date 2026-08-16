/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   WEBSITE PHOTO MANAGER
   ========================================================= */

let websitePhotos = [];

let editingPhotoId = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializePhotoManager() {

    await loadWebsitePhotos();

}


/* =========================================================
   LOAD PHOTOS
   ========================================================= */

async function loadWebsitePhotos() {

    const container =
        document.getElementById(
            "photoManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-loading">
            Loading website photos...
        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "website_photos"
                )
                .select("*")
                .order(
                    "display_order",
                    {
                        ascending: true
                    }
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


        websitePhotos =
            data || [];


        renderPhotoManager();


    } catch (error) {

        console.error(
            "Unable to load website photos:",
            error
        );


        container.innerHTML = `

            <div class="admin-empty-state">

                <span>!</span>

                <p>
                    Unable to load website photos.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER PHOTO MANAGER
   ========================================================= */

function renderPhotoManager() {

    const container =
        document.getElementById(
            "photoManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div
            class="admin-section-toolbar"
        >

            <div>

                <p class="admin-eyebrow">
                    WEBSITE MEDIA
                </p>

                <h2>
                    Photos
                </h2>

                <p
                    class="admin-toolbar-description"
                >
                    Upload and manage the images
                    displayed throughout the Elysium website.
                </p>

            </div>


            <button
                type="button"
                class="admin-gold-button"
                id="addPhotoButton"
            >
                + ADD PHOTO
            </button>

        </div>


        ${
            websitePhotos.length
            ? `
                <div
                    class="admin-photo-grid"
                >

                    ${
                        websitePhotos
                            .map(
                                renderPhotoCard
                            )
                            .join("")
                    }

                </div>
            `
            : `
                <div
                    class="admin-empty-state"
                >

                    <span>□</span>

                    <p>
                        No website photos have been added yet.
                    </p>

                    <button
                        type="button"
                        class="admin-gold-button"
                        id="emptyAddPhotoButton"
                    >
                        + ADD PHOTO
                    </button>

                </div>
            `
        }

    `;


    document
        .getElementById(
            "addPhotoButton"
        )
        ?.addEventListener(
            "click",
            () => {
                openPhotoModal();
            }
        );


    document
        .getElementById(
            "emptyAddPhotoButton"
        )
        ?.addEventListener(
            "click",
            () => {
                openPhotoModal();
            }
        );


    attachPhotoActions();

}


/* =========================================================
   PHOTO CARD
   ========================================================= */

function renderPhotoCard(
    photo
) {

    const visible =
        photo.is_visible !== false;


    return `

        <article
            class="admin-photo-card"
            data-photo-id="${escapeAttribute(
                photo.id
            )}"
        >

            <div
                class="admin-photo-preview"
            >

                ${
                    photo.storage_path
                    ? `
                        <img
                            src="${escapeAttribute(
                                getPhotoUrl(
                                    photo.storage_path
                                )
                            )}"
                            alt="${escapeAttribute(
                                photo.title
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div
                            class="admin-photo-no-image"
                        >
                            No Image
                        </div>
                    `
                }


                <span
                    class="
                        admin-photo-visibility
                        ${
                            visible
                            ? "visible"
                            : "hidden"
                        }
                    "
                >
                    ${
                        visible
                        ? "VISIBLE"
                        : "HIDDEN"
                    }
                </span>

            </div>


            <div
                class="admin-photo-card-content"
            >

                <div>

                    <p
                        class="admin-eyebrow"
                    >
                        ${
                            escapeHtml(
                                photo.category
                            )
                        }
                    </p>

                    <h3>
                        ${
                            escapeHtml(
                                photo.title
                            )
                        }
                    </h3>

                    ${
                        photo.description
                        ? `
                            <p>
                                ${
                                    escapeHtml(
                                        photo.description
                                    )
                                }
                            </p>
                        `
                        : ""
                    }

                </div>


                <div
                    class="admin-photo-actions"
                >

                    <button
                        type="button"
                        class="admin-secondary-button"
                        data-edit-photo="${
                            photo.id
                        }"
                    >
                        EDIT
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        data-toggle-photo="${
                            photo.id
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
                        data-delete-photo="${
                            photo.id
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
   PHOTO URL
   ========================================================= */

function getPhotoUrl(
    storagePath
) {

    if (!storagePath) {

        return "";

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


    return data.publicUrl;

}


/* =========================================================
   PHOTO ACTIONS
   ========================================================= */

function attachPhotoActions() {

    document
        .querySelectorAll(
            "[data-edit-photo]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        openPhotoModal(
                            button.dataset.editPhoto
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-toggle-photo]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        togglePhotoVisibility(
                            button.dataset.togglePhoto
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-delete-photo]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deletePhoto(
                            button.dataset.deletePhoto
                        );

                    }
                );

            }
        );

}


/* =========================================================
   PHOTO MODAL
   ========================================================= */

function openPhotoModal(
    photoId = null
) {

    if (
        photoId instanceof Event
    ) {

        photoId = null;

    }


    editingPhotoId =
        photoId;


    const existing =
        photoId
        ? websitePhotos.find(
            (photo) =>
                photo.id === photoId
        )
        : null;


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "photoModal";


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

                    <p class="admin-eyebrow">
                        WEBSITE MEDIA
                    </p>

                    <h2>
                        ${
                            existing
                            ? "Edit Photo"
                            : "Add Photo"
                        }
                    </h2>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closePhotoModal"
                >
                    ×
                </button>

            </div>


            <form
                id="photoForm"
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
                            for="photoFile"
                        >
                            ${
                                existing
                                ? "Replace Image"
                                : "Image"
                            }
                        </label>

                        <input
                            type="file"
                            id="photoFile"
                            accept="image/*"
                            ${
                                existing
                                ? ""
                                : "required"
                            }
                        >

                        <small
                            class="admin-form-help"
                        >
                            JPG, PNG, WEBP, or other standard
                            web image formats.
                        </small>

                    </div>


                    <div
                        class="
                            admin-form-group
                            admin-form-full
                        "
                    >

                        <label
                            for="photoTitle"
                        >
                            Title
                        </label>

                        <input
                            type="text"
                            id="photoTitle"
                            required
                            value="${escapeAttribute(
                                existing?.title ||
                                ""
                            )}"
                            placeholder="Photo title"
                        >

                    </div>


                    <div
    class="admin-form-group"
        >
            <label
                for="photoCategory"
            >
                Category
            </label>

            <select
                id="photoCategory"
                required
            >

                <option value="" disabled>
                    Select a category
                </option>

                <option
                    value="homepage"
                    ${
                        existing?.category === "homepage"
                        ? "selected"
                        : ""
                    }
                >
                    Homepage
                </option>

                <option
                    value="gallery"
                    ${
                        existing?.category === "gallery"
                        ? "selected"
                        : ""
                    }
                >
                    Gallery
                </option>

                <option
                    value="food"
                    ${
                        existing?.category === "food"
                        ? "selected"
                        : ""
                    }
                >
                    Food
                </option>

                <option
                    value="drinks"
                    ${
                        existing?.category === "drinks"
                        ? "selected"
                        : ""
                    }
                >
                    Drinks
                </option>

                <option
                    value="private-events"
                    ${
                        existing?.category === "private-events"
                        ? "selected"
                        : ""
                    }
                >
                    Private Events
                </option>

                <option
                    value="cocktail-classes"
                    ${
                        existing?.category === "cocktail-classes"
                        ? "selected"
                        : ""
                    }
                >
                    Cocktail Classes
                </option>

                <option
                    value="about"
                    ${
                        existing?.category === "about"
                        ? "selected"
                        : ""
                    }
                >
                    About
                </option>

                <option
                    value="other"
                    ${
                        existing?.category === "other"
                        ? "selected"
                        : ""
                    }
                >
                    Other
                </option>

            </select>
        </div>


                    <div
                        class="admin-form-group"
                    >

                        <label
                            for="photoOrder"
                        >
                            Display Order
                        </label>

                        <input
                            type="number"
                            id="photoOrder"
                            min="0"
                            step="1"
                            value="${
                                existing?.display_order ??
                                0
                            }"
                        >

                    </div>


                    <div
                        class="
                            admin-form-group
                            admin-form-full
                        "
                    >

                        <label
                            for="photoDescription"
                        >
                            Description
                        </label>

                        <textarea
                            id="photoDescription"
                            rows="4"
                            placeholder="Optional description..."
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
                                id="photoVisible"
                                ${
                                    existing?.is_visible !==
                                    false
                                    ? "checked"
                                    : ""
                                }
                            >

                            <span>
                                Show this photo on the public website
                            </span>

                        </label>

                    </div>

                </div>


                <div
                    id="photoFormError"
                    class="admin-form-error"
                    hidden
                ></div>


                <div
                    class="admin-modal-footer"
                >

                    <button
                        type="button"
                        class="admin-secondary-button"
                        id="cancelPhoto"
                    >
                        CANCEL
                    </button>


                    <button
                        type="submit"
                        class="admin-gold-button"
                        id="savePhoto"
                    >
                        ${
                            existing
                            ? "SAVE CHANGES"
                            : "UPLOAD PHOTO"
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
            "closePhotoModal"
        )
        .addEventListener(
            "click",
            closePhotoModal
        );


    document
        .getElementById(
            "cancelPhoto"
        )
        .addEventListener(
            "click",
            closePhotoModal
        );


    document
        .getElementById(
            "photoForm"
        )
        .addEventListener(
            "submit",
            savePhoto
        );


    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                closePhotoModal();

            }

        }
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closePhotoModal() {

    document
        .getElementById(
            "photoModal"
        )
        ?.remove();


    editingPhotoId =
        null;

}


/* =========================================================
   SAVE PHOTO
   ========================================================= */

async function savePhoto(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "savePhoto"
        );


    const errorElement =
        document.getElementById(
            "photoFormError"
        );


    const fileInput =
        document.getElementById(
            "photoFile"
        );


    const file =
        fileInput.files[0];


    const title =
        document.getElementById(
            "photoTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "photoCategory"
        ).value.trim();


    const description =
        document.getElementById(
            "photoDescription"
        ).value.trim() ||
        null;


    const displayOrder =
        Number(
            document.getElementById(
                "photoOrder"
            ).value
        ) || 0;


    const isVisible =
        document.getElementById(
            "photoVisible"
        ).checked;


    if (
        !editingPhotoId &&
        !file
    ) {

        showPhotoError(
            "Please select an image."
        );

        return;

    }


    if (!title || !category) {

        showPhotoError(
            "Please provide a title and category."
        );

        return;

    }


    button.disabled =
        true;

    button.textContent =
        editingPhotoId
        ? "SAVING..."
        : "UPLOADING...";


    try {

        let storagePath =
            null;


        /*
         * Existing photo
         */

        if (
            editingPhotoId
        ) {

            const existing =
                websitePhotos.find(
                    (photo) =>
                        photo.id ===
                        editingPhotoId
                );


            storagePath =
                existing.storage_path;


            /*
             * If a replacement image was
             * selected, upload it.
             */

            if (file) {

                storagePath =
                    await uploadPhotoFile(
                        file
                    );

            }

        }


        /*
         * New photo
         */

        else {

            storagePath =
                await uploadPhotoFile(
                    file
                );

        }


        const payload = {

            title:
                title,

            description:
                description,

            storage_path:
                storagePath,

            category:
                category,

            display_order:
                displayOrder,

            is_visible:
                isVisible,

            updated_at:
                new Date()
                    .toISOString()

        };


        let result;


        if (
            editingPhotoId
        ) {

            result =
                await window.supabaseClient
                    .from(
                        "website_photos"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        editingPhotoId
                    )
                    .select()
                    .single();

        } else {

            result =
                await window.supabaseClient
                    .from(
                        "website_photos"
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


        closePhotoModal();


        await loadWebsitePhotos();


    } catch (error) {

        console.error(
            "Photo save error:",
            error
        );


        showPhotoError(
            error.message ||
            "Unable to save the photo."
        );


        button.disabled =
            false;

        button.textContent =
            editingPhotoId
            ? "SAVE CHANGES"
            : "UPLOAD PHOTO";

    }

}


/* =========================================================
   UPLOAD FILE
   ========================================================= */

async function uploadPhotoFile(
    file
) {

    if (!file) {

        throw new Error(
            "No image was selected."
        );

    }


    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp",

        "image/gif",

        "image/avif"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Please upload a JPG, PNG, WEBP, GIF, or AVIF image."
        );

    }


    /*
     * 10 MB maximum.
     */

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Images must be smaller than 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const uniqueName =
        `${crypto.randomUUID()}.${extension}`;


    /*
     * Store website photos under:
     *
     * website/
     *
     * This keeps them separate from your
     * existing branding/cocktails/food/etc.
     */

    const storagePath =
        `website/${uniqueName}`;


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


    return storagePath;

}


/* =========================================================
   TOGGLE VISIBILITY
   ========================================================= */

async function togglePhotoVisibility(
    photoId
) {

    const photo =
        websitePhotos.find(
            (item) =>
                item.id === photoId
        );


    if (!photo) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from(
                    "website_photos"
                )
                .update(
                    {
                        is_visible:
                            !photo.is_visible,

                        updated_at:
                            new Date()
                                .toISOString()
                    }
                )
                .eq(
                    "id",
                    photoId
                );


        if (error) {

            throw error;

        }


        await loadWebsitePhotos();


    } catch (error) {

        console.error(
            "Photo visibility error:",
            error
        );


        alert(
            "Unable to update photo visibility."
        );

    }

}


/* =========================================================
   DELETE PHOTO
   ========================================================= */

async function deletePhoto(
    photoId
) {

    const photo =
        websitePhotos.find(
            (item) =>
                item.id === photoId
        );


    if (!photo) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${photo.title}"?\n\nThe photo will be removed from the website and storage.`
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
         * Delete database record first.
         */

        const {
            error: databaseError
        } =
            await window.supabaseClient
                .from(
                    "website_photos"
                )
                .delete()
                .eq(
                    "id",
                    photoId
                );


        if (databaseError) {

            throw databaseError;

        }


        /*
         * Delete actual storage file.
         */

        if (
            photo.storage_path
        ) {

            const {
                error: storageError
            } =
                await window.supabaseClient
                    .storage
                    .from(
                        "elysium-media"
                    )
                    .remove([
                        photo.storage_path
                    ]);


            if (storageError) {

                console.error(
                    "Storage delete error:",
                    storageError
                );

            }

        }


        await loadWebsitePhotos();


    } catch (error) {

        console.error(
            "Photo delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete the photo."
        );

    }

}


/* =========================================================
   FORM ERROR
   ========================================================= */

function showPhotoError(
    message
) {

    const element =
        document.getElementById(
            "photoFormError"
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