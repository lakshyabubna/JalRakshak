import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The UI remains usable in demo mode until Supabase credentials are configured.
export const supabase = url && key ? createClient(url, key) : null;
