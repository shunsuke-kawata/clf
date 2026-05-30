import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";
import {
  readSessionFromRequest,
  createSearchSession,
  searchSessionCookieOptions,
} from "@/features/search-history/lib/session";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

export async function GET(req: NextRequest) {
  const { sessionId, isNew } = readSessionFromRequest(req);

  if (isNew || !sessionId) {
    const res = NextResponse.json([]);
    const { cookieValue, sessionId: newId } = createSearchSession();
    logger.debug("[search-history] issuing new session", { sessionId: newId });
    res.cookies.set(APP_CONFIG.searchHistory.cookieName, cookieValue, searchSessionCookieOptions());
    return withHeaders(res, NO_STORE_HEADERS);
  }

  logger.debug("[search-history] list: querying DB", { sessionId });
  const { data, error } = await supabaseAdmin
    .from("search_history")
    .select("id, query, lat, lng, display_name, searched_at")
    .eq("session_id", sessionId)
    .order("searched_at", { ascending: false })
    .limit(APP_CONFIG.searchHistory.limit);

  if (error) {
    logger.error("[search-history] list failed", error);
    return withHeaders(NextResponse.json({ error: error.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.debug("[search-history] list ok", { count: data?.length ?? 0 });
  return withHeaders(NextResponse.json(data), NO_STORE_HEADERS);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const lat = typeof body?.lat === "number" ? body.lat : null;
  const lng = typeof body?.lng === "number" ? body.lng : null;
  const display_name = typeof body?.display_name === "string" ? body.display_name.trim() : null;
  if (!query) {
    logger.warn("[search-history] upsert: missing query");
    return withHeaders(NextResponse.json({ error: "query is required" }, { status: 400 }), NO_STORE_HEADERS);
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
      { session_id: sessionId, query, lat, lng, display_name, searched_at: new Date().toISOString() },
      { onConflict: "session_id,query" }
    )
    .select("id, query, lat, lng, display_name, searched_at")
    .single();

  if (error) {
    logger.error("[search-history] upsert failed", error);
    return withHeaders(NextResponse.json({ error: error.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.info("[search-history] upserted", { id: data.id });
  const res = NextResponse.json(data, { status: 200 });
  if (newCookieValue) {
    res.cookies.set(APP_CONFIG.searchHistory.cookieName, newCookieValue, searchSessionCookieOptions());
  }
  return withHeaders(res, NO_STORE_HEADERS);
}
