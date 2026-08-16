/* =========================================================
   ELYSIUM
   DATABASE-DRIVEN FOOD MENU
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const tabs =
        document.querySelectorAll(".menu-tab");

    const sections =
        document.querySelectorAll(
            "[data-food-section]"
        );


    const categories = [
        "small-plates",
        "shareables",
        "entrees",
        "desserts"
    ];


    /* =====================================================
       LOAD FOOD
       ===================================================== */

    async function loadFood(category) {

        const container =
            document.getElementById(
                `${category}-menu`
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="menu-loading">
                Loading menu...
            </div>
        `;


        try {

            const {
                data,
                error
            } = await supabaseClient
                .from("food")
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

                container.innerHTML = `
                    <div class="menu-empty">

                        <h3>
                            Menu coming soon.
                        </h3>

                        <p>
                            We're preparing something
                            delicious for you.
                        </p>

                    </div>
                `;

                return;
            }


            renderFood(
                container,
                data
            );


        } catch (error) {

            console.error(
                "Unable to load food menu:",
                error
            );


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

    }


    /* =====================================================
       RENDER FOOD
       ===================================================== */

    function renderFood(
        container,
        items
    ) {

        container.innerHTML = "";

        container.className =
            "food-grid";


        items.forEach(
            (item, index) => {

                const card =
                    createFoodCard(
                        item,
                        index
                    );

                container.appendChild(card);

            }
        );


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
       CREATE FOOD CARD
       ===================================================== */

    function createFoodCard(
        item,
        index
    ) {

        const article =
            document.createElement("article");


        article.className =
            "food-card reveal";


        const delay =
            Math.min(index, 4);


        if (delay > 0) {

            article.classList.add(
                `reveal-delay-${delay}`
            );

        }


        /* ---------- Image ---------- */

        const imageContainer =
            document.createElement("div");

        imageContainer.className =
            "food-card-image";


        if (item.image_url) {

            const image =
                document.createElement("img");

            image.src =
                item.image_url;

            image.alt =
                item.name || "Elysium food";

            image.loading =
                "lazy";

            imageContainer.appendChild(
                image
            );

        } else {

            imageContainer.classList.add(
                "food-image-placeholder"
            );

            imageContainer.innerHTML = `
                <span>ELYSIUM</span>
            `;

        }


        /* ---------- Content ---------- */

        const content =
            document.createElement("div");

        content.className =
            "food-card-content";


        const heading =
            document.createElement("div");

        heading.className =
            "food-card-heading";


        const name =
            document.createElement("h3");

        name.textContent =
            item.name;


        const price =
            document.createElement("span");

        price.className =
            "food-price";


        if (
            item.price !== null &&
            item.price !== undefined
        ) {

            price.textContent =
                `$${Number(item.price).toFixed(2)}`;

        } else {

            price.textContent =
                "Market";

        }


        heading.appendChild(name);
        heading.appendChild(price);


        const description =
            document.createElement("p");

        description.className =
            "food-description";

        description.textContent =
            item.description || "";


        content.appendChild(
            heading
        );

        content.appendChild(
            description
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
       CATEGORY TABS
       ===================================================== */

    tabs.forEach((tab) => {

        tab.addEventListener(
            "click",
            async () => {

                const category =
                    tab.dataset.foodCategory;


                tabs.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                        item.setAttribute(
                            "aria-selected",
                            "false"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );

                tab.setAttribute(
                    "aria-selected",
                    "true"
                );


                sections.forEach(
                    (section) => {

                        section.classList.toggle(
                            "hidden",
                            section.dataset.foodSection !==
                            category
                        );

                    }
                );


                await loadFood(category);

            }
        );

    });


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadFood(
        "small-plates"
    );

});