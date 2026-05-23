import { APP_CONFIG } from "@/lib/config";
import { API_ROUTES } from "@/lib/routes";

export function getPhotoUrl(supabaseUrl: string, storageKey: string): string {
  // 本番はSupabase Storage直リンク。開発時はNext.jsプロキシ経由（127.0.0.1はiPhoneから到達不能かつMixed Content）
  if (APP_CONFIG.isProd) {
    return `${supabaseUrl}/storage/v1/object/public/${APP_CONFIG.photo.bucket}/${storageKey}`;
  }
  return API_ROUTES.photos.proxy(storageKey);
}
