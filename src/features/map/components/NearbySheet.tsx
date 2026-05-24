"use client";

import { Navigation } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export function NearbySheet({ open, onClose, lockers, userLocation, onSelectLocker }: Props) {
  const sorted = userLocation
    ? [...lockers].sort((a, b) => {
        const da = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      })
    : lockers;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton
        className="z-[2000] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-8"
      >
        <SheetHeader>
          <SheetTitle>近くのロッカー</SheetTitle>
        </SheetHeader>

        {!userLocation && (
          <p className="text-muted-foreground py-8 text-center text-sm">位置情報を取得中...</p>
        )}

        {userLocation && sorted.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
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
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => onSelectLocker(locker)}
                  >
                    <LockerIcon className="text-foreground h-8 w-8 shrink-0" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{lockerLabel(locker)}</span>
                      <span className="text-muted-foreground text-xs">{formatDistance(dist)}</span>
                    </span>
                  </button>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium active:opacity-70"
                    aria-label="Googleマップで経路案内"
                  >
                    <Navigation className="h-3 w-3" />
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
