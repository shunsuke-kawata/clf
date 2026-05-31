import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { withHeaders, NO_STORE_HEADERS, IMMUTABLE_CACHE_HEADERS } from "@/lib/api-headers";

// ローカル開発専用。本番はgetPhotoUrlがSupabase Storage直リンクを返すためこのルートは不要
const VALID_KEY = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]+$/i;

export async function GET(req: NextRequest) {
  if (APP_CONFIG.isProd) {
    return withHeaders(new NextResponse(null, { status: 404 }), NO_STORE_HEADERS);
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key || !VALID_KEY.test(key)) {
    logger.warn("[photos/proxy] invalid or missing key", { key });
    return withHeaders(NextResponse.json({ error: "Invalid key" }, { status: 400 }), NO_STORE_HEADERS);
  }

  const url = `${serverEnv.SUPABASE_URL}/storage/v1/object/public/${APP_CONFIG.photo.bucket}/${key}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      logger.warn("[photos/proxy] upstream returned non-ok", { status: upstream.status, key });
      return withHeaders(new NextResponse(null, { status: upstream.status }), NO_STORE_HEADERS);
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const body = await upstream.arrayBuffer();
    return withHeaders(
      new NextResponse(body, { status: 200, headers: { "Content-Type": contentType } }),
      IMMUTABLE_CACHE_HEADERS
    );
  } catch (e) {
    logger.error("[photos/proxy] fetch failed", e);
    return withHeaders(NextResponse.json({ error: "Failed to fetch image" }, { status: 502 }), NO_STORE_HEADERS);
  }
}
