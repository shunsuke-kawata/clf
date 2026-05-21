"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-center">ログイン</h1>

        <input
          type="password"
          name="password"
          placeholder="パスワード"
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          required
        />

        {state?.error && (
          <p className="text-sm text-destructive text-center">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="min-h-[44px]">
          {pending ? "確認中..." : "ログイン"}
        </Button>
      </form>
    </main>
  );
}
