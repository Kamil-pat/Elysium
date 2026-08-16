/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   DATABASE-DRIVEN MENU
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const menuTabs =
        document.querySelectorAll(".menu-tab");

    const menuSections =
        document.querySelectorAll(
            "[data-menu-section]"
        );

    /*
     * All categories we currently support.
     *
     * The value must match the "category" value
     * stored in the Supabase drinks table.
     */

    const categories = [
        "signature",
        "classics",
        "spirit-forward",
        "wine",
        "beer",
        "zero-proof"
    ];


    /* =====================================================
       1. CREATE MENU CONTAINERS
       ===================================================== */

    /*
     * Make sure each category has a container where
     * Supabase results can be rendered.
     */

    categories.forEach((category) => {

        const section =
            document.querySelector(
                `[data-menu-section="${category}"]`
            );

        if (!section) {
            return;
        }


        /*
         * Signature uses the existing menu-grid.
         *
         * Other categories originally contained
         * hard-coded HTML, so we'll replace their
         * menu content dynamically.
         */

        let container =
            section.querySelector(
                ".database-menu-container"
            );


        if (!container) {

            container =
                document.createElement("div");

            container.className =
                "database-menu-container";


            const existingGrid =
                section.querySelector(
                    ".menu-grid, .simple-menu-grid"
                );


            if (existingGrid) {

                existingGrid.replaceWith(
                    container
                );

            } else {

                section
                    .querySelector(".container")
                    ?.appendChild(container);

            }

        }

    });


    /* =====================================================
       2. LOAD CATEGORY
       ===================================================== */

    async function loadCategory(category) {

        const section =
            document.querySelector(
                `[data-menu-section="${category}"]`
            );


        if (!section) {
            return;
        }


        const container =
            section.querySelector(
                ".database-menu-container"
            );


        if (!container) {
            return;
        }


        showLoading(container);


        try {

            const {
                data,
                error
            } = await supabaseClient
                .from("drinks")
                .select("*")
                .eq("category", category)
                .eq("is_visible", true)
                .order("display_order", {
                    ascending: true
                });


            if (error) {
                throw error;
            }


            if (!data || data.length === 0) {

                showEmpty(
                    container,
                    category
                );

                return;
            }


            renderCategory(
                container,
                data,
                category
            );


        } catch (error) {

            console.error(
                `Error loading ${category}:`,
                error
            );


            showError(container);

        }

    }


    /* =====================================================
       3. RENDER CATEGORY
       ===================================================== */

    function renderCategory(
        container,
        drinks,
        category
    ) {

        container.innerHTML = "";


        /*
         * Image-heavy cards for Signature Cocktails.
         */

        if (category === "signature") {

            container.className =
                "database-menu-container menu-grid";


            drinks.forEach(
                (drink, index) => {

                    container.appendChild(
                        createDrinkCard(
                            drink,
                            index
                        )
                    );

                }
            );


        } else {

            /*
             * Simpler editorial layout for classics,
             * wine, beer, etc.
             */

            container.className =
                "database-menu-container simple-menu-grid";


            drinks.forEach(
                (drink, index) => {

                    container.appendChild(
                        createSimpleMenuItem(
                            drink,
                            index
                        )
                    );

                }
            );

        }


        /*
         * Trigger reveal animation for dynamically
         * created elements.
         */

        requestAnimationFrame(() => {

            container
                .querySelectorAll(".reveal")
                .forEach((element) => {

                    element.classList.add(
                        "visible"
                    );

                });

        });

    }


    /* =====================================================
       4. CREATE SIGNATURE DRINK CARD
       ===================================================== */

    function createDrinkCard(
        drink,
        index
    ) {

        const article =
            document.createElement("article");


        article.className =
            "drink-card reveal";


        addRevealDelay(
            article,
            index
        );


        /* ---------- Image ---------- */

        const imageContainer =
            document.createElement("div");

        imageContainer.className =
            "drink-card-image";


        if (drink.image_url) {

            const image =
                document.createElement("img");

            image.src =
                drink.image_url;

            image.alt =
                drink.name ||
                "Elysium cocktail";

            image.loading =
                "lazy";

            imageContainer.appendChild(
                image
            );

        } else {

            imageContainer.classList.add(
                "drink-image-placeholder"
            );

            imageContainer.innerHTML = `
                <span>ELYSIUM</span>
            `;

        }


        /* ---------- Content ---------- */

        const content =
            document.createElement("div");

        content.className =
            "drink-card-content";


        const heading =
            document.createElement("div");

        heading.className =
            "drink-card-heading";


        const name =
            document.createElement("h3");

        name.textContent =
            drink.name;


        const price =
            document.createElement("span");

        price.className =
            "drink-price";

        price.textContent =
            formatPrice(
                drink.price
            );


        heading.appendChild(name);
        heading.appendChild(price);


        const description =
            document.createElement("p");

        description.className =
            "drink-description";

        description.textContent =
            drink.description || "";


        const ingredients =
            document.createElement("p");

        ingredients.className =
            "drink-ingredients";

        ingredients.textContent =
            drink.ingredients || "";


        content.appendChild(
            heading
        );

        content.appendChild(
            description
        );

        content.appendChild(
            ingredients
        );


        article.appendChild(
            imageContainer
        );

        article.appendChild(
            content
        );


        return article;

    }


    /* =====================================================
       5. CREATE SIMPLE MENU ITEM
       ===================================================== */

    function createSimpleMenuItem(
        drink,
        index
    ) {

        const article =
            document.createElement("article");


        article.className =
            "simple-menu-item reveal";


        addRevealDelay(
            article,
            index
        );


        const information =
            document.createElement("div");


        const name =
            document.createElement("h3");

        name.textContent =
            drink.name;


        const description =
            document.createElement("p");

        /*
         * For simple menu items we display ingredients
         * as the smaller descriptive text.
         */

        description.textContent =
            drink.ingredients ||
            drink.description ||
            "";


        information.appendChild(
            name
        );

        information.appendChild(
            description
        );


        const price =
            document.createElement("span");

        price.textContent =
            formatPrice(
                drink.price
            );


        article.appendChild(
            information
        );

        article.appendChild(
            price
        );


        return article;

    }


    /* =====================================================
       6. PRICE FORMATTER
       ===================================================== */

    function formatPrice(price) {

        if (
            price === null ||
            price === undefined
        ) {

            return "Market";

        }


        return `$${Number(price).toFixed(2)}`;

    }


    /* =====================================================
       7. REVEAL DELAY
       ===================================================== */

    function addRevealDelay(
        element,
        index
    ) {

        const delay =
            Math.min(index, 4);


        if (delay > 0) {

            element.classList.add(
                `reveal-delay-${delay}`
            );

        }

    }


    /* =====================================================
       8. LOADING
       ===================================================== */

    function showLoading(
        container
    ) {

        container.className =
            "database-menu-container";


        container.innerHTML = `
            <div class="menu-loading">
                Loading menu...
            </div>
        `;

    }


    /* =====================================================
       9. EMPTY
       ===================================================== */

    function showEmpty(
        container,
        category
    ) {

        container.className =
            "database-menu-container";


        const readableCategory =
            category
                .replace("-", " ");


        container.innerHTML = `
            <div class="menu-empty">

                <h3>
                    ${capitalize(
                        readableCategory
                    )}
                    coming soon.
                </h3>

                <p>
                    Check back soon to discover
                    the Elysium collection.
                </p>

            </div>
        `;

    }


    /* =====================================================
       10. ERROR
       ===================================================== */

    function showError(
        container
    ) {

        container.className =
            "database-menu-container";


        container.innerHTML = `
            <div class="menu-empty">

                <h3>
                    Menu temporarily unavailable.
                </h3>

                <p>
                    Please check back shortly.
                </p>

            </div>
        `;

    }


    /* =====================================================
       11. CAPITALIZE
       ===================================================== */

    function capitalize(
        value
    ) {

        return value.charAt(0).toUpperCase() +
            value.slice(1);

    }


    /* =====================================================
       12. CATEGORY BUTTONS
       ===================================================== */

    menuTabs.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const category =
                    button.dataset.menuCategory;


                /*
                 * Update active tab.
                 */

                menuTabs.forEach(
                    (tab) => {

                        tab.classList.remove(
                            "active"
                        );

                        tab.setAttribute(
                            "aria-selected",
                            "false"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );

                button.setAttribute(
                    "aria-selected",
                    "true"
                );


                /*
                 * Hide all sections.
                 */

                menuSections.forEach(
                    (section) => {

                        section.classList.add(
                            "hidden"
                        );

                    }
                );


                /*
                 * Show selected section.
                 */

                const selectedSection =
                    document.querySelector(
                        `[data-menu-section="${category}"]`
                    );


                if (selectedSection) {

                    selectedSection.classList.remove(
                        "hidden"
                    );

                }


                /*
                 * Load that category from Supabase.
                 */

                await loadCategory(
                    category
                );

            }
        );

    });


    /* =====================================================
       13. INITIAL LOAD
       ===================================================== */

    /*
     * Start with Signature Cocktails.
     */

    const firstCategory =
        "signature";


    menuSections.forEach(
        (section) => {

            if (
                section.dataset.menuSection ===
                firstCategory
            ) {

                section.classList.remove(
                    "hidden"
                );

            } else {

                section.classList.add(
                    "hidden"
                );

            }

        }
    );


    loadCategory(
        firstCategory
    );

});