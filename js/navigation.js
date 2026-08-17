/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   NAVIGATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const header = document.getElementById("site-header");
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    /*
     * Make sure the required navigation elements exist.
     * This allows the script to safely run on pages where
     * certain elements may not have been added yet.
     */
    if (!header) {
        return;
    }


    /* =====================================================
       1. NAVBAR SCROLL EFFECT
       ===================================================== */

    const handleScroll = () => {

        if (window.scrollY > 50) {
            // Swap `site-header` to `sight-header` and add scrolled state
            if (header.classList.contains("site-header")) {
                header.classList.remove("site-header");
            }
            header.classList.add("sight-header", "scrolled");
        } else {
            // Revert back to `site-header` when at top
            if (header.classList.contains("sight-header")) {
                header.classList.remove("sight-header", "scrolled");
            }
            header.classList.add("site-header");
        }

    };

    window.addEventListener("scroll", handleScroll, {
        passive: true
    });

    // Run once when the page loads
    handleScroll();


    /* =====================================================
       2. MOBILE MENU
       ===================================================== */

    if (!mobileMenuButton || !mobileMenu) {
        return;
    }


    const openMobileMenu = () => {

        mobileMenu.classList.add("active");
        mobileMenuButton.classList.add("active");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        mobileMenu.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add("no-scroll");

    };


    const closeMobileMenu = () => {

        mobileMenu.classList.remove("active");
        mobileMenuButton.classList.remove("active");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileMenu.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove("no-scroll");

    };


    const toggleMobileMenu = () => {

        const isOpen =
            mobileMenu.classList.contains("active");

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }

    };


    mobileMenuButton.addEventListener(
        "click",
        toggleMobileMenu
    );


    /* =====================================================
       3. MOBILE MENU LINKS
       ===================================================== */

    const mobileLinks =
        mobileMenu.querySelectorAll("a");

    mobileLinks.forEach((link) => {

        link.addEventListener("click", () => {

            closeMobileMenu();

        });

    });


    /* =====================================================
       4. CLOSE WHEN CLICKING OUTSIDE MENU
       ===================================================== */

    mobileMenu.addEventListener("click", (event) => {

        /*
         * If the user clicks the dark background rather
         * than one of the menu items, close the menu.
         */
        if (event.target === mobileMenu) {
            closeMobileMenu();
        }

    });


    /* =====================================================
       5. ESCAPE KEY
       ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            const isOpen =
                mobileMenu.classList.contains("active");

            if (isOpen) {
                closeMobileMenu();
            }

        }

    });


    /* =====================================================
       6. CLOSE MENU WHEN RESIZING TO DESKTOP
       ===================================================== */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 768) {
            closeMobileMenu();
        }

    });

});
