const SUPABASE_URL = "https://etmkprgchnrwokpznvrm.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KPV4OTbNzx_2xGQAqF5TQg_8qQ3GkfN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);