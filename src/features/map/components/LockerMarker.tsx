"use client";

import { Marker } from "react-leaflet";
import type { Locker } from "@/features/locker/schemas/locker";

type Props = {
  locker: Locker;
  onSelect: (id: string) => void;
};

export function LockerMarker({ locker, onSelect }: Props) {
  return (
    <Marker
      position={[locker.lat, locker.lng]}
      eventHandlers={{ click: () => onSelect(locker.id) }}
    />
  );
}
