/* =========================================================
   ELYSIUM
   ABOUT PAGE
   DATABASE-DRIVEN FAQ
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* =================================================
           LOAD FAQS
           ================================================= */

        await loadFAQs();


        /* =================================================
           FAQ ACCORDION
           ================================================= */

        setupFAQAccordion();

    }
);


/* =========================================================
   LOAD FAQS FROM SUPABASE
   ========================================================= */

async function loadFAQs() {

    const faqList =
        document.getElementById(
            "faq-list"
        );


    if (!faqList) {
        return;
    }


    faqList.innerHTML = `
        <div class="faq-loading">
            Loading frequently asked questions...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("faq")
                .select(`
                    id,
                    question,
                    answer,
                    display_order
                `)
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


        if (
            !data ||
            data.length === 0
        ) {

            faqList.innerHTML = `
                <div class="faq-empty">

                    <p>
                        Frequently asked questions
                        coming soon.
                    </p>

                </div>
            `;

            return;

        }


        renderFAQs(
            faqList,
            data
        );


        setupFAQAccordion();


    } catch (error) {

        console.error(
            "Unable to load FAQs:",
            error
        );


        faqList.innerHTML = `
            <div class="faq-empty">

                <p>
                    Frequently asked questions
                    are temporarily unavailable.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   RENDER FAQS
   ========================================================= */

function renderFAQs(
    container,
    faqs
) {

    container.innerHTML =
        faqs
            .map(
                (faq) => {

                    return `

                        <div
                            class="faq-item"
                            data-faq-id="${escapeFAQAttribute(
                                faq.id
                            )}"
                        >

                            <button
                                type="button"
                                class="faq-question"
                                aria-expanded="false"
                            >

                                <span>
                                    ${escapeFAQHtml(
                                        faq.question
                                    )}
                                </span>

                                <span
                                    class="faq-icon"
                                    aria-hidden="true"
                                >
                                    +
                                </span>

                            </button>


                            <div
                                class="faq-answer"
                            >

                                <div>

                                    <p>
                                        ${escapeFAQHtml(
                                            faq.answer
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FAQ ACCORDION
   ========================================================= */

function setupFAQAccordion() {

    const faqItems =
        document.querySelectorAll(
            ".faq-item"
        );


    faqItems.forEach(
        (item) => {

            const question =
                item.querySelector(
                    ".faq-question"
                );


            if (!question) {
                return;
            }


            /*
             * Prevent attaching the same
             * listener multiple times.
             */

            if (
                question.dataset
                    .faqInitialized === "true"
            ) {

                return;

            }


            question.dataset
                .faqInitialized = "true";


            question.addEventListener(
                "click",
                () => {

                    const isOpen =
                        item.classList.contains(
                            "open"
                        );


                    /*
                     * Close every other FAQ.
                     */

                    faqItems.forEach(
                        (otherItem) => {

                            otherItem.classList.remove(
                                "open"
                            );


                            const otherQuestion =
                                otherItem.querySelector(
                                    ".faq-question"
                                );


                            if (
                                otherQuestion
                            ) {

                                otherQuestion.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );

                            }

                        }
                    );


                    /*
                     * Open the clicked FAQ.
                     */

                    if (!isOpen) {

                        item.classList.add(
                            "open"
                        );


                        question.setAttribute(
                            "aria-expanded",
                            "true"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeFAQHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeFAQAttribute(
    value
) {

    return escapeFAQHtml(
        value
    );

}