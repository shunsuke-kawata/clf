import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    street?: string;
    housenumber?: string;
  };
};

type PhotonResponse = {
  features: PhotonFeature[];
};

// Photon レスポンスを既存の形式に正規化
function normalize(feature: PhotonFeature): { lat: string; lon: string; display_name: string } {
  const [lon, lat] = feature.geometry.coordinates;
  const p = feature.properties;

  const parts = [p.name, p.city ?? p.state, p.country].filter(Boolean);
  const display_name = parts.join(", ");

  return { lat: String(lat), lon: String(lon), display_name };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return withHeaders(NextResponse.json({ error: "q is required" }, { status: 400 }), NO_STORE_HEADERS);
  }

  const url = new URL(APP_CONFIG.geocode.url);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(APP_CONFIG.geocode.upstreamLimit));
  logger.debug("[geocode] calling upstream API", { q });

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "clf-app" },
  });

  if (!res.ok) {
    logger.error("[geocode] upstream failed", { q, status: res.status });
    return withHeaders(NextResponse.json({ error: "Geocoding failed" }, { status: 502 }), NO_STORE_HEADERS);
  }

  const data: PhotonResponse = await res.json();
  logger.debug("[geocode] upstream responded", { total: data.features.length });
  const japan = data.features.filter((f) => f.properties.countrycode === "JP");
  logger.debug("[geocode] filtered to JP", { hits: japan.length });
  logger.info("[geocode] ok", { q, hits: japan.length });
  return withHeaders(
    NextResponse.json(japan.slice(0, APP_CONFIG.geocode.resultLimit).map(normalize)),
    NO_STORE_HEADERS
  );
}
