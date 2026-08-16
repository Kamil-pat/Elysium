/* =========================================================
   ELYSIUM COCKTAIL LOUNGE
   SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL = "https://ujifckqzaacwzpfdfuhe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VIA19VR8MDwEarx7X01Z0w_JHphpS5f";


/*
 * Supabase's browser client.
 *
 * The publishable key is safe to use on the frontend.
 * Database security is handled by Row Level Security.
 */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);