"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

type Props = {
  lat: number;
  lng: number;
  name: string;
};

export function SearchResultMarker({ lat, lng, name }: Props) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="
          width:16px;height:16px;
          background:#f97316;
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.4)
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -12],
      }),
    []
  );

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>{name.split(",")[0]}</Popup>
    </Marker>
  );
}
