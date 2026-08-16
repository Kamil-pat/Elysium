/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
    "https://ujifckqzaacwzpfdfuhe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_VIA19VR8MDwEarx7X01Z0w_JHphpS5f";


/*
 * Create the Supabase client.
 *
 * We expose it through window so every JavaScript file
 * on the website can access the same client.
 */

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );