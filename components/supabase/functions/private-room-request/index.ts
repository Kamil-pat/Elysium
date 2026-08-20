/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   PRIVATE ROOM REQUEST EDGE FUNCTION
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* =========================================================
   CORS
   ========================================================= */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};


/* =========================================================
   ENVIRONMENT VARIABLES
   ========================================================= */

const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL")!;


/*
 * Supabase provides the server-side secret keys
 * to Edge Functions.
 */

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

/*
 * Temporary testing sender.
 *
 * We will replace this once Elysium owns a domain.
 */

const FROM_EMAIL =
    "Elysium Cocktail Lounge <onboarding@resend.dev>";


const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_REQUESTS = 5;


/* =========================================================
   MAIN FUNCTION
   ========================================================= */

Deno.serve(
    async (request) => {

        /* =================================================
           CORS PREFLIGHT
           ================================================= */

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


        /* =================================================
           ONLY POST REQUESTS
           ================================================= */

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

            /* =============================================
               READ REQUEST
               ============================================= */

            const body =
                await request.json();


            const {
                customer_name,
                customer_email,
                customer_phone,
                requested_date,
                preferred_start_time,
                preferred_end_time,
                guest_count,
                event_type,
                notes,
            } = body;


            /* =============================================
               REQUIRED FIELD VALIDATION
               ============================================= */

            if (
                !customer_name ||
                !customer_email ||
                !requested_date ||
                !preferred_start_time ||
                !preferred_end_time ||
                !guest_count
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


            /* =============================================
               VALIDATE DATE
               ============================================= */

            const requestedDate =
                new Date(
                    `${requested_date}T12:00:00`
                );


            if (
                Number.isNaN(
                    requestedDate.getTime()
                )
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Please enter a valid date."
                    },

                    400
                );

            }


            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );


            if (
                requestedDate <
                today
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Please select a future date."
                    },

                    400
                );

            }


            /* =============================================
               VALIDATE TIME
               ============================================= */

            if (
                preferred_end_time <=
                preferred_start_time
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "The end time must be after the start time."
                    },

                    400
                );

            }


            /* =============================================
               VALIDATE GUEST COUNT
               ============================================= */

            const guestCount =
                Number(
                    guest_count
                );


            if (
                !Number.isInteger(
                    guestCount
                ) ||
                guestCount < 1
            ) {

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "Please enter a valid number of guests."
                    },

                    400
                );

            }


            const customerEmail =
                String(
                    customer_email
                )
                    .trim()
                    .toLowerCase();

            const rateLimitSince =
                new Date(
                    Date.now() -
                    RATE_LIMIT_WINDOW_HOURS *
                    60 *
                    60 *
                    1000
                ).toISOString();

            const {
                count: recentRequestCount,
                error: rateLimitError
            } =
                await supabaseAdmin
                    .from("private_room_bookings")
                    .select("id", {
                        count: "exact",
                        head: true
                    })
                    .eq("customer_email", customerEmail)
                    .gte("created_at", rateLimitSince);


            if (rateLimitError) {

                console.error(
                    "Private room rate limit check failed:",
                    rateLimitError
                );

                return jsonResponse(
                    {
                        success: false,
                        error: "Unable to process your request right now. Please try again shortly."
                    },
                    503
                );

            }


            if (
                (recentRequestCount || 0) >=
                RATE_LIMIT_MAX_REQUESTS
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error: "Too many requests from this email address. Please try again later."
                    },
                    429
                );

            }


            /* =============================================
               SAVE REQUEST
               ============================================= */

            const {
                data: booking,
                error: databaseError,
            } =
                await supabaseAdmin
                    .from(
                        "private_room_bookings"
                    )
                    .insert({

                        customer_name:
                            customer_name.trim(),

                        customer_email:
                            customerEmail,

                        customer_phone:
                            customer_phone
                                ?.trim() ||
                            null,

                        requested_date,

                        preferred_start_time,

                        preferred_end_time,

                        guest_count:
                            guestCount,

                        event_type:
                            event_type
                                ?.trim() ||
                            null,

                        notes:
                            notes
                                ?.trim() ||
                            null,

                        status:
                            "pending",

                    })
                    .select("id, request_number")
                    .single();


            /* =============================================
               DATABASE FAILURE
               ============================================= */

            if (
                databaseError
            ) {

                console.error(
                    "Database error:",
                    databaseError
                );

                return jsonResponse(
                    {
                        success: false,

                        error:
                            "We were unable to save your request. Please try again."
                    },

                    500
                );

            }


            /* =============================================
               FORMAT DATE
               ============================================= */

            const formattedDate =
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        weekday:
                            "long",

                        month:
                            "long",

                        day:
                            "numeric",

                        year:
                            "numeric",
                    }
                ).format(
                    requestedDate
                );


            /* =============================================
               FORMAT TIMES
               ============================================= */

            const formattedStart =
                formatTime(
                    preferred_start_time
                );


            const formattedEnd =
                formatTime(
                    preferred_end_time
                );


            /* =============================================
               SEND MANAGER EMAIL
               ============================================= */

            const managerEmail =
                await sendEmail({

                    to:
                        MANAGER_EMAIL,

                    subject:
                        "New Elysium Private Room Request",

                    replyTo:
                        customerEmail,

                    html:
                        buildManagerEmail({

                            customerName:
                                customer_name,

                            customerEmail:
                                customerEmail,

                            customerPhone:
                                customer_phone,

                            requestedDate:
                                formattedDate,

                            startTime:
                                formattedStart,

                            endTime:
                                formattedEnd,

                            guestCount,

                            eventType:
                                event_type,

                            notes,

                            bookingId:
                                booking.id,

                            requestNumber:
                                booking.request_number,

                        }),

                });


            /* =============================================
               MANAGER EMAIL FAILURE
               ============================================= */

            if (
                !managerEmail.success
            ) {

                /*
                 * The request has already been saved.
                 *
                 * We log the email failure but do NOT
                 * pretend the customer's request failed.
                 */

                console.error(
                    "Manager email failed:",
                    managerEmail.error
                );

            }


            /* =============================================
               CUSTOMER EMAIL
               ============================================= */

            /*
             * Customer email is intentionally treated as
             * optional for now.
             *
             * Resend currently restricts the testing sender
             * to the Resend account owner.
             *
             * Once Elysium has a verified domain, this will
             * send automatically to the customer.
             */

            const customerEmailResult =
                await sendEmail({

                    to:
                        customerEmail,

                    subject:
                        "We've Received Your Elysium Private Room Request",

                    html:
                        buildCustomerEmail({

                            customerName:
                                customer_name,

                            requestedDate:
                                formattedDate,

                            startTime:
                                formattedStart,

                            endTime:
                                formattedEnd,

                        }),

                });


            /* =============================================
               CUSTOMER EMAIL FAILURE
               ============================================= */

            if (
                !customerEmailResult.success
            ) {

                /*
                 * This is NOT a request failure.
                 *
                 * The booking request has already been
                 * successfully saved.
                 */

                console.warn(
                    "Customer confirmation email could not be sent:",
                    customerEmailResult.error
                );

            }


            /* =============================================
               SUCCESS
               ============================================= */

            return jsonResponse({

                success:
                    true,

                request_id:
                    booking.id,

            });

        } catch (error) {

            console.error(
                "Private room request error:",
                error
            );


            return jsonResponse(
                {
                    success: false,

                    error:
                        "Something went wrong while sending your request. Please try again."
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
    requestedDate,
    startTime,
    endTime,
    guestCount,
    eventType,
    notes,
    bookingId,
    requestNumber,
}: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    requestedDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    eventType?: string;
    notes?: string;
    bookingId: string;
    requestNumber: string;
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
                    Private Room Request
                </p>

            </div>


            <div style="
                padding: 35px;
                background: #f7f3ec;
            ">

                <h2>
                    New Private Room Request
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
                        Request Number
                    </p>

                    <p style="
                        margin: 6px 0 0;
                        color: #24201b;
                        font-size: 18px;
                        font-weight: bold;
                    ">
                        ${escapeHtml(requestNumber)}
                    </p>

                </div>


                <p>
                    A new private room request has
                    been submitted through the website.
                </p>


                <hr>


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


                <h3>
                    Event Details
                </h3>

                <p>
                    <strong>Date:</strong>
                    ${escapeHtml(requestedDate)}
                </p>

                <p>
                    <strong>Preferred Time:</strong>
                    ${escapeHtml(startTime)}
                    –
                    ${escapeHtml(endTime)}
                </p>

                <p>
                    <strong>Guests:</strong>
                    ${guestCount}
                </p>

                <p>
                    <strong>Event Type:</strong>
                    ${escapeHtml(
                        eventType ||
                        "Not specified"
                    )}
                </p>


                <h3>
                    Additional Details
                </h3>

                <p>
                    ${escapeHtml(
                        notes ||
                        "No additional details provided."
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>


                <hr>


                <p style="
                    font-size: 12px;
                    color: #777;
                ">
                    Request Number:
                    ${escapeHtml(requestNumber)}
                    <br>
                    Internal ID:
                    ${escapeHtml(bookingId)}
                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   CUSTOMER EMAIL
   ========================================================= */

function buildCustomerEmail({
    customerName,
    requestedDate,
    startTime,
    endTime,
}: {
    customerName: string;
    requestedDate: string;
    startTime: string;
    endTime: string;
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
                padding: 40px;
                text-align: center;
            ">

                <h1 style="
                    color: #c9964a;
                    font-family: Georgia, serif;
                    font-weight: 400;
                    letter-spacing: 5px;
                    margin: 0;
                ">
                    ELYSIUM
                </h1>

                <p style="
                    color: #d8d0c5;
                ">
                    Cocktail Lounge
                </p>

            </div>


            <div style="
                padding: 40px;
                background: #f7f3ec;
            ">

                <h2 style="
                    font-family: Georgia, serif;
                    font-weight: 400;
                ">
                    Thank You,
                    ${escapeHtml(customerName)}.
                </h2>


                <p>
                    We've received your private room request.
                </p>


                <p>
                    Our team will review your requested
                    date and time and contact you shortly
                    with further information regarding your
                    booking.
                </p>


                <div style="
                    margin: 30px 0;
                    padding: 25px;
                    background: #ebe4d8;
                    border-left: 3px solid #c9964a;
                ">

                    <p>
                        <strong>
                            Requested Date
                        </strong>
                        <br>
                        ${escapeHtml(requestedDate)}
                    </p>

                    <p>
                        <strong>
                            Requested Time
                        </strong>
                        <br>
                        ${escapeHtml(startTime)}
                        –
                        ${escapeHtml(endTime)}
                    </p>

                </div>


                <p>
                    Please note that this request does not
                    represent a confirmed reservation.
                    Your booking will only be confirmed
                    once our team has contacted you.
                </p>


                <p>
                    We look forward to helping you create
                    an unforgettable evening at Elysium.
                </p>


                <p style="
                    margin-top: 40px;
                    color: #777;
                ">
                    Elysium Cocktail Lounge
                    <br>
                    Huntsville, Alabama
                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    time: string
) {

    const [
        hours,
        minutes
    ] =
        time
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
            hour:
                "numeric",

            minute:
                "2-digit",
        }
    ).format(date);

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