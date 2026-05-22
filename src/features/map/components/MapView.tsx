"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Locker } from "@/features/locker/schemas/locker";
import { LockerMarker } from "./LockerMarker";
import { VenueSearchBar } from "./VenueSearchBar";
import { MapClickHandler } from "./MapClickHandler";
import { SearchResultMarker } from "./SearchResultMarker";

function FlyToHandler({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1.5 });
  }, [map, lat, lng]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => map.invalidateSize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, [map]);
  return null;
}

// Leaflet デフォルトアイコン修正（モジュールロード時に即時実行）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  lockers: Locker[];
  onMapClick?: (lat: number, lng: number) => void;
  flyTo?: { lat: number; lng: number } | null;
};

type SearchPin = { lat: number; lng: number; name: string };

export default function MapView({ lockers, onMapClick, flyTo }: Props) {
  const [searchPin, setSearchPin] = useState<SearchPin | null>(null);

  return (
    <MapContainer
      center={[35.6812, 139.7671]} // 東京駅
      zoom={13}
      className="h-dvh w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeHandler />
      <ZoomControl position="bottomleft" />
      <VenueSearchBar onResult={(lat, lng, name) => setSearchPin({ lat, lng, name })} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {flyTo && <FlyToHandler lat={flyTo.lat} lng={flyTo.lng} />}
      {lockers.map((locker) => (
        <LockerMarker key={locker.id} locker={locker} />
      ))}
      {searchPin && <SearchResultMarker {...searchPin} />}
    </MapContainer>
  );
}
