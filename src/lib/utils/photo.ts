import { APP_CONFIG } from "@/lib/config";

export function getPhotoUrl(supabaseUrl: string, storageKey: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${APP_CONFIG.photo.bucket}/${storageKey}`;
}
