/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   ADMIN DASHBOARD
   ========================================================= */


/* =========================================================
   GLOBAL ADMIN STATE
   ========================================================= */

const adminState = {

    user: null,

    currentSection: "dashboard",

    menuCategories: [],

    menuItems: [],

    privateRoomRequests: [],

    cocktailClasses: [],

    photos: []

};


/* =========================================================
   WAIT FOR ADMIN AUTHENTICATION
   ========================================================= */

window.addEventListener(
    "elysiumAdminReady",
    async (event) => {

        console.log(
            "Elysium admin application initialized."
        );


        adminState.user =
            event.detail.user;


        initializeAdminDashboard();

    }
);


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeAdminDashboard() {

    setupNavigation();

    setupQuickActions();

    await loadDashboardData();

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navigationButtons =
        document.querySelectorAll(
            "[data-section]"
        );


    navigationButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;


                    if (!section) {

                        return;

                    }


                    showAdminSection(
                        section
                    );

                }
            );

        }
    );

}


/* =========================================================
   SHOW ADMIN SECTION
   ========================================================= */

function showAdminSection(
    section
) {

    const sections =
        document.querySelectorAll(
            ".admin-content-section"
        );


    sections.forEach(
        (element) => {

            element.hidden =
                true;

            element.classList
                .remove("active");

        }
    );


    const selectedSection =
        document.getElementById(
            `section-${section}`
        );


    if (!selectedSection) {

        console.warn(
            `Admin section not found: ${section}`
        );

        return;

    }


    selectedSection.hidden =
        false;

    selectedSection.classList
        .add("active");


    adminState.currentSection =
        section;


    updateActiveNavigation(
        section
    );


    updatePageTitle(
        section
    );


    /*
     * Load section-specific content.
     */

    switch (section) {

        case "dashboard":

            loadDashboardData();

            break;


        case "menu":

            loadMenuManager();

            break;


        case "photos":

            loadPhotoManager();

            break;


        case "private-room":

            loadPrivateRoomManager();

            break;


        case "cocktail-classes":

            loadCocktailClassManager();

            break;


        case "faq":

            loadFaqManager();

            break;

    }

}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function updateActiveNavigation(
    section
) {

    const buttons =
        document.querySelectorAll(
            ".admin-nav-item"
        );


    buttons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                    section
            );

        }
    );

}


/* =========================================================
   PAGE TITLE
   ========================================================= */

function updatePageTitle(
    section
) {

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (!pageTitle) {

        return;

    }


    const titles = {

        dashboard:
            "Dashboard",

        menu:
            "Menu",

        photos:
            "Photos",

        "private-room":
            "Private Room Requests",

        "cocktail-classes":
            "Cocktail Classes",

        faq:
            "FAQ"

    };


    pageTitle.textContent =
        titles[section] ||
        "Dashboard";

}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function setupQuickActions() {

    const quickActions =
        document.querySelectorAll(
            ".admin-quick-action"
        );


    quickActions.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;


                    if (section) {

                        showAdminSection(
                            section
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

async function loadDashboardData() {

    if (
        !window.supabaseClient
    ) {

        console.error(
            "Supabase client unavailable."
        );

        return;

    }


    try {

        await Promise.all([

            loadPendingRequestsCount(),

            loadUpcomingClassesCount(),

            loadMenuItemsCount(),

            loadPhotosCount(),

            loadRecentRequests()

        ]);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================================
   PENDING PRIVATE ROOM REQUESTS
   ========================================================= */

async function loadPendingRequestsCount() {

    const element =
        document.getElementById(
            "pendingRequestsCount"
        );


    try {

        const {
            count,
            error
        } =
            await window.supabaseClient
                .from(
                    "private_room_bookings"
                )
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "pending"
                );


        if (error) {

            console.error(
                "Pending request count error:",
                error
            );

            if (element) {

                element.textContent =
                    "—";

            }

            return;

        }


        if (element) {

            element.textContent =
                count ?? 0;

        }

    } catch (error) {

        console.error(
            "Pending request exception:",
            error
        );

    }

}


/* =========================================================
   UPCOMING COCKTAIL CLASSES
   ========================================================= */

async function loadUpcomingClassesCount() {

    const element =
        document.getElementById(
            "upcomingClassesCount"
        );


    try {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const {
            count,
            error
        } =
            await window.supabaseClient
                .from(
                    "cocktail_classes"
                )
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .gte(
                    "class_date",
                    today
                );


        if (error) {

            console.error(
                "Cocktail class count error:",
                error
            );

            if (element) {

                element.textContent =
                    "—";

            }

            return;

        }


        if (element) {

            element.textContent =
                count ?? 0;

        }

    } catch (error) {

        console.error(
            "Cocktail class count exception:",
            error
        );

    }

}


/* =========================================================
   MENU ITEM COUNT
   ========================================================= */

async function loadMenuItemsCount() {

    const element =
        document.getElementById(
            "menuItemsCount"
        );


    try {

        const {
            count,
            error
        } =
            await window.supabaseClient
                .from(
                    "menu_items"
                )
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "is_visible",
                    true
                );


        if (error) {

            console.error(
                "Menu count error:",
                error
            );

            if (element) {

                element.textContent =
                    "—";

            }

            return;

        }


        if (element) {

            element.textContent =
                count ?? 0;

        }

    } catch (error) {

        console.error(
            "Menu count exception:",
            error
        );

    }

}


/* =========================================================
   PHOTO COUNT
   ========================================================= */

async function loadPhotosCount() {

    const element =
        document.getElementById(
            "photosCount"
        );


    try {

        const {
            count,
            error
        } =
            await window.supabaseClient
                .from(
                    "website_photos"
                )
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "is_visible",
                    true
                );


        if (error) {

            console.error(
                "Photo count error:",
                error
            );

            if (element) {

                element.textContent =
                    "—";

            }

            return;

        }


        if (element) {

            element.textContent =
                count ?? 0;

        }

    } catch (error) {

        console.error(
            "Photo count exception:",
            error
        );

    }

}


/* =========================================================
   RECENT PRIVATE ROOM REQUESTS
   ========================================================= */

async function loadRecentRequests() {

    const container =
        document.getElementById(
            "recentRequests"
        );


    if (!container) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "private_room_bookings"
                )
                .select(
                    `
                    id,
                    request_number,
                    customer_name,
                    requested_date,
                    preferred_start_time,
                    guest_count,
                    status,
                    created_at
                    `
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(5);


        if (error) {

            console.error(
                "Recent request error:",
                error
            );

            renderRecentRequestError(
                container
            );

            return;

        }


        adminState.privateRoomRequests =
            data || [];


        renderRecentRequests(
            container,
            data || []
        );


    } catch (error) {

        console.error(
            "Recent request exception:",
            error
        );

        renderRecentRequestError(
            container
        );

    }

}


/* =========================================================
   RENDER RECENT REQUESTS
   ========================================================= */

function renderRecentRequests(
    container,
    requests
) {

    if (
        !requests.length
    ) {

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


    container.innerHTML =
        requests
            .map(
                (request) => {

                    const status =
                        request.status ||
                        "pending";


                    const date =
                        formatDate(
                            request.requested_date
                        );


                    return `

                        <div
                            class="admin-request-row"
                        >

                            <div>

                                <strong>
                                    ${
                                        escapeHtml(
                                            request.request_number ||
                                            request.customer_name ||
                                            "Request"
                                        )
                                    }
                                </strong>

                                <span>
                                    ${
                                        escapeHtml(
                                            request.customer_name ||
                                            ""
                                        )
                                    }
                                </span>

                            </div>


                            <div
                                class="admin-request-details"
                            >

                                <span>
                                    ${date}
                                </span>

                                <span>
                                    ${
                                        request.guest_count ||
                                        0
                                    }
                                    guests
                                </span>

                            </div>


                            <span
                                class="
                                    admin-status
                                    ${escapeHtml(status)}
                                "
                            >
                                ${
                                    escapeHtml(
                                        status
                                    )
                                }
                            </span>

                        </div>

                    `;

                }
            )
            .join("");


}


/* =========================================================
   REQUEST ERROR
   ========================================================= */

function renderRecentRequestError(
    container
) {

    container.innerHTML = `

        <div class="admin-empty-state">

            <span>!</span>

            <p>
                Unable to load requests.
            </p>

        </div>

    `;

}


/* =========================================================
   MENU MANAGER
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

            categoriesResult,

            itemsResult

        ] =
            await Promise.all([

                window.supabaseClient
                    .from(
                        "menu_categories"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    ),

                window.supabaseClient
                    .from(
                        "menu_items"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    )

            ]);


        if (
            categoriesResult.error
        ) {

            throw categoriesResult.error;

        }


        if (
            itemsResult.error
        ) {

            throw itemsResult.error;

        }


        adminState.menuCategories =
            categoriesResult.data || [];


        adminState.menuItems =
            itemsResult.data || [];


        renderMenuManager(
            container
        );


    } catch (error) {

        console.error(
            "Menu loading error:",
            error
        );


        container.innerHTML = `

            <div class="admin-loading">

                Unable to load menu.

            </div>

        `;

    }

}


/* =========================================================
   RENDER MENU MANAGER
   ========================================================= */

function renderMenuManager(
    container
) {

    const categories =
        adminState.menuCategories;


    const items =
        adminState.menuItems;


    if (
        !categories.length &&
        !items.length
    ) {

        container.innerHTML = `

            <div class="admin-empty-state">

                <span>≡</span>

                <p>
                    No menu items have been added yet.
                </p>

            </div>

        `;

        return;

    }


    const categoryHtml =
        categories
            .map(
                (category) => {

                    const categoryItems =
                        items.filter(
                            (item) =>
                                item.category_id ===
                                category.id
                        );


                    return `

                        <div
                            class="admin-menu-category"
                        >

                            <div
                                class="
                                    admin-menu-category-header
                                "
                            >

                                <div>

                                    <span
                                        class="admin-eyebrow"
                                    >
                                        ${
                                            escapeHtml(
                                                category.menu_type
                                            )
                                        }
                                    </span>

                                    <h3>
                                        ${
                                            escapeHtml(
                                                category.name
                                            )
                                        }
                                    </h3>

                                </div>

                                <span>
                                    ${
                                        categoryItems.length
                                    }
                                    items
                                </span>

                            </div>


                            <div
                                class="admin-menu-items"
                            >

                                ${
                                    categoryItems.length
                                    ? categoryItems
                                        .map(
                                            renderMenuItem
                                        )
                                        .join("")
                                    : `
                                        <div
                                            class="
                                                admin-menu-empty
                                            "
                                        >
                                            No items in this category.
                                        </div>
                                    `
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container.innerHTML =
        categoryHtml;

}


/* =========================================================
   MENU ITEM
   ========================================================= */

function renderMenuItem(
    item
) {

    return `

        <div
            class="admin-menu-item-row"
        >

            <div
                class="admin-menu-item-image"
            >

                ${
                    item.image_path
                    ? `
                        <img
                            src="${escapeAttribute(
                                item.image_path
                            )}"
                            alt=""
                        >
                    `
                    : `
                        <span>
                            ◇
                        </span>
                    `
                }

            </div>


            <div
                class="admin-menu-item-info"
            >

                <strong>
                    ${
                        escapeHtml(
                            item.name
                        )
                    }
                </strong>

                <p>
                    ${
                        escapeHtml(
                            item.description ||
                            ""
                        )
                    }
                </p>

            </div>


            <div
                class="admin-menu-item-price"
            >

                ${
                    item.price !== null &&
                    item.price !== undefined
                    ? `$${Number(
                        item.price
                    ).toFixed(2)}`
                    : "—"
                }

            </div>


            <div>

                ${
                    item.is_visible
                    ? `
                        <span
                            class="
                                admin-status
                                confirmed
                            "
                        >
                            Visible
                        </span>
                    `
                    : `
                        <span
                            class="
                                admin-status
                                declined
                            "
                        >
                            Hidden
                        </span>
                    `
                }

            </div>


            <button
                type="button"
                class="admin-text-button"
                data-edit-menu-item="${item.id}"
            >
                EDIT
            </button>

        </div>

    `;

}


/* =========================================================
   PLACEHOLDER MANAGERS
   ========================================================= */

async function loadPhotoManager() {

    await initializePhotoManager();

}


    container.innerHTML = `

        <div class="admin-empty-state">

            <span>□</span>

            <p>
                Photo management is coming next.
            </p>

        </div>

    `;




async function loadPrivateRoomManager() {

    const container =
        document.getElementById(
            "privateRoomManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-empty-state">

            <span>◇</span>

            <p>
                Private room management will be connected next.
            </p>

        </div>

    `;

}


async function loadCocktailClassManager() {

    const container =
        document.getElementById(
            "cocktailClassManager"
        );


    if (!container) {

        return;

    }


    /*
     * Load the real cocktail class manager.
     */

    await initializeCocktailClassManager();

}


    // container.innerHTML = `

    //     <div class="admin-empty-state">

    //         <span>◯</span>

    //         <p>
    //             Cocktail class management will be connected next.
    //         </p>

    //     </div>

    // `;


async function loadFaqManager() {

    const container =
        document.getElementById(
            "faqManager"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="admin-empty-state">

            <span>?</span>

            <p>
                FAQ management will be connected next.
            </p>

        </div>

    `;

}


/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(
    dateString
) {

    if (!dateString) {

        return "—";

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
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


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