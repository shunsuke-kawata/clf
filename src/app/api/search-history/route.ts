import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";
import {
  readSessionFromRequest,
  createSearchSession,
  searchSessionCookieOptions,
} from "@/features/search-history/lib/session";

export async function GET(req: NextRequest) {
  const { sessionId, isNew } = readSessionFromRequest(req);

  if (isNew || !sessionId) {
    const res = NextResponse.json([]);
    const { cookieValue, sessionId: newId } = createSearchSession();
    logger.debug("[search-history] issuing new session", { sessionId: newId });
    res.cookies.set(APP_CONFIG.searchHistory.cookieName, cookieValue, searchSessionCookieOptions());
    return res;
  }

  logger.debug("[search-history] list: querying DB", { sessionId });
  const { data, error } = await supabaseAdmin
    .from("search_history")
    .select("id, query, searched_at")
    .eq("session_id", sessionId)
    .order("searched_at", { ascending: false })
    .limit(APP_CONFIG.searchHistory.limit);

  if (error) {
    logger.error("[search-history] list failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.debug("[search-history] list ok", { count: data?.length ?? 0 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    logger.warn("[search-history] upsert: missing query");
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let { sessionId, isNew } = readSessionFromRequest(req);
  let newCookieValue: string | undefined;

  if (isNew || !sessionId) {
    const session = createSearchSession();
    sessionId = session.sessionId;
    newCookieValue = session.cookieValue;
    logger.debug("[search-history] issuing new session on upsert", { sessionId });
  }

  logger.debug("[search-history] upsert", { sessionId, query });
  const { data, error } = await supabaseAdmin
    .from("search_history")
    .upsert(
      { session_id: sessionId, query, searched_at: new Date().toISOString() },
      { onConflict: "session_id,query" }
    )
    .select("id, query, searched_at")
    .single();

  if (error) {
    logger.error("[search-history] upsert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("[search-history] upserted", { id: data.id });
  const res = NextResponse.json(data, { status: 200 });
  if (newCookieValue) {
    res.cookies.set(APP_CONFIG.searchHistory.cookieName, newCookieValue, searchSessionCookieOptions());
  }
  return res;
}
