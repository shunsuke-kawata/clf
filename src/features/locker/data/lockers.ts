import { supabaseReader } from "@/lib/supabase/server";
import type { Locker, LockerWithPhotos } from "@/features/locker/schemas/locker";

export async function getLockers(): Promise<Locker[]> {
  const { data, error } = await supabaseReader
    .from("lockers")
    .select("id, lat, lng, note, pricing, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getLockerById(id: string): Promise<LockerWithPhotos | null> {
  const { data, error } = await supabaseReader
    .from("lockers")
    .select(
      "id, lat, lng, note, pricing, created_at, updated_at, locker_photos(id, storage_key, order_index)"
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as LockerWithPhotos;
}
