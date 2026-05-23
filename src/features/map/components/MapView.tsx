"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Locker } from "@/features/locker/schemas/locker";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";
import { Navigation } from "lucide-react";
import { LockerIcon } from "@/components/icons/LockerIcon";
import { LockerMarker } from "./LockerMarker";
import { LockerBottomSheet } from "./LockerBottomSheet";
import { NearbySheet } from "./NearbySheet";
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
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: APP_CONFIG.map.geolocationTimeout })
      );
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1.5 });
    } catch (e) {
      logger.warn("[CurrentLocationButton] geolocation failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="absolute bottom-44 right-4 z-[1000]">
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
          <Navigation className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}

type UserLocation = { lat: number; lng: number };

function NearbyButton({ onOpen }: { onOpen: (loc: UserLocation) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  async function handleClick() {
    if (!navigator.geolocation) {
      logger.warn("[NearbyButton] geolocation not supported");
      return;
    }
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: APP_CONFIG.map.geolocationTimeout,
        })
      );
      onOpen({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      logger.warn("[NearbyButton] geolocation failed", e);
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
        aria-label="近くのロッカーを探す"
        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-primary disabled:opacity-50 active:scale-95 transition-transform"
      >
        {loading ? (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <LockerIcon className="w-6 h-6 text-primary" />
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
L.Icon.Default.mergeOptions(APP_CONFIG.map.leafletIcons);

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
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyToLocker, setFlyToLocker] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <>
      <MapContainer
        center={[APP_CONFIG.map.defaultCenter.lat, APP_CONFIG.map.defaultCenter.lng]}
        zoom={13}
        className="h-dvh w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution={APP_CONFIG.map.tileAttribution}
          url={APP_CONFIG.map.tileUrl}
        />
        <MapResizeHandler />
        <ZoomControl position="bottomleft" />
        <CurrentLocationButton />
        <NearbyButton
          onOpen={(loc) => {
            setUserLocation(loc);
            setNearbyOpen(true);
          }}
        />
        <VenueSearchBar onResult={(lat, lng, name) => setSearchPin({ lat, lng, name })} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {flyTo && <FlyToHandler lat={flyTo.lat} lng={flyTo.lng} />}
        {flyToLocker && <FlyToHandler lat={flyToLocker.lat} lng={flyToLocker.lng} />}
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
      <NearbySheet
        open={nearbyOpen}
        onClose={() => setNearbyOpen(false)}
        lockers={lockers}
        userLocation={userLocation}
        onSelectLocker={(locker) => {
          setNearbyOpen(false);
          setSelectedLockerId(locker.id);
          setFlyToLocker({ lat: locker.lat, lng: locker.lng });
        }}
      />
    </>
  );
}
