/* =========================================================
   ELYSIUM
   ADMIN FAQ MANAGER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAdminFAQs();


        const addButton =
            document.getElementById(
                "addFaqButton"
            );


        if (addButton) {

            addButton.addEventListener(
                "click",
                () => {

                    openFAQEditor();

                }
            );

        }

    }
);


/* =========================================================
   LOAD FAQS
   ========================================================= */

async function loadAdminFAQs() {

    const container =
        document.getElementById(
            "faqManager"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="admin-loading">
            Loading FAQs...
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
                    display_order,
                    is_visible,
                    created_at,
                    updated_at
                `)
                .order(
                    "display_order",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        renderAdminFAQs(
            container,
            data || []
        );


    } catch (error) {

        console.error(
            "Unable to load FAQs:",
            error
        );


        container.innerHTML = `
            <div class="admin-error">

                Unable to load FAQs.

                <br>

                <small>
                    ${escapeFAQAdmin(
                        error.message
                    )}
                </small>

            </div>
        `;

    }

}


/* =========================================================
   RENDER
   ========================================================= */

function renderAdminFAQs(
    container,
    faqs
) {

    if (!faqs.length) {

        container.innerHTML = `
            <div class="admin-empty-state">

                <span>◇</span>

                <p>
                    No FAQs have been added yet.
                </p>

                <button
                    type="button"
                    class="admin-gold-button"
                    id="emptyAddFaqButton"
                >
                    + ADD FIRST FAQ
                </button>

            </div>
        `;


        document
            .getElementById(
                "emptyAddFaqButton"
            )
            ?.addEventListener(
                "click",
                openFAQEditor
            );


        return;

    }


    container.innerHTML =
        faqs
            .map(
                renderAdminFAQ
            )
            .join("");


    attachFAQActions();

}


/* =========================================================
   FAQ CARD
   ========================================================= */

function renderAdminFAQ(
    faq
) {

    return `

        <article
            class="admin-faq-card"
            data-faq-id="${escapeFAQAdmin(
                faq.id
            )}"
        >

            <div
                class="admin-faq-card-number"
            >
                ${Number(
                    faq.display_order
                ) || 0}
            </div>


            <div
                class="admin-faq-card-content"
            >

                <div
                    class="admin-faq-card-header"
                >

                    <div>

                        <span
                            class="admin-eyebrow"
                        >
                            FAQ
                        </span>

                        <h3>
                            ${escapeFAQAdmin(
                                faq.question
                            )}
                        </h3>

                    </div>


                    <span
                        class="
                            admin-status
                            ${
                                faq.is_visible
                                    ? "confirmed"
                                    : "declined"
                            }
                        "
                    >
                        ${
                            faq.is_visible
                                ? "VISIBLE"
                                : "HIDDEN"
                        }
                    </span>

                </div>


                <p
                    class="admin-faq-answer"
                >
                    ${escapeFAQAdmin(
                        faq.answer
                    )}
                </p>


                <div
                    class="admin-faq-card-footer"
                >

                    <div
                        class="admin-faq-order"
                    >

                        <label>
                            ORDER
                        </label>

                        <input
                            type="number"
                            min="0"
                            value="${Number(
                                faq.display_order
                            ) || 0}"
                            class="faq-order-input"
                            data-faq-id="${escapeFAQAdmin(
                                faq.id
                            )}"
                        >

                    </div>


                    <div
                        class="admin-faq-actions"
                    >

                        <button
                            type="button"
                            class="
                                admin-secondary-button
                                faq-toggle-button
                            "
                            data-faq-id="${escapeFAQAdmin(
                                faq.id
                            )}"
                        >

                            ${
                                faq.is_visible
                                    ? "HIDE"
                                    : "SHOW"
                            }

                        </button>


                        <button
                            type="button"
                            class="
                                admin-secondary-button
                                faq-edit-button
                            "
                            data-faq-id="${escapeFAQAdmin(
                                faq.id
                            )}"
                        >
                            EDIT
                        </button>

                        <button
                            type="button"
                            class="
                                admin-danger-button
                                faq-delete-button
                            "
                            data-faq-id="${escapeFAQAdmin(
                                faq.id
                            )}"
                        >
                            DELETE
                        </button>

                    </div>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   ACTIONS
   ========================================================= */

function attachFAQActions() {

    /* =====================================================
       EDIT
       ===================================================== */

    document
        .querySelectorAll(".faq-edit-button")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const faqId =
                        button.dataset.faqId;


                    if (!faqId) {

                        console.error(
                            "FAQ edit button is missing faq ID."
                        );

                        return;

                    }


                    await openFAQEditor(
                        faqId
                    );

                }
            );

        });


    /* =====================================================
       DELETE
       ===================================================== */

    document
        .querySelectorAll(".faq-delete-button")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const faqId =
                        button.dataset.faqId;


                    if (!faqId) {
                        return;
                    }


                    await deleteFAQ(
                        faqId
                    );

                }
            );

        });


    /* =====================================================
       VISIBILITY
       ===================================================== */

    document
        .querySelectorAll(".faq-toggle-button")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const faqId =
                        button.dataset.faqId;


                    if (!faqId) {
                        return;
                    }


                    await toggleFAQVisibility(
                        faqId
                    );

                }
            );

        });


    /* =====================================================
       DISPLAY ORDER
       ===================================================== */

    document
        .querySelectorAll(".faq-order-input")
        .forEach((input) => {

            input.addEventListener(
                "change",
                async () => {

                    const faqId =
                        input.dataset.faqId;


                    if (!faqId) {
                        return;
                    }


                    await updateFAQOrder(
                        faqId,
                        input.value
                    );

                }
            );

        });

}


/* =========================================================
   EDITOR
   ========================================================= */

async function openFAQEditor(faqId = null) {

    let faq = null;


    /* =====================================================
       GET EXISTING FAQ
       ===================================================== */

    if (faqId) {

        const {
            data,
            error
        } = await window.supabaseClient
            .from("faq")
            .select(`
                id,
                question,
                answer,
                display_order,
                is_visible
            `)
            .eq("id", faqId)
            .single();


        if (error) {

            console.error(
                "Unable to load FAQ:",
                error
            );

            alert(
                "Unable to load this FAQ."
            );

            return;

        }


        faq = data;

    }


    /* =====================================================
       CREATE MODAL
       ===================================================== */

    const modal =
        document.createElement("div");

    modal.className =
        "admin-faq-modal";


    modal.innerHTML = `

        <div
            class="admin-faq-modal-backdrop"
            id="faqModalBackdrop"
        ></div>


        <div
            class="admin-faq-modal-content"
            role="dialog"
            aria-modal="true"
        >

            <div
                class="admin-faq-modal-header"
            >

                <div>

                    <span class="admin-eyebrow">
                        WEBSITE CONTENT
                    </span>

                    <h2>
                        ${
                            faq
                                ? "Edit FAQ"
                                : "Add FAQ"
                        }
                    </h2>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="faqModalClose"
                >
                    ×
                </button>

            </div>


            <form id="faqEditorForm">

                <div class="admin-form-group">

                    <label for="faqQuestion">
                        QUESTION
                    </label>

                    <input
                        id="faqQuestion"
                        type="text"
                        maxlength="250"
                        placeholder="Enter the frequently asked question"
                        value="${escapeFAQAdmin(
                            faq?.question || ""
                        )}"
                        required
                    >

                </div>


                <div class="admin-form-group">

                    <label for="faqAnswer">
                        ANSWER
                    </label>

                    <textarea
                        id="faqAnswer"
                        placeholder="Enter the answer shown to visitors"
                        required
                    >${escapeFAQAdmin(
                        faq?.answer || ""
                    )}</textarea>

                </div>


                <div class="admin-form-row">

                    <div class="admin-form-group">

                        <label for="faqOrder">
                            DISPLAY ORDER
                        </label>

                        <input
                            id="faqOrder"
                            type="number"
                            min="0"
                            value="${
                                Number(
                                    faq?.display_order
                                ) || 0
                            }"
                            required
                        >

                    </div>


                    <div class="admin-form-group">

                        <label>
                            VISIBILITY
                        </label>

                        <label class="admin-checkbox">

                            <input
                                id="faqVisible"
                                type="checkbox"
                                ${
                                    faq?.is_visible !== false
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Show on website
                            </span>

                        </label>

                    </div>

                </div>


                <div
                    class="admin-faq-modal-actions"
                >

                    <button
                        type="button"
                        class="admin-secondary-button"
                        id="faqCancelButton"
                    >
                        CANCEL
                    </button>


                    <button
                        type="submit"
                        class="admin-gold-button"
                        id="faqSaveButton"
                    >
                        ${
                            faq
                                ? "SAVE CHANGES"
                                : "ADD FAQ"
                        }
                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* =====================================================
       CLOSE
       ===================================================== */

    const closeModal = () => {

        modal.remove();

        document.body.style.overflow =
            "";

    };


    document.body.style.overflow =
        "hidden";


    document
        .getElementById(
            "faqModalClose"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "faqCancelButton"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "faqModalBackdrop"
        )
        .addEventListener(
            "click",
            closeModal
        );


    /* =====================================================
       SAVE
       ===================================================== */

    document
        .getElementById(
            "faqEditorForm"
        )
        .addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const saveButton =
                    document.getElementById(
                        "faqSaveButton"
                    );


                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "SAVING...";


                try {

                    await saveFAQ(
                        faqId,
                        closeModal
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        faq
                            ? "SAVE CHANGES"
                            : "ADD FAQ";

                }

            }
        );


    /* =====================================================
       FOCUS
       ===================================================== */

    requestAnimationFrame(
        () => {

            document
                .getElementById(
                    "faqQuestion"
                )
                ?.focus();

        }
    );

}


/* =========================================================
   SAVE
   ========================================================= */

async function saveFAQ(
    faqId,
    closeModal
) {

    const question =
        document
            .getElementById(
                "faqQuestion"
            )
            .value
            .trim();


    const answer =
        document
            .getElementById(
                "faqAnswer"
            )
            .value
            .trim();


    const displayOrder =
        Number(
            document
                .getElementById(
                    "faqOrder"
                )
                .value
        );


    const isVisible =
        document
            .getElementById(
                "faqVisible"
            )
            .checked;


    if (!question) {

        alert(
            "Please enter a question."
        );

        return;

    }


    if (!answer) {

        alert(
            "Please enter an answer."
        );

        return;

    }


    const payload = {

        question:
            question,

        answer:
            answer,

        display_order:
            Number.isFinite(
                displayOrder
            )
                ? displayOrder
                : 0,

        is_visible:
            isVisible,

        updated_at:
            new Date().toISOString()

    };


    try {

        if (faqId) {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("faq")
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        faqId
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            if (!data) {

                throw new Error(
                    "FAQ was not updated."
                );

            }

        } else {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("faq")
                    .insert(
                        payload
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            if (!data) {

                throw new Error(
                    "FAQ was not created."
                );

            }

        }


        closeModal();


        await loadAdminFAQs();


    } catch (error) {

        console.error(
            "Unable to save FAQ:",
            error
        );


        alert(
            error.message ||
            "Unable to save FAQ."
        );

    }

}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteFAQ(
    faqId
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to permanently delete this FAQ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from("faq")
                .delete()
                .eq(
                    "id",
                    faqId
                );


        if (error) {
            throw error;
        }


        await loadAdminFAQs();


    } catch (error) {

        console.error(
            "Unable to delete FAQ:",
            error
        );


        alert(
            error.message ||
            "Unable to delete FAQ."
        );

    }

}


/* =========================================================
   VISIBILITY
   ========================================================= */

async function toggleFAQVisibility(
    faqId
) {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("faq")
                .select(
                    "is_visible"
                )
                .eq(
                    "id",
                    faqId
                )
                .single();


        if (error) {
            throw error;
        }


        const {
            error:
                updateError
        } =
            await window.supabaseClient
                .from("faq")
                .update({
                    is_visible:
                        !data.is_visible,

                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    faqId
                );


        if (updateError) {
            throw updateError;
        }


        await loadAdminFAQs();


    } catch (error) {

        console.error(
            "Unable to change FAQ visibility:",
            error
        );


        alert(
            error.message ||
            "Unable to change FAQ visibility."
        );

    }

}


/* =========================================================
   ORDER
   ========================================================= */

async function updateFAQOrder(
    faqId,
    value
) {

    const displayOrder =
        Number(value);


    if (
        !Number.isFinite(
            displayOrder
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from("faq")
                .update({
                    display_order:
                        displayOrder,

                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    faqId
                );


        if (error) {
            throw error;
        }


    } catch (error) {

        console.error(
            "Unable to update FAQ order:",
            error
        );


        alert(
            error.message ||
            "Unable to update FAQ order."
        );

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeFAQAdmin(
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