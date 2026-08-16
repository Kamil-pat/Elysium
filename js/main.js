
/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   GLOBAL JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. CURRENT YEAR
       ===================================================== */

    /*
     * Automatically updates any element containing the
     * "current-year" class.
     *
     * Example:
     *
     * <span class="current-year"></span>
     *
     * This prevents us from having to manually change
     * the copyright year every January.
     */

    const currentYear =
        document.querySelectorAll(".current-year");


    currentYear.forEach((element) => {

        element.textContent =
            new Date().getFullYear();

    });


    /* =====================================================
       2. EXTERNAL LINKS
       ===================================================== */

    /*
     * External links can automatically open in a new tab.
     *
     * We intentionally do not apply this to internal links,
     * telephone links, email links, or anchor links.
     */

    const links =
        document.querySelectorAll("a[href]");


    links.forEach((link) => {

        const href =
            link.getAttribute("href");


        if (!href) {
            return;
        }


        const isExternal =
            href.startsWith("http://") ||
            href.startsWith("https://");


        if (isExternal) {

            link.setAttribute(
                "target",
                "_blank"
            );

            link.setAttribute(
                "rel",
                "noopener noreferrer"
            );

        }

    });


    /* =====================================================
       3. IMAGE FALLBACK
       ===================================================== */

    /*
     * If an image fails to load, add a class to its
     * container.
     *
     * Later we can use this class to display a branded
     * Elysium placeholder rather than a broken image icon.
     */

    const images =
        document.querySelectorAll("img");


    images.forEach((image) => {

        image.addEventListener(
            "error",
            () => {

                image.classList.add(
                    "image-load-error"
                );


                const container =
                    image.closest(
                        ".image-container, " +
                        ".hero-background, " +
                        ".experience-card-image, " +
                        ".gallery-item, " +
                        ".reservation-background, " +
                        ".mythology-background"
                    );


                if (container) {

                    container.classList.add(
                        "has-image-error"
                    );

                }

            }
        );

    });


    /* =====================================================
       4. BACK TO TOP
       ===================================================== */

    /*
     * This supports a future "Back to Top" button.
     *
     * The button doesn't need to exist yet.
     * If we add one later with the ID #back-to-top,
     * this functionality will automatically work.
     */

    const backToTop =
        document.getElementById(
            "back-to-top"
        );


    if (backToTop) {

        const updateBackToTop =
            () => {

                if (window.scrollY > 600) {

                    backToTop.classList.add(
                        "visible"
                    );

                } else {

                    backToTop.classList.remove(
                        "visible"
                    );

                }

            };


        window.addEventListener(
            "scroll",
            updateBackToTop,
            {
                passive: true
            }
        );


        updateBackToTop();


        backToTop.addEventListener(
            "click",
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    /* =====================================================
       5. RESERVATION BUTTON PLACEHOLDER
       ===================================================== */

    /*
     * Reservation functionality will eventually connect
     * to the reservation system we choose.
     *
     * For now, reservation buttons can simply point to
     * #reserve or another page.
     *
     * We are NOT hard-coding a third-party reservation
     * provider yet.
     */

    const reservationButtons =
        document.querySelectorAll(
            '[data-reservation]'
        );


    reservationButtons.forEach((button) => {

        button.addEventListener(
            "click",
            (event) => {

                const target =
                    button.getAttribute(
                        "data-reservation"
                    );


                /*
                 * If a reservation target exists,
                 * navigate to it.
                 */

                if (
                    target &&
                    target.startsWith("#")
                ) {

                    const destination =
                        document.querySelector(
                            target
                        );


                    if (destination) {

                        event.preventDefault();


                        destination.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }

            }
        );

    });


    /* =====================================================
       6. LAZY IMAGE OBSERVATION
       ===================================================== */

    /*
     * Most images already use loading="lazy".
     *
     * This section gives us a place to add more advanced
     * image loading behavior later without changing the
     * HTML structure.
     */

    const lazyImages =
        document.querySelectorAll(
            "img[data-src]"
        );


    if (
        lazyImages.length > 0 &&
        "IntersectionObserver" in window
    ) {

        const imageObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach((entry) => {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        const image =
                            entry.target;


                        const source =
                            image.getAttribute(
                                "data-src"
                            );


                        if (source) {

                            image.src = source;

                            image.removeAttribute(
                                "data-src"
                            );

                        }


                        observer.unobserve(image);

                    });

                },
                {
                    rootMargin: "200px 0px"
                }
            );


        lazyImages.forEach((image) => {

            imageObserver.observe(image);

        });

    }


    /* =====================================================
       7. PAGE LOADED STATE
       ===================================================== */

    /*
     * Add a class to the body once the initial page has
     * finished loading.
     *
     * This gives us the ability to create a polished
     * entrance/loading animation later.
     */

    window.addEventListener(
        "load",
        () => {

            document.body.classList.add(
                "page-loaded"
            );

        }
    );


    /* =====================================================
       8. CONSOLE BRANDING
       ===================================================== */

    /*
     * This is purely decorative for developers inspecting
     * the site.
     */

    console.log(
        "%c ELYSIUM ",
        "background:#c9964a;" +
        "color:#080706;" +
        "font-family:serif;" +
        "font-size:20px;" +
        "padding:8px 14px;"
    );

    console.log(
        "Your escape from the ordinary."
    );

    /* =====================================================
       9. SUPABASE WEBSITE PHOTOS
       ===================================================== */

    async function loadWebsitePhotos() {

        /*
         * Make sure Supabase is available.
         */

        if (
            typeof supabaseClient === "undefined"
        ) {

            console.warn(
                "Supabase client is not available."
            );

            return;

        }


        /*
         * Find all images that are controlled
         * by the website photo manager.
         */

        const cmsImages =
            document.querySelectorAll(
                "[data-cms-photo]"
            );


        if (
            cmsImages.length === 0
        ) {

            return;

        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "website_photos"
                    )
                    .select(
                        "*"
                    )
                    .eq(
                        "is_visible",
                        true
                    )
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                throw error;

            }


            const photos =
                data || [];


            /*
             * Replace each CMS-controlled image
             * with the corresponding Supabase image.
             */

            cmsImages.forEach(
                (image) => {

                    const category =
                        image.dataset
                            .cmsPhoto;

                    const slot =
                        Number(
                            image.dataset
                                .cmsPhotoSlot
                        );


                    if (
                        !category ||
                        !slot
                    ) {

                        return;

                    }


                    const matchingPhotos =
                        photos.filter(
                            (photo) =>
                                photo.category ===
                                category
                        );


                    const photo =
                        matchingPhotos[
                            slot - 1
                        ];


                    /*
                     * If the manager hasn't uploaded
                     * enough photos for this slot,
                     * keep the original website image.
                     */

                    if (!photo) {

                        return;

                    }


                    if (
                        !photo.storage_path
                    ) {

                        return;

                    }


                    const {
                        data
                    } =
                        supabaseClient
                            .storage
                            .from(
                                "elysium-media"
                            )
                            .getPublicUrl(
                                photo.storage_path
                            );


                    if (
                        !data ||
                        !data.publicUrl
                    ) {

                        console.warn(
                            "Unable to create image URL for:",
                            photo.storage_path
                        );

                        return;

                    }


                    image.src =
                        data.publicUrl;


                    /*
                     * Use the manager's title as
                     * the accessibility alt text
                     * when available.
                     */

                    if (
                        photo.title
                    ) {

                        image.alt =
                            photo.title;

                    }

                }
            );


        } catch (error) {

            console.error(
                "Unable to load website photos:",
                error
            );

        }

    }


    /*
     * Load managed photos after the DOM exists.
     */

    loadWebsitePhotos();

});

