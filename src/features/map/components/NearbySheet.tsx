"use client";

import { Navigation } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LockerIcon } from "@/components/icons/LockerIcon";
import type { Locker } from "@/features/locker/schemas/locker";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";

type UserLocation = { lat: number; lng: number };

type Props = {
  open: boolean;
  onClose: () => void;
  lockers: Locker[];
  userLocation: UserLocation | null;
  onSelectLocker: (locker: Locker) => void;
};

function lockerLabel(locker: Locker): string {
  if (locker.note) {
    const firstLine = locker.note.split("\n")[0].trim();
    return firstLine.length > 20 ? firstLine.slice(0, 20) + "…" : firstLine;
  }
  return "コインロッカー";
}

export function NearbySheet({
  open,
  onClose,
  lockers,
  userLocation,
  onSelectLocker,
}: Props) {
  const sorted = userLocation
    ? [...lockers].sort((a, b) => {
        const da = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      })
    : lockers;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="z-[2000] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-8"
      >
        <SheetHeader>
          <SheetTitle>近くのロッカー</SheetTitle>
        </SheetHeader>

        {!userLocation && (
          <p className="text-sm text-muted-foreground text-center py-8">
            位置情報を取得中...
          </p>
        )}

        {userLocation && sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            登録されたロッカーがありません
          </p>
        )}

        {userLocation && sorted.length > 0 && (
          <ul className="flex flex-col divide-y px-4">
            {sorted.map((locker) => {
              const dist = haversineDistance(
                userLocation.lat,
                userLocation.lng,
                locker.lat,
                locker.lng
              );
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${locker.lat},${locker.lng}`;

              return (
                <li key={locker.id} className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => onSelectLocker(locker)}
                  >
                    <LockerIcon className="w-8 h-8 shrink-0 text-foreground" />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {lockerLabel(locker)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistance(dist)}
                      </span>
                    </span>
                  </button>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 active:opacity-70"
                    aria-label="Googleマップで経路案内"
                  >
                    <Navigation className="w-3 h-3" />
                    ナビ
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
