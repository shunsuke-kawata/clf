"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LockerIcon } from "@/components/icons/LockerIcon";
import type { LockerWithPhotos } from "@/features/locker/schemas/locker";
import type { LockerGroup } from "@/features/map/lib/groupLockersByCoord";
import { getPhotoUrl } from "@/lib/utils/photo";
import { API_ROUTES } from "@/lib/routes";
import { logger } from "@/lib/logger";

type Props = {
  group: LockerGroup | null;
  supabaseUrl: string;
  onClose: () => void;
  onSelectLocker: (id: string) => void;
};

function lockerLabel(locker: LockerWithPhotos): string {
  if (locker.note) {
    const firstLine = locker.note.split("\n")[0].trim();
    return firstLine.length > 24 ? firstLine.slice(0, 24) + "…" : firstLine;
  }
  return "コインロッカー";
}

export function LockerSelectSheet({ group, supabaseUrl, onClose, onSelectLocker }: Props) {
  const [lockers, setLockers] = useState<LockerWithPhotos[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!group) {
      setLockers([]);
      return;
    }
    setLoading(true);
    Promise.all(
      group.lockers.map((locker) =>
        fetch(API_ROUTES.lockers.detail(locker.id))
          .then((res) => {
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            return res.json() as Promise<LockerWithPhotos>;
          })
      )
    )
      .then(setLockers)
      .catch((e) => {
        logger.error("[LockerSelectSheet] fetch failed", e);
      })
      .finally(() => setLoading(false));
  }, [group]);

  return (
    <Sheet
      open={group !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton
        className="z-[2000] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-8"
      >
        <SheetHeader>
          <SheetTitle>この場所のロッカー ({group?.lockers.length}件)</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-col gap-3 px-4 pt-2">
            {group?.lockers.map((l) => (
              <div key={l.id} className="flex gap-3 py-2">
                <div className="bg-muted h-20 w-20 shrink-0 animate-pulse rounded-xl" />
                <div className="flex flex-1 flex-col gap-2 pt-2">
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <ul className="flex flex-col divide-y px-4">
            {lockers.map((locker) => {
              const firstPhoto = [...(locker.locker_photos ?? [])].sort(
                (a, b) => a.order_index - b.order_index
              )[0];
              const thumbUrl = firstPhoto
                ? getPhotoUrl(supabaseUrl, firstPhoto.storage_key)
                : null;
              return (
                <li key={locker.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-3 text-left"
                    onClick={() => {
                      onClose();
                      onSelectLocker(locker.id);
                    }}
                  >
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt="ロッカー写真"
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center rounded-xl">
                        <LockerIcon className="text-muted-foreground h-10 w-10" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {lockerLabel(locker)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
