"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Locker } from "@/lib/schemas/locker";
import { LockerMarker } from "./LockerMarker";
import { VenueSearchBar } from "./VenueSearchBar";
import { MapClickHandler } from "./MapClickHandler";

// Leaflet デフォルトアイコン修正
function fixLeafletIcon() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

type Props = {
  lockers: Locker[];
  onMapClick?: (lat: number, lng: number) => void;
};

export default function MapView({ lockers, onMapClick }: Props) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={[35.6812, 139.7671]} // 東京駅
      zoom={13}
      className="h-dvh w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <VenueSearchBar />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {lockers.map((locker) => (
        <LockerMarker key={locker.id} locker={locker} />
      ))}
    </MapContainer>
  );
}
