import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSessionRole } from "@/features/auth/lib/auth";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

export async function DELETE(req: NextRequest) {
  const role = await getSessionRole(req);
  if (!role) {
    logger.warn("[admin/reset] unauthorized");
    return withHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), NO_STORE_HEADERS);
  }
  if (role !== "admin") {
    logger.warn("[admin/reset] forbidden (not admin)");
    return withHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }), NO_STORE_HEADERS);
  }

  logger.debug("[admin/reset] fetching all photo storage keys");
  const { data: photos } = await supabaseAdmin.from("locker_photos").select("storage_key");

  if (photos && photos.length > 0) {
    const keys = photos.map((p: { storage_key: string }) => p.storage_key);
    const { error: storageError } = await supabaseAdmin.storage
      .from(APP_CONFIG.photo.bucket)
      .remove(keys);
    if (storageError) {
      logger.error("[admin/reset] storage removal failed", storageError);
    } else {
      logger.debug("[admin/reset] storage files removed", { count: keys.length });
    }
  }

  logger.debug("[admin/reset] deleting all lockers from DB");
  const { error: lockersError, count: deletedCount } = await supabaseAdmin
    .from("lockers")
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (lockersError) {
    logger.error("[admin/reset] DB reset failed", lockersError);
    return withHeaders(NextResponse.json({ error: lockersError.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.info("[admin/reset] lockers deleted", { count: deletedCount });

  const { error: historyError } = await supabaseAdmin
    .from("search_history")
    .delete()
    .not("id", "is", null);

  if (historyError) {
    logger.warn("[admin/reset] search_history reset failed", historyError);
  }

  return withHeaders(new NextResponse(null, { status: 204 }), NO_STORE_HEADERS);
}
