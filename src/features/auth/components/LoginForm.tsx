"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";
import { PAGE_ROUTES } from "@/lib/routes";

type Props = {
  variant?: "user" | "admin";
};

export function LoginForm({ variant = "user" }: Props) {
  const [state, action, pending] = useActionState(loginAction.bind(null, variant), null);
  const isAdmin = variant === "admin";

  return (
    <form action={action} className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-center">
        {isAdmin ? "管理者ログイン" : "ログイン"}
      </h1>

      <input
        type="password"
        name="password"
        placeholder={isAdmin ? "管理者パスワード" : "パスワード"}
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

      <p className="text-center text-sm text-muted-foreground">
        {isAdmin ? (
          <Link href={PAGE_ROUTES.login} className="underline underline-offset-4 hover:text-foreground">
            ← 通常ログインに戻る
          </Link>
        ) : (
          <Link href={PAGE_ROUTES.adminLogin} className="underline underline-offset-4 hover:text-foreground">
            管理者の方はこちら →
          </Link>
        )}
      </p>
    </form>
  );
}
