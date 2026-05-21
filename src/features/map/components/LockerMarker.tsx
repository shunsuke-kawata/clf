"use client";

import { Marker, Popup } from "react-leaflet";
import Link from "next/link";
import type { Locker } from "@/features/locker/schemas/locker";

type Props = {
  locker: Locker;
};

export function LockerMarker({ locker }: Props) {
  return (
    <Marker position={[locker.lat, locker.lng]}>
      <Popup>
        <div className="min-w-[120px]">
          <p className="font-semibold text-sm">コインロッカー</p>
          <Link
            href={`/lockers/${locker.id}`}
            className="text-xs text-blue-600 underline mt-1 inline-block"
          >
            詳細を見る
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
