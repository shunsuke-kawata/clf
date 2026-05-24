"use client";

import { useState } from "react";
import { Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { API_ROUTES } from "@/lib/routes";
import { getPhotoUrl } from "@/lib/utils/photo";
import { logger } from "@/lib/logger";

type LockerItem = {
  id: string;
  note: string | null;
  created_at: string;
  locker_photos: { id: string; storage_key: string; order_index: number }[];
};

type Props = {
  lockers: LockerItem[];
  supabaseUrl: string;
};

export function AdminLockerList({ lockers: initial, supabaseUrl }: Props) {
  const [lockers, setLockers] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!pendingId) return;
    setDeleting(true);
    try {
      const res = await fetch(API_ROUTES.lockers.delete(pendingId), { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setLockers((prev) => prev.filter((l) => l.id !== pendingId));
      toast.success("ロッカーを削除しました");
    } catch (e) {
      logger.error("[AdminLockerList] delete failed", e);
      toast.error("削除に失敗しました");
    } finally {
      setDeleting(false);
      setPendingId(null);
    }
  }

  function getFirstPhotoUrl(locker: LockerItem): string | null {
    const sorted = [...locker.locker_photos].sort((a, b) => a.order_index - b.order_index);
    if (!sorted[0]) return null;
    return getPhotoUrl(supabaseUrl, sorted[0].storage_key);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  }

  if (lockers.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        登録されているロッカーはありません
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {lockers.map((locker) => {
          const photoUrl = getFirstPhotoUrl(locker);
          const photoCount = locker.locker_photos.length;

          return (
            <li
              key={locker.id}
              className="bg-card flex items-center gap-3 rounded-xl border px-4 py-3"
            >
              <div className="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <MapPin className="text-muted-foreground h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{locker.note || "メモなし"}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    写真{photoCount}枚
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(locker.created_at)}
                  </span>
                </div>
              </div>

              <button
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors"
                onClick={() => setPendingId(locker.id)}
                aria-label="削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={pendingId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このロッカーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              ロッカー情報と関連する写真がすべて削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
