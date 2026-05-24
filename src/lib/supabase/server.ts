import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

// 読み取り専用（SELECT）: anon key
export const supabaseReader = createClient(serverEnv.SUPABASE_URL, serverEnv.ANON_KEY);

// 書き込み（INSERT/UPDATE/DELETE）: service_role key
export const supabaseAdmin = createClient(
  serverEnv.SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
);
