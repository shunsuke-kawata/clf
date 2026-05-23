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
        const body = await res.json().catch(() => ({})) as { error?: string };
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
      <p className="text-sm text-muted-foreground text-center py-8">
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
            <li key={locker.id} className="flex items-center gap-3 px-4 py-3 bg-card border rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{locker.note || "メモなし"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    写真{photoCount}枚
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(locker.created_at)}</span>
                </div>
              </div>

              <button
                className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                onClick={() => setPendingId(locker.id)}
                aria-label="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={pendingId !== null} onOpenChange={(open) => { if (!open) setPendingId(null); }}>
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
