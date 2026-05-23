import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";

// ローカル開発専用。本番はgetPhotoUrlがSupabase Storage直リンクを返すためこのルートは不要
const VALID_KEY = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]+$/i;

export async function GET(req: NextRequest) {
  if (APP_CONFIG.isProd) {
    return new NextResponse(null, { status: 404 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key || !VALID_KEY.test(key)) {
    logger.warn("[photos/proxy] invalid or missing key", { key });
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const url = `${serverEnv.SUPABASE_URL}/storage/v1/object/public/${APP_CONFIG.photo.bucket}/${key}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      logger.warn("[photos/proxy] upstream returned non-ok", { status: upstream.status, key });
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    logger.error("[photos/proxy] fetch failed", e);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
