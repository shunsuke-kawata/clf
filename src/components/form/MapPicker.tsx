"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// マウント時とbfcache復元時にタイルのフリーズを防ぐ
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    // 外部リンクを開いてブラウザバックした際、bfcacheから復元されるとuseEffectは
    // 再実行されないが、pageshoweventは発火するので、そこでinvalidateSizeを呼ぶ
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) map.invalidateSize();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [map]);
  return null;
}

// flyTarget が変わったときだけ地図を移動する
function FlyToController({
  target,
}: {
  target: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const prevTarget = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!target) return;
    if (
      prevTarget.current?.lat === target.lat &&
      prevTarget.current?.lng === target.lng
    ) return;
    prevTarget.current = target;
    map.flyTo([target.lat, target.lng], 19, { duration: 0.8 });
  }, [target, map]);

  return null;
}

type Props = {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  flyTarget?: { lat: number; lng: number } | null;
};

export default function MapPicker({ lat, lng, onChange, flyTarget = null }: Props) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={19}
      className="h-64 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizer />
      {onChange && <ClickHandler onChange={onChange} />}
      <Marker position={[lat, lng]} />
      <FlyToController target={flyTarget} />
    </MapContainer>
  );
}
