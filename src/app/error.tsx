"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    logger.error("[ErrorBoundary] page crashed", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-4xl">⚠️</p>
      <h1 className="text-lg font-semibold">エラーが発生しました</h1>
      <p className="text-sm text-muted-foreground">
        ページの読み込みに失敗しました。時間をおいて再試行してください。
      </p>
      <Button onClick={reset} className="min-h-[44px]">
        再試行
      </Button>
    </main>
  );
}
