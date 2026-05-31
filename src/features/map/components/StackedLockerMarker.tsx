"use client";

import { useMemo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import type { LockerGroup } from "@/features/map/lib/groupLockersByCoord";

type Props = {
  group: LockerGroup;
  onSelect: (group: LockerGroup) => void;
};

export function StackedLockerMarker({ group, onSelect }: Props) {
  const count = group.lockers.length;

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="
          position:relative;
          width:32px;height:40px;
        ">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C9.373 2 4 7.373 4 14c0 8.75 12 24 12 24S28 22.75 28 14c0-6.627-5.373-12-12-12z" fill="#1d4ed8" stroke="white" stroke-width="1.5"/>
          </svg>
          <span style="
            position:absolute;
            top:6px;left:50%;
            transform:translateX(-50%);
            color:white;
            font-size:12px;
            font-weight:700;
            font-family:sans-serif;
            line-height:1;
            pointer-events:none;
          ">${count}</span>
        </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      }),
    [count]
  );

  return (
    <Marker
      position={[group.lat, group.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(group) }}
    />
  );
}
