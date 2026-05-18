"use client";

import { useMapEvents } from "react-leaflet";

type Props = {
  onMapClick: (lat: number, lng: number) => void;
};

export function MapClickHandler({ onMapClick }: Props) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
