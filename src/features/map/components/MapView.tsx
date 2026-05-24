"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Locker } from "@/features/locker/schemas/locker";
import { logger } from "@/lib/logger";
import { APP_CONFIG } from "@/lib/config";
import { Navigation } from "lucide-react";
import { LockerIcon } from "@/components/icons/LockerIcon";
import { Tooltip } from "@/components/ui/Tooltip";
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

function CurrentLocationButton({
  currentPosition,
  onClear,
}: {
  currentPosition: UserLocation | null;
  onClear?: () => void;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  function flyToIfNeeded(lat: number, lng: number) {
    const targetZoom = APP_CONFIG.map.currentLocationZoom;
    const dist = map.distance(map.getCenter(), [lat, lng]);
    if (dist < APP_CONFIG.map.currentLocationSkipDistanceMeters && map.getZoom() >= targetZoom)
      return;
    map.flyTo([lat, lng], targetZoom, { duration: 1.5 });
  }

  async function handleClick() {
    onClear?.();
    if (currentPosition) {
      flyToIfNeeded(currentPosition.lat, currentPosition.lng);
      return;
    }
    if (!navigator.geolocation) {
      logger.warn("[CurrentLocationButton] geolocation not supported");
      return;
    }
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: APP_CONFIG.map.geolocationTimeout,
        })
      );
      flyToIfNeeded(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      logger.warn("[CurrentLocationButton] geolocation failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="absolute right-4 bottom-44 z-[1000]">
      <Tooltip tooltipKey="currentLocation">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          aria-label="現在地に戻る"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-500 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Navigation className="h-6 w-6" />
          )}
        </button>
      </Tooltip>
    </div>
  );
}

type UserLocation = { lat: number; lng: number };

function UserLocationMarker({ lat, lng }: UserLocation) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<svg width="24" height="38" viewBox="0 0 24 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ug" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stop-color="#B8E8FF"/>
              <stop offset="100%" stop-color="#3AAAD8"/>
            </radialGradient>
          </defs>
          <rect x="10" y="20" width="4" height="18" rx="2" fill="#3AAAD8"/>
          <circle cx="12" cy="12" r="11" fill="url(#ug)"/>
        </svg>`,
        iconSize: [24, 38],
        iconAnchor: [12, 38],
      }),
    []
  );

  return <Marker position={[lat, lng]} icon={icon} interactive={false} zIndexOffset={-100} />;
}

function NearbyButton({
  onOpen,
  currentPosition,
  searchPin,
}: {
  onOpen: (loc: UserLocation, originName?: string) => void;
  currentPosition: UserLocation | null;
  searchPin: SearchPin | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  async function handleClick() {
    // 施設検索済みの場合は検索地点を基準にする
    if (searchPin) {
      onOpen({ lat: searchPin.lat, lng: searchPin.lng }, searchPin.name);
      return;
    }
    if (currentPosition) {
      onOpen(currentPosition);
      return;
    }
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
    <div ref={containerRef} className="absolute right-4 bottom-24 z-[1000]">
      <Tooltip tooltipKey="nearbyLockers">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          aria-label="近くのロッカーを探す"
          className="text-primary flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <LockerIcon className="text-primary h-6 w-6" />
          )}
        </button>
      </Tooltip>
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
  const [nearbyOriginName, setNearbyOriginName] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyToLocker, setFlyToLocker] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => logger.warn("[MapView] watchPosition failed", err),
      { timeout: APP_CONFIG.map.geolocationTimeout }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <>
      <MapContainer
        center={[APP_CONFIG.map.defaultCenter.lat, APP_CONFIG.map.defaultCenter.lng]}
        zoom={13}
        maxZoom={APP_CONFIG.map.maxZoom}
        className="h-dvh w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution={APP_CONFIG.map.tileAttribution}
          url={APP_CONFIG.map.tileUrl}
          maxNativeZoom={APP_CONFIG.map.maxNativeZoom}
          maxZoom={APP_CONFIG.map.maxZoom}
        />
        <MapResizeHandler />
        <ZoomControl position="bottomleft" />
        <CurrentLocationButton
          currentPosition={currentPosition}
          onClear={() => setSearchPin(null)}
        />
        <NearbyButton
          currentPosition={currentPosition}
          searchPin={searchPin}
          onOpen={(loc, originName) => {
            setUserLocation(loc);
            setNearbyOriginName(originName);
            setNearbyOpen(true);
          }}
        />
        {currentPosition && (
          <UserLocationMarker lat={currentPosition.lat} lng={currentPosition.lng} />
        )}
        <VenueSearchBar
          onResult={(lat, lng, name) => setSearchPin({ lat, lng, name })}
          onClear={() => setSearchPin(null)}
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {flyTo && <FlyToHandler lat={flyTo.lat} lng={flyTo.lng} />}
        {flyToLocker && <FlyToHandler lat={flyToLocker.lat} lng={flyToLocker.lng} />}
        {lockers.map((locker) => (
          <LockerMarker key={locker.id} locker={locker} onSelect={setSelectedLockerId} />
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
        userLocation={nearbyOriginName ? userLocation : (currentPosition ?? userLocation)}
        originName={nearbyOriginName}
        onSelectLocker={(locker) => {
          setNearbyOpen(false);
          setSelectedLockerId(locker.id);
          setFlyToLocker({ lat: locker.lat, lng: locker.lng });
        }}
      />
    </>
  );
}
