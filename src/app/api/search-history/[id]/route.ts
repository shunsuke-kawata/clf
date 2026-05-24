import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { readSessionFromRequest } from "@/features/search-history/lib/session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { sessionId } = readSessionFromRequest(req);
  if (!sessionId) {
    logger.warn("[search-history] delete: unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("[search-history] deleted", { id });
  return new NextResponse(null, { status: 204 });
}
