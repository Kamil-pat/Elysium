/* =========================================================
   ELYSIUM
   COCKTAIL CLASS AVAILABILITY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const classList =
        document.getElementById("class-list");

    const emptyState =
        document.getElementById("classes-empty");


    if (!classList) {
        return;
    }


    /* =====================================================
       LOAD CLASSES
       ===================================================== */

    async function loadClasses() {

        classList.innerHTML = `
            <div class="menu-loading">
                Loading upcoming classes...
            </div>
        `;


        try {

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "get_cocktail_class_availability"
            );


            if (error) {
                throw error;
            }


            if (!data || data.length === 0) {

                classList.innerHTML = "";

                if (emptyState) {
                    emptyState.hidden = false;
                }

                return;
            }


            if (emptyState) {
                emptyState.hidden = true;
            }


            renderClasses(data);


        } catch (error) {

            console.error(
                "Unable to load cocktail classes:",
                error
            );


            classList.innerHTML = `
                <div class="menu-empty">

                    <h3>
                        Classes temporarily unavailable.
                    </h3>

                    <p>
                        Please check back shortly.
                    </p>

                </div>
            `;

        }

    }


    /* =====================================================
       RENDER CLASSES
       ===================================================== */

    function renderClasses(classes) {

        classList.innerHTML = "";


        classes.forEach(
            (classData, index) => {

                const card =
                    createClassCard(
                        classData,
                        index
                    );

                classList.appendChild(card);

            }
        );


        requestAnimationFrame(() => {

            classList
                .querySelectorAll(".reveal")
                .forEach((element) => {

                    element.classList.add(
                        "visible"
                    );

                });

        });

    }


    /* =====================================================
       CREATE CLASS CARD
       ===================================================== */

    function createClassCard(
        classData,
        index
    ) {

        const article =
            document.createElement("article");


        article.className =
            "class-card reveal";


        const delay =
            Math.min(index, 4);


        if (delay > 0) {

            article.classList.add(
                `reveal-delay-${delay}`
            );

        }


        /* =================================================
           IMAGE
           ================================================= */

        const image =
            document.createElement("div");

        image.className =
            "class-card-image";


        if (classData.image_url) {

            const img =
                document.createElement("img");

            img.src =
                classData.image_url;

            img.alt =
                classData.title ||
                "Elysium cocktail class";

            img.loading =
                "lazy";

            image.appendChild(img);

        } else {

            image.classList.add(
                "class-image-placeholder"
            );

            image.innerHTML = `
                <span>
                    ELYSIUM
                </span>
            `;

        }


        /* =================================================
           CONTENT
           ================================================= */

        const content =
            document.createElement("div");

        content.className =
            "class-card-content";


        /* ---------- Date ---------- */

        const date =
            document.createElement("p");

        date.className =
            "class-date";

        date.textContent =
            formatDate(
                classData.class_date
            );


        /* ---------- Title ---------- */

        const title =
            document.createElement("h3");

        title.textContent =
            classData.title ||
            "Cocktail Class";


        /* ---------- Description ---------- */

        const description =
            document.createElement("p");

        description.className =
            "class-description";

        description.textContent =
            classData.description || "";


        /* ---------- Time ---------- */

        const time =
            document.createElement("p");

        time.className =
            "class-time";

        time.textContent =
            formatTimeRange(
                classData.start_time,
                classData.end_time
            );


        /* =================================================
           FOOTER
           ================================================= */

        const footer =
            document.createElement("div");

        footer.className =
            "class-card-footer";


        const price =
            document.createElement("span");

        price.className =
            "class-price";

        price.textContent =
            `$${Number(
                classData.price
            ).toFixed(2)} / person`;


        const availability =
            document.createElement("span");

        availability.className =
            "class-availability";


        if (
            Number(
                classData.spots_remaining
            ) <= 5
        ) {

            availability.classList.add(
                "spots-low"
            );

        }


        availability.textContent =
            `${classData.spots_remaining} ${
                Number(classData.spots_remaining) === 1
                    ? "spot"
                    : "spots"
            } remaining`;


        /* =================================================
           BUTTON
           ================================================= */

        const button =
            document.createElement("a");

        button.className =
            "btn btn-primary class-book-button";

        button.href =
            `class-booking.html?id=${encodeURIComponent(
                classData.id
            )}`;

        button.textContent =
            "Book This Class";


        /* =================================================
           ASSEMBLE
           ================================================= */

        content.appendChild(
            date
        );

        content.appendChild(
            title
        );

        content.appendChild(
            description
        );

        content.appendChild(
            time
        );


        footer.appendChild(
            price
        );

        footer.appendChild(
            availability
        );


        content.appendChild(
            footer
        );

        content.appendChild(
            button
        );


        article.appendChild(
            image
        );

        article.appendChild(
            content
        );


        return article;

    }


    /* =====================================================
       DATE FORMATTER
       ===================================================== */

    function formatDate(
        dateString
    ) {

        const date =
            new Date(
                `${dateString}T12:00:00`
            );


        return new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        ).format(date);

    }


    /* =====================================================
       TIME FORMATTER
       ===================================================== */

    function formatTime(
        timeString
    ) {

        if (!timeString) {
            return "";
        }


        const [
            hours,
            minutes
        ] =
            timeString
                .split(":")
                .map(Number);


        const date =
            new Date();


        date.setHours(
            hours,
            minutes,
            0,
            0
        );


        return new Intl.DateTimeFormat(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(date);

    }


    function formatTimeRange(
        start,
        end
    ) {

        const startTime =
            formatTime(start);

        const endTime =
            formatTime(end);


        if (!endTime) {
            return startTime;
        }


        return `${startTime} – ${endTime}`;

    }


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadClasses();

});