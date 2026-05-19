import { NextRequest, NextResponse } from "next/server";

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

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "10");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "clf-app" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const data: PhotonResponse = await res.json();
  const japan = data.features.filter((f) => f.properties.countrycode === "JP");
  return NextResponse.json(japan.slice(0, 5).map(normalize));
}
