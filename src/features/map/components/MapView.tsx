"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Locker } from "@/features/locker/schemas/locker";
import { logger } from "@/lib/logger";
import { LockerMarker } from "./LockerMarker";
import { LockerBottomSheet } from "./LockerBottomSheet";
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

function CurrentLocationButton() {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  async function handleClick() {
    if (!navigator.geolocation) {
      logger.warn("[CurrentLocationButton] geolocation not supported");
      return;
    }
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1.5 });
    } catch (e) {
      logger.warn("[CurrentLocationButton] geolocation failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="absolute bottom-24 right-4 z-[1000]">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="現在地に戻る"
        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-500 disabled:opacity-50 active:scale-95 transition-transform"
      >
        {loading ? (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
        )}
      </button>
    </div>
  );
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
  supabaseUrl: string;
  onMapClick?: (lat: number, lng: number) => void;
  flyTo?: { lat: number; lng: number } | null;
};

type SearchPin = { lat: number; lng: number; name: string };

export default function MapView({ lockers, supabaseUrl, onMapClick, flyTo }: Props) {
  const [searchPin, setSearchPin] = useState<SearchPin | null>(null);
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);

  return (
    <>
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
        <CurrentLocationButton />
        <VenueSearchBar onResult={(lat, lng, name) => setSearchPin({ lat, lng, name })} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {flyTo && <FlyToHandler lat={flyTo.lat} lng={flyTo.lng} />}
        {lockers.map((locker) => (
          <LockerMarker
            key={locker.id}
            locker={locker}
            onSelect={setSelectedLockerId}
          />
        ))}
        {searchPin && <SearchResultMarker {...searchPin} />}
      </MapContainer>
      <LockerBottomSheet
        lockerId={selectedLockerId}
        supabaseUrl={supabaseUrl}
        onClose={() => setSelectedLockerId(null)}
      />
    </>
  );
}
