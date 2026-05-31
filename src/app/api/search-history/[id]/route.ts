import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { readSessionFromRequest } from "@/features/search-history/lib/session";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { sessionId } = readSessionFromRequest(req);
  if (!sessionId) {
    logger.warn("[search-history] delete: unauthorized");
    return withHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), NO_STORE_HEADERS);
  }

  const { id } = await params;
  logger.debug("[search-history] delete", { id, sessionId });

  const { error } = await supabaseAdmin
    .from("search_history")
    .delete()
    .eq("id", id)
    .eq("session_id", sessionId);

  if (error) {
    logger.error("[search-history] delete failed", error);
    return withHeaders(NextResponse.json({ error: error.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.info("[search-history] deleted", { id });
  return withHeaders(new NextResponse(null, { status: 204 }), NO_STORE_HEADERS);
}
