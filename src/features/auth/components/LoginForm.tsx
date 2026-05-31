"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";
import { PAGE_ROUTES } from "@/lib/routes";

type Props = {
  variant?: "user" | "admin";
  redirectTo?: string;
};

export function LoginForm({ variant = "user", redirectTo }: Props) {
  const [state, action, pending] = useActionState(loginAction.bind(null, variant), null);
  const isAdmin = variant === "admin";

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <h1 className="text-center text-xl font-semibold">
        {isAdmin ? "管理者ログイン" : "ログイン"}
      </h1>

      <input
        type="password"
        name="password"
        placeholder={isAdmin ? "管理者パスワード" : "パスワード"}
        autoComplete="current-password"
        className="border-input bg-background focus:ring-ring min-h-[44px] w-full rounded-md border px-4 py-3 text-base outline-none focus:ring-2"
        required
      />

      {state?.error && <p className="text-destructive text-center text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} className="min-h-[44px]">
        {pending ? "確認中..." : "ログイン"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {isAdmin ? (
          <Link
            href={PAGE_ROUTES.login}
            className="hover:text-foreground underline underline-offset-4"
          >
            ← 通常ログインに戻る
          </Link>
        ) : (
          <Link
            href={PAGE_ROUTES.adminLogin}
            className="hover:text-foreground underline underline-offset-4"
          >
            管理者の方はこちら →
          </Link>
        )}
      </p>
    </form>
  );
}
