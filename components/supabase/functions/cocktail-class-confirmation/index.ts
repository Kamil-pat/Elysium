import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(
    Deno.env.get("RESEND_API_KEY")
);


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
   FUNCTION
   ========================================================= */

serve(async (req) => {

    /* =====================================================
       PREFLIGHT REQUEST
       ===================================================== */

    if (req.method === "OPTIONS") {

        return new Response(
            "ok",
            {
                status: 200,
                headers: corsHeaders
            }
        );

    }


    /* =====================================================
       ONLY ALLOW POST
       ===================================================== */

    if (req.method !== "POST") {

        return new Response(
            JSON.stringify({
                error:
                    "Method not allowed"
            }),
            {
                status: 405,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json"
                }
            }
        );

    }


    try {

        const body =
            await req.json();


        const {
            customerName,
            customerEmail,
            classTitle,
            classDate,
            startTime,
            endTime,
            guestCount,
            total
        } = body;


        /* =================================================
           VALIDATION
           ================================================= */

        if (
            !customerName ||
            !customerEmail ||
            !classTitle ||
            !classDate ||
            !guestCount
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "Missing required booking information."
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /* =================================================
           DATE
           ================================================= */

        const formattedDate =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            ).format(
                new Date(
                    `${classDate}T12:00:00`
                )
            );


        /* =================================================
           TIME
           ================================================= */

        const formatTime = (
            time: string
        ) => {

            if (!time) {
                return "";
            }


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
                    hour: "numeric",
                    minute: "2-digit"
                }
            ).format(date);

        };


        const formattedTime =
            startTime
                ? `${formatTime(startTime)}${
                    endTime
                        ? ` – ${formatTime(endTime)}`
                        : ""
                }`
                : "Time to be confirmed";


        /* =================================================
           SEND EMAIL
           ================================================= */

        const emailResponse =
            await resend.emails.send({

                from:
                    "Elysium Cocktail Lounge <onboarding@resend.dev>",

                to: [
                    customerEmail
                ],

                subject:
                    `Cocktail Class Request Received — ${classTitle}`,

                html: `
                    <!DOCTYPE html>

                    <html>

                    <body style="
                        margin:0;
                        padding:0;
                        background:#080706;
                        color:#f3eee5;
                        font-family:Arial,sans-serif;
                    ">

                        <div style="
                            max-width:600px;
                            margin:0 auto;
                            padding:45px 30px;
                        ">

                            <div style="
                                text-align:center;
                                margin-bottom:35px;
                            ">

                                <h1 style="
                                    margin:0;
                                    color:#c9964a;
                                    font-family:Georgia,serif;
                                    font-weight:400;
                                    letter-spacing:5px;
                                ">
                                    ELYSIUM
                                </h1>

                                <p style="
                                    color:#999;
                                    letter-spacing:3px;
                                    font-size:11px;
                                    text-transform:uppercase;
                                ">
                                    Cocktail Lounge
                                </p>

                            </div>


                            <h2 style="
                                font-family:Georgia,serif;
                                font-weight:400;
                                color:#f3eee5;
                            ">
                                Your Class Request
                                Has Been Received
                            </h2>


                            <p style="
                                color:#c8c0b5;
                                line-height:1.7;
                            ">
                                Hello ${customerName},
                            </p>


                            <p style="
                                color:#c8c0b5;
                                line-height:1.7;
                            ">
                                Thank you for reserving your
                                spot with Elysium. We've received
                                your cocktail class request.
                            </p>


                            <div style="
                                margin:30px 0;
                                padding:25px;
                                border:1px solid #3a332a;
                                background:#11100e;
                            ">

                                <p style="
                                    margin:0 0 15px;
                                    color:#c9964a;
                                    font-size:11px;
                                    letter-spacing:2px;
                                    text-transform:uppercase;
                                ">
                                    Class Details
                                </p>


                                <h3 style="
                                    margin:0 0 20px;
                                    color:#f3eee5;
                                    font-family:Georgia,serif;
                                    font-size:22px;
                                    font-weight:400;
                                ">
                                    ${classTitle}
                                </h3>


                                <p style="
                                    color:#c8c0b5;
                                    line-height:1.7;
                                ">

                                    <strong>
                                        Date:
                                    </strong>
                                    ${formattedDate}

                                    <br>

                                    <strong>
                                        Time:
                                    </strong>
                                    ${formattedTime}

                                    <br>

                                    <strong>
                                        Guests:
                                    </strong>
                                    ${guestCount}

                                    <br>

                                    <strong>
                                        Total:
                                    </strong>
                                    $${Number(total).toFixed(2)}

                                </p>

                            </div>


                            <p style="
                                color:#c8c0b5;
                                line-height:1.7;
                            ">
                                Your request has been received.
                                Our team will follow up with any
                                additional confirmation details.
                            </p>

                        </div>

                    </body>

                    </html>
                `
            });


        /* =================================================
           RESEND ERROR
           ================================================= */

        if (emailResponse.error) {

            console.error(
                "Confirmation email error:",
                emailResponse.error
            );


            return new Response(
                JSON.stringify({
                    error:
                        "Booking was created, but confirmation email could not be sent."
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /* =================================================
           SUCCESS
           ================================================= */

        return new Response(
            JSON.stringify({
                success: true
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json"
                }
            }
        );


    } catch (error) {

        console.error(
            "Cocktail confirmation error:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    "Unable to send confirmation email."
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json"
                }
            }
        );

    }

});