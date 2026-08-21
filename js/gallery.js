/* =========================================================
   ELYSIUM
   DATABASE-DRIVEN GALLERY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const gallery =
            document.getElementById(
                "galleryGrid"
            );


        if (!gallery) {
            return;
        }


        /* =================================================
           LOAD GALLERY PHOTOS
           ================================================= */

        async function loadGalleryPhotos() {

            gallery.innerHTML = `
                <div class="gallery-loading">
                    Loading gallery...
                </div>
            `;


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
                            "category",
                            "gallery"
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


                const photos =
                    data || [];


                /* =========================================
                   NO PHOTOS
                   ========================================= */

                if (
                    photos.length === 0
                ) {

                    gallery.innerHTML = `
                        <div class="gallery-empty">

                            <p>
                                Gallery photos coming soon.
                            </p>

                        </div>
                    `;

                    return;

                }


                renderGallery(
                    photos
                );


            } catch (error) {

                console.error(
                    "Unable to load gallery photos:",
                    error
                );


                gallery.innerHTML = `
                    <div class="gallery-empty">

                        <p>
                            Unable to load the gallery.
                        </p>

                    </div>
                `;

            }

        }


        /* =================================================
           RENDER GALLERY
           ================================================= */

        function renderGallery(
            photos
        ) {

            gallery.innerHTML = "";


            photos.forEach(
                (
                    photo,
                    index
                ) => {

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
                        !data?.publicUrl
                    ) {

                        return;

                    }


                    const figure =
                        document.createElement(
                            "figure"
                        );


                    /*
                     * Preserve the special
                     * gallery layouts.
                     */

                    if (
                        index === 0
                    ) {

                        figure.className =
                            "gallery-item gallery-item-large";

                    } else if (
                        index === 4
                    ) {

                        figure.className =
                            "gallery-item gallery-item-wide";

                    } else {

                        figure.className =
                            "gallery-item";

                    }


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        data.publicUrl;


                    image.alt =
                        photo.title ||
                        "Elysium Cocktail Lounge";


                    image.loading =
                        "lazy";


                    figure.appendChild(
                        image
                    );


                    gallery.appendChild(
                        figure
                    );

                }
            );

        }


        /* =================================================
           START
           ================================================= */

        await loadGalleryPhotos();

    }
);