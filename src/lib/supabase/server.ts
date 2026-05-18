import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL, ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
}

// 読み取り専用（SELECT）: anon key
export const supabaseReader = createClient(supabaseUrl, supabaseAnonKey);

// 書き込み（INSERT/UPDATE/DELETE）: service_role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
