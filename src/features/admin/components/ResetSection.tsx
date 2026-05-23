"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { API_ROUTES } from "@/lib/routes";
import { logger } from "@/lib/logger";

const CONFIRM_WORD = "RESET";

export function ResetSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [resetting, setResetting] = useState(false);

  const confirmed = input === CONFIRM_WORD;

  async function handleReset() {
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await fetch(API_ROUTES.admin.reset, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("すべてのデータを削除しました");
      setOpen(false);
      router.refresh();
    } catch (e) {
      logger.error("[ResetSection] reset failed", e);
      toast.error("リセットに失敗しました");
    } finally {
      setResetting(false);
      setInput("");
    }
  }

  return (
    <section className="px-4 pb-12">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Danger Zone
      </h2>
      <div className="border border-destructive/40 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex gap-2 items-start">
          <TriangleAlert className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            DBとStorageのすべてのデータを削除します。この操作は取り消せません。
          </p>
        </div>
        <Button
          variant="destructive"
          className="w-full min-h-[44px]"
          onClick={() => setOpen(true)}
        >
          全データをリセット
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setInput(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              すべてのコインロッカーと写真が完全に削除されます。確認のため「{CONFIRM_WORD}」と入力してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full rounded-md border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring min-h-[44px] font-mono"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <AlertDialogFooter>
            <button
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent transition-colors min-h-[44px]"
              onClick={() => { setOpen(false); setInput(""); }}
              disabled={resetting}
            >
              キャンセル
            </button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={!confirmed || resetting}
              className="min-h-[44px]"
            >
              {resetting ? "削除中..." : "削除する"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
