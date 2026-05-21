import { supabaseReader } from "@/lib/supabase/server";
import type { Locker } from "@/features/locker/schemas/locker";

export async function getLockers(): Promise<Locker[]> {
  const { data, error } = await supabaseReader
    .from("lockers")
    .select("id, lat, lng, note, pricing, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
