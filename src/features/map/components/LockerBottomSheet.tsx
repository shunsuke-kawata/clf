"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LockerDetail } from "@/features/locker/components/LockerDetail";
import type { LockerWithPhotos } from "@/features/locker/schemas/locker";
import { API_ROUTES, PAGE_ROUTES } from "@/lib/routes";
import { logger } from "@/lib/logger";

type Props = {
  lockerId: string | null;
  supabaseUrl: string;
  onClose: () => void;
};

export function LockerBottomSheet({ lockerId, supabaseUrl, onClose }: Props) {
  const [locker, setLocker] = useState<LockerWithPhotos | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lockerId) {
      setLocker(null);
      return;
    }
    setLoading(true);
    fetch(API_ROUTES.lockers.detail(lockerId))
      .then((res) => {
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        return res.json() as Promise<LockerWithPhotos>;
      })
      .then(setLocker)
      .catch((e) => {
        logger.error("[LockerBottomSheet] fetch failed", e);
        setLocker(null);
      })
      .finally(() => setLoading(false));
  }, [lockerId]);

  return (
    <Sheet
      open={lockerId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="z-[2000] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-8"
      >
        <SheetHeader className="flex-row items-center justify-between pr-10">
          <SheetTitle>コインロッカー</SheetTitle>
          {locker && (
            <Link
              href={PAGE_ROUTES.lockerEdit(locker.id)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors"
              aria-label="編集"
            >
              <Pencil className="h-5 w-5" />
            </Link>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex gap-2 overflow-hidden">
              <div className="bg-muted h-52 w-36 flex-shrink-0 animate-pulse rounded-xl" />
              <div className="bg-muted h-52 w-36 flex-shrink-0 animate-pulse rounded-xl" />
            </div>
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-8 w-16 animate-pulse rounded-full" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {!loading && locker && <LockerDetail locker={locker} supabaseUrl={supabaseUrl} />}

        {!loading && !locker && lockerId && (
          <p className="text-muted-foreground py-8 text-center text-sm">読み込みに失敗しました</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
