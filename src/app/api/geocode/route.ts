import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";

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
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const url = new URL(APP_CONFIG.geocode.url);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(APP_CONFIG.geocode.upstreamLimit));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "clf-app" },
  });

  if (!res.ok) {
    logger.error("[geocode] upstream failed", { q, status: res.status });
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const data: PhotonResponse = await res.json();
  const japan = data.features.filter((f) => f.properties.countrycode === "JP");
  logger.info("[geocode] ok", { q, hits: japan.length });
  return NextResponse.json(japan.slice(0, APP_CONFIG.geocode.resultLimit).map(normalize));
}
