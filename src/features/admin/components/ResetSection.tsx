"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
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
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("すべてのデータを削除しました");
      setOpen(false);
      window.location.reload();
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
      <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
        Danger Zone
      </h2>
      <div className="border-destructive/40 flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex items-start gap-2">
          <TriangleAlert className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="text-muted-foreground text-sm">
            DBとStorageのすべてのデータを削除します。この操作は取り消せません。
          </p>
        </div>
        <Button variant="destructive" className="min-h-[44px] w-full" onClick={() => setOpen(true)}>
          全データをリセット
        </Button>
      </div>

      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setInput("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              すべてのコインロッカーと写真が完全に削除されます。確認のため「{CONFIRM_WORD}
              」と入力してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="border-input bg-background focus:ring-ring min-h-[44px] w-full rounded-md border px-4 py-3 font-mono text-base outline-none focus:ring-2"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <AlertDialogFooter>
            <button
              className="border-input bg-background hover:bg-accent inline-flex min-h-[44px] items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
              onClick={() => {
                setOpen(false);
                setInput("");
              }}
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
