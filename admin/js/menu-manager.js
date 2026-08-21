/* =========================================================
   ELYSIUM
   ADMIN MENU MANAGER
   FOOD + DRINKS
   ========================================================= */

let adminMenuItems = [];


/* =========================================================
   CATEGORY DEFINITIONS
   ========================================================= */

const ADMIN_DRINK_CATEGORIES = [
    {
        value: "signature",
        label: "Signature Cocktails"
    },
    {
        value: "classics",
        label: "Classics"
    },
    {
        value: "spirit-forward",
        label: "Spirit Forward"
    },
    {
        value: "wine",
        label: "Wine"
    },
    {
        value: "beer",
        label: "Beer"
    },
    {
        value: "zero-proof",
        label: "Zero Proof"
    }
];


const ADMIN_FOOD_CATEGORIES = [
    {
        value: "Offerings of Olympus",
        label: "Offerings of Olympus"
    },
    {
        value: "Flames of the Gods",
        label: "Flames of the Gods"
    },
    {
        value: "Garden of the Gods",
        label: "Garden of the Gods"
    },
    {
        value: "Ambrosia Flatbread",
        label: "Ambrosia Flatbread"
    }
];


/* =========================================================
   CATEGORY LABEL
   ========================================================= */

function getAdminCategoryLabel(
    type,
    category
) {

    const categories =
        type === "drink"
            ? ADMIN_DRINK_CATEGORIES
            : ADMIN_FOOD_CATEGORIES;


    const found =
        categories.find(
            (item) =>
                item.value === category
        );


    return found
        ? found.label
        : category;

}


/* =========================================================
   LOAD MENU MANAGER
   ========================================================= */

async function loadMenuManager() {

    const container =
        document.getElementById(
            "menuManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `
        <div class="admin-loading">
            Loading menu...
        </div>
    `;


    try {

        const [
            drinksResult,
            foodResult
        ] =
            await Promise.all([

                window.supabaseClient
                    .from("drinks")
                    .select("*")
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    ),

                window.supabaseClient
                    .from("food")
                    .select("*")
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    )

            ]);


        if (drinksResult.error) {

            throw drinksResult.error;

        }


        if (foodResult.error) {

            throw foodResult.error;

        }


        adminMenuItems = [

            ...(drinksResult.data || [])
                .map(
                    (item) => ({
                        ...item,
                        menu_type: "drink"
                    })
                ),

            ...(foodResult.data || [])
                .map(
                    (item) => ({
                        ...item,
                        menu_type: "food"
                    })
                )

        ];


        renderAdminMenu();


    } catch (error) {

        console.error(
            "Menu manager loading error:",
            error
        );


        container.innerHTML = `
            <div class="admin-empty-state">

                <span>!</span>

                <p>
                    Unable to load menu.
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
   RENDER MENU
   ========================================================= */

function renderAdminMenu() {

    const container =
        document.getElementById(
            "menuManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-menu-toolbar">

            <div>

                <span class="admin-eyebrow">
                    MENU ITEMS
                </span>

                <strong>
                    ${adminMenuItems.length}
                    ${
                        adminMenuItems.length === 1
                            ? "item"
                            : "items"
                    }
                </strong>

            </div>


            <select
                id="adminMenuFilter"
                class="admin-form-select"
            >

                <option value="all">
                    All Items
                </option>

                <option value="drink">
                    Drinks
                </option>

                <option value="food">
                    Food
                </option>

            </select>

        </div>


        <div id="adminMenuList">
            ${renderAdminMenuGroups()}
        </div>

    `;


    document
        .getElementById(
            "adminMenuFilter"
        )
        ?.addEventListener(
            "change",
            (event) => {

                renderAdminMenuGroups(
                    event.target.value
                );

            }
        );


    attachAdminMenuActions();

}


/* =========================================================
   RENDER GROUPS
   ========================================================= */

function renderAdminMenuGroups(
    filter = "all"
) {

    const list =
        document.getElementById(
            "adminMenuList"
        );


    /*
     * If we're rendering the initial HTML,
     * return the markup.
     */

    const drinks =
        adminMenuItems.filter(
            (item) =>
                item.menu_type === "drink" &&
                (
                    filter === "all" ||
                    filter === "drink"
                )
        );


    const food =
        adminMenuItems.filter(
            (item) =>
                item.menu_type === "food" &&
                (
                    filter === "all" ||
                    filter === "food"
                )
        );


    const html = `

        ${
            drinks.length ||
            filter === "drink" ||
            filter === "all"
                ? renderTypeGroup(
                    "DRINKS",
                    drinks,
                    "drink"
                )
                : ""
        }


        ${
            food.length ||
            filter === "food" ||
            filter === "all"
                ? renderTypeGroup(
                    "FOOD",
                    food,
                    "food"
                )
                : ""
        }

    `;


    if (list) {

        list.innerHTML =
            html;

        attachAdminMenuActions();

        return;

    }


    return html;

}


/* =========================================================
   RENDER TYPE GROUP
   ========================================================= */

function renderTypeGroup(
    title,
    items,
    type
) {

    const categories =
        type === "drink"
            ? ADMIN_DRINK_CATEGORIES
            : ADMIN_FOOD_CATEGORIES;


    return `

        <section
            class="admin-menu-type-group"
        >

            <div class="admin-menu-type-heading">

                <span class="admin-eyebrow">
                    ${title}
                </span>

            </div>


            ${
                categories
                    .map(
                        (category) => {

                            const categoryItems =
                                items
                                    .filter(
                                        (item) =>
                                            item.category ===
                                            category.value
                                    )
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            (
                                                a.display_order ||
                                                0
                                            ) -
                                            (
                                                b.display_order ||
                                                0
                                            )
                                    );


                            if (
                                categoryItems.length ===
                                0
                            ) {

                                return "";

                            }


                            return `

                                <div
                                    class="
                                        admin-menu-category-group
                                    "
                                >

                                    <h3>
                                        ${
                                            category.label
                                        }
                                    </h3>


                                    <div
                                        class="
                                            admin-menu-item-grid
                                        "
                                    >

                                        ${
                                            categoryItems
                                                .map(
                                                    renderAdminMenuItem
                                                )
                                                .join("")
                                        }

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("")
            }

        </section>

    `;

}


/* =========================================================
   RENDER ITEM
   ========================================================= */

function renderAdminMenuItem(
    item
) {

    const visible =
        item.is_visible !== false;


    const image =
        item.image_url || "";


    return `

        <article
            class="admin-menu-item-card"
            data-menu-id="${escapeAttribute(
                item.id
            )}"
            data-menu-type="${item.menu_type}"
        >

            <div
                class="
                    admin-menu-item-image
                    ${
                        image
                            ? ""
                            : "admin-menu-item-image-empty"
                    }
                "
            >

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(
                                    image
                                )}"
                                alt="${escapeAttribute(
                                    item.name
                                )}"
                            >
                        `
                        : `
                            <span>
                                ELYSIUM
                            </span>
                        `
                }

            </div>


            <div
                class="
                    admin-menu-item-content
                "
            >

                <div
                    class="
                        admin-menu-item-heading
                    "
                >

                    <div>

                        <span
                            class="admin-eyebrow"
                        >
                            ${
                                getAdminCategoryLabel(
                                    item.menu_type,
                                    item.category
                                )
                            }
                        </span>


                        <h3>
                            ${escapeHtml(
                                item.name
                            )}
                        </h3>

                    </div>


                    <strong
                        class="
                            admin-menu-item-price
                        "
                    >
                        ${
                            item.price ===
                            null ||
                            item.price ===
                            undefined
                                ? "Market"
                                : `$${Number(
                                    item.price
                                ).toFixed(2)}`
                        }
                    </strong>

                </div>


                ${
                    item.description
                        ? `
                            <p
                                class="
                                    admin-menu-item-description
                                "
                            >
                                ${escapeHtml(
                                    item.description
                                )}
                            </p>
                        `
                        : ""
                }


                ${
                    item.menu_type ===
                    "drink" &&
                    item.ingredients
                        ? `
                            <p
                                class="
                                    admin-menu-item-description
                                "
                            >
                                ${escapeHtml(
                                    item.ingredients
                                )}
                            </p>
                        `
                        : ""
                }


                <div
                    class="
                        admin-menu-item-meta
                    "
                >

                    <span
                        class="
                            admin-status
                            ${
                                visible
                                    ? "confirmed"
                                    : "pending"
                            }
                        "
                    >
                        ${
                            visible
                                ? "Visible"
                                : "Hidden"
                        }
                    </span>


                    <span>
                        Order:
                        ${
                            Number(
                                item.display_order
                            ) || 0
                        }
                    </span>

                </div>


                <div
                    class="
                        admin-menu-item-actions
                    "
                >

                    <button
                        type="button"
                        class="
                            admin-secondary-button
                        "
                        data-menu-action="edit"
                        data-menu-id="${escapeAttribute(
                            item.id
                        )}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="
                            admin-secondary-button
                        "
                        data-menu-action="toggle"
                        data-menu-id="${escapeAttribute(
                            item.id
                        )}"
                    >
                        ${
                            visible
                                ? "Hide"
                                : "Show"
                        }
                    </button>


                    <button
                        type="button"
                        class="
                            admin-danger-button
                        "
                        data-menu-action="delete"
                        data-menu-id="${escapeAttribute(
                            item.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   ATTACH ACTIONS
   ========================================================= */

function attachAdminMenuActions() {

    document
        .querySelectorAll(
            "[data-menu-action]"
        )
        .forEach(
            (button) => {

                /*
                 * Prevent duplicate listeners.
                 */

                if (
                    button.dataset.menuBound ===
                    "true"
                ) {

                    return;

                }


                button.dataset.menuBound =
                    "true";


                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset
                                .menuId;


                        const action =
                            button.dataset
                                .menuAction;


                        const item =
                            adminMenuItems.find(
                                (entry) =>
                                    entry.id ===
                                    id
                            );


                        if (!item) {

                            return;

                        }


                        if (
                            action ===
                            "edit"
                        ) {

                            openAdminMenuModal(
                                item
                            );

                        }


                        if (
                            action ===
                            "toggle"
                        ) {

                            await toggleAdminMenuItem(
                                item
                            );

                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            await deleteAdminMenuItem(
                                item
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   OPEN MODAL
   ========================================================= */

function openAdminMenuModal(
    item = null
) {

    const editing =
        Boolean(item);


    const type =
        item?.menu_type ||
        "drink";


    const categories =
        type === "drink"
            ? ADMIN_DRINK_CATEGORIES
            : ADMIN_FOOD_CATEGORIES;


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "adminMenuModal";


    modal.className =
        "admin-modal-overlay";


    modal.innerHTML = `

        <div
            class="admin-modal"
        >

            <div
                class="
                    admin-modal-header
                "
            >

                <div>

                    <span
                        class="admin-eyebrow"
                    >
                        MENU MANAGEMENT
                    </span>

                    <h2>
                        ${
                            editing
                                ? "Edit Menu Item"
                                : "Add Menu Item"
                        }
                    </h2>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeAdminMenuModal"
                >
                    ×
                </button>

            </div>


            <form
                id="adminMenuForm"
                class="admin-form"
            >

                <div
                    id="adminMenuFormError"
                    class="admin-form-error"
                    hidden
                ></div>


                ${
                    editing
                        ? `
                            <input
                                type="hidden"
                                id="adminMenuType"
                                value="${type}"
                            >
                        `
                        : `
                            <div
                                class="
                                    admin-form-group
                                "
                            >

                                <label>
                                    Menu Type
                                </label>

                                <select
                                    id="adminMenuType"
                                    required
                                >

                                    <option
                                        value="drink"
                                    >
                                        Drinks
                                    </option>

                                    <option
                                        value="food"
                                    >
                                        Food
                                    </option>

                                </select>

                            </div>
                        `
                }


                <div
                    class="
                        admin-form-group
                    "
                >

                    <label
                        for="adminMenuCategory"
                    >
                        Category
                    </label>

                    <select
                        id="adminMenuCategory"
                        required
                    >

                        ${
                            categories
                                .map(
                                    (category) => `
                                        <option
                                            value="${category.value}"
                                            ${
                                                item?.category ===
                                                category.value
                                                    ? "selected"
                                                    : ""
                                            }
                                        >
                                            ${category.label}
                                        </option>
                                    `
                                )
                                .join("")
                        }

                    </select>

                </div>


                <div
                    class="
                        admin-form-group
                    "
                >

                    <label
                        for="adminMenuName"
                    >
                        Name
                    </label>

                    <input
                        type="text"
                        id="adminMenuName"
                        required
                        maxlength="150"
                        value="${escapeAttribute(
                            item?.name ||
                            ""
                        )}"
                    >

                </div>


                <div
                    class="
                        admin-form-group
                    "
                >

                    <label
                        for="adminMenuDescription"
                    >
                        Description
                    </label>

                    <textarea
                        id="adminMenuDescription"
                        rows="4"
                        maxlength="1000"
                    >${escapeHtml(
                        item?.description ||
                        ""
                    )}</textarea>

                </div>


                <div
                    id="adminMenuIngredientsGroup"
                    class="
                        admin-form-group
                    "
                    ${
                        type === "food"
                            ? "hidden"
                            : ""
                    }
                >

                    <label
                        for="adminMenuIngredients"
                    >
                        Ingredients
                    </label>

                    <textarea
                        id="adminMenuIngredients"
                        rows="3"
                        maxlength="1000"
                    >${escapeHtml(
                        item?.ingredients ||
                        ""
                    )}</textarea>

                </div>


                <div
                    class="
                        admin-form-row
                    "
                >

                    <div
                        class="
                            admin-form-group
                        "
                    >

                        <label
                            for="adminMenuPrice"
                        >
                            Price
                        </label>

                        <input
                            type="number"
                            id="adminMenuPrice"
                            min="0"
                            step="0.01"
                            value="${
                                item?.price ??
                                ""
                            }"
                        >

                    </div>


                    <div
                        class="
                            admin-form-group
                        "
                    >

                        <label
                            for="adminMenuOrder"
                        >
                            Display Order
                        </label>

                        <input
                            type="number"
                            id="adminMenuOrder"
                            min="0"
                            step="1"
                            value="${
                                item?.display_order ??
                                0
                            }"
                        >

                    </div>

                </div>


                <div
                    class="
                        admin-form-group
                    "
                >

                    <label
                        for="adminMenuImage"
                    >
                        Image
                    </label>

                    <input
                        type="file"
                        id="adminMenuImage"
                        accept="
                            image/jpeg,
                            image/png,
                            image/webp,
                            image/avif
                        "
                    >

                    ${
                        item?.image_url
                            ? `
                                <div
                                    class="
                                        admin-menu-image-preview
                                    "
                                >

                                    <img
                                        src="${escapeAttribute(
                                            item.image_url
                                        )}"
                                        alt="Current image"
                                    >

                                </div>
                            `
                            : ""
                    }

                </div>


                <div
                    class="
                        admin-form-checkbox-row
                    "
                >

                    <label>

                        <input
                            type="checkbox"
                            id="adminMenuVisible"
                            ${
                                item?.is_visible !==
                                false
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            Visible on website
                        </span>

                    </label>

                </div>


                <div
                    class="
                        admin-modal-actions
                    "
                >

                    <button
                        type="button"
                        class="
                            admin-secondary-button
                        "
                        id="cancelAdminMenu"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="
                            admin-gold-button
                        "
                        id="saveAdminMenu"
                    >
                        ${
                            editing
                                ? "SAVE CHANGES"
                                : "ADD ITEM"
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
            "closeAdminMenuModal"
        )
        .addEventListener(
            "click",
            closeAdminMenuModal
        );


    document
        .getElementById(
            "cancelAdminMenu"
        )
        .addEventListener(
            "click",
            closeAdminMenuModal
        );


    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                closeAdminMenuModal();

            }

        }
    );


    document
        .getElementById(
            "adminMenuType"
        )
        .addEventListener(
            "change",
            updateAdminMenuCategoryOptions
        );


    document
        .getElementById(
            "adminMenuForm"
        )
        .addEventListener(
            "submit",
            (event) => {

                saveAdminMenuItem(
                    event,
                    item
                );

            }
        );

}


/* =========================================================
   CATEGORY SWITCH
   ========================================================= */

function updateAdminMenuCategoryOptions() {

    const type =
        document.getElementById(
            "adminMenuType"
        ).value;


    const categorySelect =
        document.getElementById(
            "adminMenuCategory"
        );


    const ingredientsGroup =
        document.getElementById(
            "adminMenuIngredientsGroup"
        );


    const categories =
        type === "drink"
            ? ADMIN_DRINK_CATEGORIES
            : ADMIN_FOOD_CATEGORIES;


    categorySelect.innerHTML =
        categories
            .map(
                (category) => `
                    <option
                        value="${category.value}"
                    >
                        ${category.label}
                    </option>
                `
            )
            .join("");


    ingredientsGroup.hidden =
        type === "food";

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeAdminMenuModal() {

    document
        .getElementById(
            "adminMenuModal"
        )
        ?.remove();

}


/* =========================================================
   SAVE ITEM
   ========================================================= */

async function saveAdminMenuItem(
    event,
    existingItem
) {

    event.preventDefault();


    const saveButton =
        document.getElementById(
            "saveAdminMenu"
        );


    const errorBox =
        document.getElementById(
            "adminMenuFormError"
        );


    saveButton.disabled =
        true;

    saveButton.textContent =
        "SAVING...";

    errorBox.hidden =
        true;


    try {

        const type =
            document.getElementById(
                "adminMenuType"
            ).value;


        const category =
            document.getElementById(
                "adminMenuCategory"
            ).value;


        const name =
            document.getElementById(
                "adminMenuName"
            ).value.trim();


        const description =
            document.getElementById(
                "adminMenuDescription"
            ).value.trim();


        const ingredients =
            document.getElementById(
                "adminMenuIngredients"
            )?.value.trim() ||
            "";


        const priceValue =
            document.getElementById(
                "adminMenuPrice"
            ).value;


        const displayOrder =
            Number(
                document.getElementById(
                    "adminMenuOrder"
                ).value
            ) || 0;


        const visible =
            document.getElementById(
                "adminMenuVisible"
            ).checked;


        const imageFile =
            document.getElementById(
                "adminMenuImage"
            ).files[0];


        if (!name) {

            throw new Error(
                "Please enter a name."
            );

        }


        if (!category) {

            throw new Error(
                "Please select a category."
            );

        }


        let imageUrl =
            existingItem?.image_url ||
            null;


        if (imageFile) {

            imageUrl =
                await uploadAdminMenuImage(
                    imageFile,
                    type
                );

        }


        const payload = {

            category:
                category,

            name:
                name,

            description:
                description ||
                null,

            price:
                priceValue === ""
                    ? null
                    : Number(
                        priceValue
                    ),

            image_url:
                imageUrl,

            display_order:
                displayOrder,

            is_visible:
                visible

        };


        /*
         * Ingredients only belongs to drinks.
         */

        if (
            type === "drink"
        ) {

            payload.ingredients =
                ingredients ||
                null;

        }


        const table =
            type === "drink"
                ? "drinks"
                : "food";


        let result;


        if (
            existingItem?.id
        ) {

            result =
                await window.supabaseClient
                    .from(table)
                    .update(payload)
                    .eq(
                        "id",
                        existingItem.id
                    );

        } else {

            result =
                await window.supabaseClient
                    .from(table)
                    .insert(payload);

        }


        if (result.error) {

            throw result.error;

        }


        closeAdminMenuModal();


        await loadMenuManager();


    } catch (error) {

        console.error(
            "Menu save error:",
            error
        );


        errorBox.textContent =
            error.message ||
            "Unable to save menu item.";


        errorBox.hidden =
            false;


        saveButton.disabled =
            false;

        saveButton.textContent =
            existingItem
                ? "SAVE CHANGES"
                : "ADD ITEM";

    }

}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadAdminMenuImage(
    file,
    type
) {

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
            "Please upload JPG, PNG, WEBP, or AVIF."
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


    const folder =
        type === "drink"
            ? "menu/drinks"
            : "menu/food";


    const storagePath =
        `${folder}/${fileName}`;


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
        !data?.publicUrl
    ) {

        throw new Error(
            "The image uploaded but a public URL could not be generated."
        );

    }


    return data.publicUrl;

}


/* =========================================================
   TOGGLE VISIBILITY
   ========================================================= */

async function toggleAdminMenuItem(
    item
) {

    const table =
        item.menu_type === "drink"
            ? "drinks"
            : "food";


    const {
        error
    } =
        await window.supabaseClient
            .from(table)
            .update({
                is_visible:
                    item.is_visible ===
                    false
            })
            .eq(
                "id",
                item.id
            );


    if (error) {

        console.error(
            "Menu visibility error:",
            error
        );


        alert(
            error.message ||
            "Unable to update visibility."
        );


        return;

    }


    await loadMenuManager();

}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteAdminMenuItem(
    item
) {

    const confirmed =
        window.confirm(
            `Delete "${item.name}" from the menu?`
        );


    if (!confirmed) {

        return;

    }


    const table =
        item.menu_type === "drink"
            ? "drinks"
            : "food";


    const {
        error
    } =
        await window.supabaseClient
            .from(table)
            .delete()
            .eq(
                "id",
                item.id
            );


    if (error) {

        console.error(
            "Menu delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete menu item."
        );


        return;

    }


    await loadMenuManager();

}


/* =========================================================
   ADD BUTTON
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const addButton =
            document.getElementById(
                "addMenuItemButton"
            );


        if (!addButton) {

            return;

        }


        addButton.addEventListener(
            "click",
            () => {

                openAdminMenuModal();

            }
        );

    }
);