
/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   SCROLL ANIMATIONS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /*
     * Check whether the browser supports IntersectionObserver.
     *
     * IntersectionObserver allows us to detect when an element
     * enters the visitor's screen without constantly checking
     * the scroll position.
     */

    if (!("IntersectionObserver" in window)) {

        /*
         * Older browsers:
         * Simply make everything visible.
         */

        const revealElements =
            document.querySelectorAll(".reveal");

        revealElements.forEach((element) => {
            element.classList.add("visible");
        });

        return;
    }


    /* =====================================================
       1. REVEAL ANIMATIONS
       ===================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");


    const revealObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("visible");

                    /*
                     * Once an element has appeared, stop observing
                     * it. This prevents the animation from running
                     * again every time the user scrolls past it.
                     */

                    observer.unobserve(entry.target);

                });

            },
            {
                /*
                 * Start the animation slightly before the element
                 * reaches the center of the screen.
                 */

                threshold: 0.12,

                rootMargin: "0px 0px -50px 0px"
            }
        );


    revealElements.forEach((element) => {

        revealObserver.observe(element);

    });


    /* =====================================================
       2. SMOOTH ANCHOR LINKS
       ===================================================== */

    const anchorLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    anchorLinks.forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId =
                link.getAttribute("href");


            /*
             * Ignore links that only contain "#".
             */

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }


            const target =
                document.querySelector(targetId);


            if (!target) {
                return;
            }


            event.preventDefault();


            /*
             * Account for the fixed navigation bar.
             */

            const header =
                document.getElementById("site-header");

            const headerHeight =
                header
                    ? header.offsetHeight
                    : 0;


            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight;


            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });

        });

    });


    /* =====================================================
       3. PARALLAX HERO EFFECT
       ===================================================== */

    const hero =
        document.querySelector(".home-hero");

    const heroBackground =
        document.querySelector(
            ".home-hero .hero-background"
        );


    /*
     * Only enable the parallax effect if the elements
     * actually exist.
     */

    if (hero && heroBackground) {

        /*
         * Keep track of whether another animation frame
         * has already been requested.
         */

        let ticking = false;


        const updateHeroParallax = () => {

            const scrollPosition =
                window.scrollY;

            /*
             * Don't continue calculating the effect once
             * we've completely passed the hero.
             */

            if (
                scrollPosition <= hero.offsetHeight
            ) {

                /*
                 * Keep the movement subtle.
                 */

                const movement =
                    scrollPosition * 0.15;

                heroBackground.style.transform =
                    `translateY(${movement}px)`;
            }


            ticking = false;

        };


        window.addEventListener(
            "scroll",
            () => {

                if (!ticking) {

                    window.requestAnimationFrame(
                        updateHeroParallax
                    );

                    ticking = true;
                }

            },
            {
                passive: true
            }
        );

    }


    /* =====================================================
       4. IMAGE HOVER EFFECTS
       ===================================================== */

    /*
     * Add a small interaction to image containers.
     *
     * CSS handles the actual transition, while this simply
     * allows us to add an optional active class.
     */

    const imageContainers =
        document.querySelectorAll(
            ".image-container"
        );


    imageContainers.forEach((container) => {

        container.addEventListener(
            "mouseenter",
            () => {

                container.classList.add("image-hover");

            }
        );


        container.addEventListener(
            "mouseleave",
            () => {

                container.classList.remove("image-hover");

            }
        );

    });


    /* =====================================================
       5. REDUCED MOTION
       ===================================================== */

    /*
     * Respect users who have requested reduced motion
     * through their operating system/browser settings.
     */

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    if (prefersReducedMotion.matches) {

        /*
         * Make sure all reveal elements are immediately
         * visible.
         */

        revealElements.forEach((element) => {

            element.classList.add("visible");

        });


        /*
         * Remove the JavaScript-driven parallax.
         */

        if (heroBackground) {

            heroBackground.style.transform =
                "none";

        }

    }

});
