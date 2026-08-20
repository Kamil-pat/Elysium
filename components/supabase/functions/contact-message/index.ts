/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   CONTACT MESSAGE EDGE FUNCTION
   ========================================================= */

import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";


/* =========================================================
   CORS
   ========================================================= */

const corsHeaders = {

    "Access-Control-Allow-Origin":
        "*",

    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS",

};


/* =========================================================
   ENVIRONMENT VARIABLES
   ========================================================= */

const SUPABASE_URL =
    Deno.env.get(
        "SUPABASE_URL"
    )!;


const SUPABASE_SECRET_KEYS =
    JSON.parse(
        Deno.env.get(
            "SUPABASE_SECRET_KEYS"
        )!
    );


const SUPABASE_SECRET_KEY =
    SUPABASE_SECRET_KEYS.default;


const MANAGER_EMAIL =
    Deno.env.get(
        "MANAGER_EMAIL"
    )!;


const RESEND_API_KEY =
    Deno.env.get(
        "RESEND_API_KEY"
    )!;


/* =========================================================
   SUPABASE ADMIN CLIENT
   ========================================================= */

const supabaseAdmin =
    createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY
    );


/* =========================================================
   EMAIL SENDER
   ========================================================= */

const FROM_EMAIL =
    "Elysium Cocktail Lounge <onboarding@resend.dev>";


/* =========================================================
   MAIN FUNCTION
   ========================================================= */

Deno.serve(
    async (request) => {

        /* =============================================
           OPTIONS
           ============================================= */

        if (
            request.method ===
            "OPTIONS"
        ) {

            return new Response(
                "ok",
                {
                    headers:
                        corsHeaders,
                }
            );

        }


        /* =============================================
           POST ONLY
           ============================================= */

        if (
            request.method !==
            "POST"
        ) {

            return jsonResponse(
                {
                    success: false,

                    error:
                        "Method not allowed."
                },
                405
            );

        }


        try {

            /* =========================================
               READ REQUEST
               ========================================= */

            const body =
                await request.json();


            const {
                customer_name,
                customer_email,
                customer_phone,
                subject,
                message,
            } = body;


            /* =========================================
               VALIDATION
               ========================================= */

            if (
                !customer_name ||
                !customer_email ||
                !subject ||
                !message
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Please complete all required fields."
                    },
                    400
                );

            }


            const name =
                String(
                    customer_name
                ).trim();


            const email =
                String(
                    customer_email
                )
                    .trim()
                    .toLowerCase();


            const phone =
                customer_phone
                    ? String(
                        customer_phone
                    ).trim()
                    : null;


            const contactSubject =
                String(
                    subject
                ).trim();


            const contactMessage =
                String(
                    message
                ).trim();


            /* =========================================
               BASIC EMAIL VALIDATION
               ========================================= */

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailRegex.test(
                    email
                )
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Please enter a valid email address."
                    },
                    400
                );

            }


            /* =========================================
               SAVE TO DATABASE
               ========================================= */

            const {
                data,
                error:
                    databaseError,
            } =
                await supabaseAdmin
                    .from(
                        "contact_messages"
                    )
                    .insert({

                        customer_name:
                            name,

                        customer_email:
                            email,

                        customer_phone:
                            phone,

                        subject:
                            contactSubject,

                        message:
                            contactMessage,

                        status:
                            "new",

                    })
                    .select(
                        "id"
                    )
                    .single();


            /* =========================================
               DATABASE FAILURE
               ========================================= */

            if (
                databaseError
            ) {

                console.error(
                    "Contact database error:",
                    databaseError
                );


                return jsonResponse(
                    {
                        success: false,

                        error:
                            "We were unable to send your message. Please try again."
                    },
                    500
                );

            }


            /* =========================================
               SEND MANAGER EMAIL
               ========================================= */

            const emailResult =
                await sendEmail({

                    to:
                        MANAGER_EMAIL,

                    subject:
                        `New Elysium Contact Message — ${contactSubject}`,

                    replyTo:
                        email,

                    html:
                        buildManagerEmail({

                            customerName:
                                name,

                            customerEmail:
                                email,

                            customerPhone:
                                phone,

                            subject:
                                contactSubject,

                            message:
                                contactMessage,

                            messageId:
                                data.id,

                        }),

                });


            /* =========================================
               EMAIL FAILURE
               ========================================= */

            if (
                !emailResult.success
            ) {

                console.error(
                    "Manager email failed:",
                    emailResult.error
                );

                /*
                 * The message is already safely
                 * stored in Supabase.
                 *
                 * We return success because the
                 * customer's message was not lost.
                 */

            }


            /* =========================================
               SUCCESS
               ========================================= */

            return jsonResponse({

                success:
                    true,

                message_id:
                    data.id,

            });


        } catch (error) {

            console.error(
                "Contact message error:",
                error
            );


            return jsonResponse(
                {
                    success: false,

                    error:
                        "Something went wrong. Please try again."
                },
                500
            );

        }

    }
);


/* =========================================================
   SEND EMAIL
   ========================================================= */

async function sendEmail({
    to,
    subject,
    html,
    replyTo,
}: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
}) {

    try {

        const response =
            await fetch(
                "https://api.resend.com/emails",
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${RESEND_API_KEY}`,

                        "Content-Type":
                            "application/json",

                    },

                    body:
                        JSON.stringify({

                            from:
                                FROM_EMAIL,

                            to: [
                                to
                            ],

                            subject,

                            html,

                            ...(replyTo
                                ? {
                                    reply_to:
                                        replyTo
                                }
                                : {}),

                        }),

                }
            );


        const result =
            await response.json();


        if (
            !response.ok
        ) {

            return {

                success:
                    false,

                error:
                    result,

            };

        }


        return {

            success:
                true,

            data:
                result,

        };


    } catch (error) {

        return {

            success:
                false,

            error,

        };

    }

}


/* =========================================================
   MANAGER EMAIL
   ========================================================= */

function buildManagerEmail({
    customerName,
    customerEmail,
    customerPhone,
    subject,
    message,
    messageId,
}: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    subject: string;
    message: string;
    messageId: string;
}) {

    return `

        <div style="
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: 0 auto;
            color: #24201b;
        ">

            <div style="
                background: #080706;
                padding: 35px;
                text-align: center;
            ">

                <h1 style="
                    color: #c9964a;
                    font-family: Georgia, serif;
                    font-weight: 400;
                    letter-spacing: 4px;
                    margin: 0;
                ">
                    ELYSIUM
                </h1>

                <p style="
                    color: #d8d0c5;
                    margin-bottom: 0;
                ">
                    New Contact Message
                </p>

            </div>


            <div style="
                padding: 35px;
                background: #f7f3ec;
            ">

                <h2>
                    New Website Message
                </h2>


                <div style="
                    margin: 20px 0;
                    padding: 15px 18px;
                    background: #ebe4d8;
                    border-left: 3px solid #c9964a;
                ">

                    <p style="
                        margin: 0;
                        font-size: 12px;
                        color: #777;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">
                        Subject
                    </p>

                    <p style="
                        margin: 6px 0 0;
                        color: #24201b;
                        font-size: 18px;
                        font-weight: bold;
                    ">
                        ${escapeHtml(subject)}
                    </p>

                </div>


                <h3>
                    Customer
                </h3>


                <p>
                    <strong>Name:</strong>
                    ${escapeHtml(customerName)}
                </p>


                <p>
                    <strong>Email:</strong>
                    ${escapeHtml(customerEmail)}
                </p>


                <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(
                        customerPhone ||
                        "Not provided"
                    )}
                </p>


                <hr>


                <h3>
                    Message
                </h3>


                <div style="
                    padding: 20px;
                    background: #ffffff;
                    border: 1px solid #ddd5c9;
                    line-height: 1.7;
                ">

                    ${escapeHtml(
                        message
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}

                </div>


                <p style="
                    margin-top: 30px;
                    font-size: 12px;
                    color: #777;
                ">

                    Message ID:
                    ${escapeHtml(messageId)}

                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value: string
) {

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
   JSON RESPONSE
   ========================================================= */

function jsonResponse(
    data: unknown,
    status = 200
) {

    return new Response(

        JSON.stringify(data),

        {

            status,

            headers: {

                ...corsHeaders,

                "Content-Type":
                    "application/json",

            },

        }

    );

}