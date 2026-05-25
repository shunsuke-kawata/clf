import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSessionRole } from "@/features/auth/lib/auth";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const role = await getSessionRole(req);
  if (!role) {
    logger.warn("[admin/reset] unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "admin") {
    logger.warn("[admin/reset] forbidden (not admin)");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: lockersError.message }, { status: 500 });
  }

  logger.info("[admin/reset] lockers deleted", { count: deletedCount });

  const { error: historyError } = await supabaseAdmin
    .from("search_history")
    .delete()
    .not("id", "is", null);

  if (historyError) {
    logger.warn("[admin/reset] search_history reset failed", historyError);
  }

  return new NextResponse(null, { status: 204 });
}
