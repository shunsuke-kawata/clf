"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // Cookie セット後はソフトナビゲーションではなくフルリロードで遷移する
      window.location.replace("/admin/new");
      return;
    }

    logger.warn("[login] auth failed", { status: res.status });
    setLoading(false);
    setError("パスワードが違います");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold text-center">ログイン</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          required
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="min-h-[44px]">
          {loading ? "確認中..." : "ログイン"}
        </Button>
      </form>
    </main>
  );
}
