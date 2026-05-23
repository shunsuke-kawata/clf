"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet open={lockerId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="z-[2000] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-8"
      >
        <SheetHeader className="flex-row items-center justify-between pr-10">
          <SheetTitle>コインロッカー</SheetTitle>
          {locker && (
            <Link
              href={PAGE_ROUTES.adminEdit(locker.id)}
              className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="編集"
            >
              <Pencil className="w-5 h-5" />
            </Link>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex gap-2 overflow-hidden">
              <div className="h-52 w-36 rounded-xl bg-muted animate-pulse flex-shrink-0" />
              <div className="h-52 w-36 rounded-xl bg-muted animate-pulse flex-shrink-0" />
            </div>
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-8 w-16 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        )}

        {!loading && locker && (
          <LockerDetail locker={locker} supabaseUrl={supabaseUrl} />
        )}

        {!loading && !locker && lockerId && (
          <p className="text-sm text-muted-foreground text-center py-8">
            読み込みに失敗しました
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
