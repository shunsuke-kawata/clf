"use client";

import Link from "next/link";
import { Plus, Settings, LogIn, HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { PAGE_ROUTES } from "@/lib/routes";
import type { SessionRole } from "@/features/auth/lib/auth";

type Props = {
  role: SessionRole | null;
};

export function MapFabs({ role }: Props) {
  return (
    <>
      <Tooltip tooltipKey="help" side="right">
        <Link
          href={PAGE_ROUTES.help}
          className="bg-secondary text-secondary-foreground absolute top-[68px] left-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full border shadow-md"
          aria-label="使い方"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>
      </Tooltip>

      {!role && (
        <Tooltip tooltipKey="login" side="left">
          <Link
            href={PAGE_ROUTES.login}
            className="bg-primary text-primary-foreground absolute right-4 bottom-6 z-[1000] flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
            aria-label="ログイン"
          >
            <LogIn className="h-6 w-6" />
          </Link>
        </Tooltip>
      )}

      {role && (
        <Tooltip tooltipKey="newLocker" side="left">
          <Link
            href={PAGE_ROUTES.newLocker}
            className="bg-primary text-primary-foreground absolute right-4 bottom-6 z-[1000] flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
            aria-label="新規投稿"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </Tooltip>
      )}

      {role === "admin" && (
        <Tooltip tooltipKey="admin" side="left">
          <Link
            href={PAGE_ROUTES.admin}
            className="bg-secondary text-secondary-foreground absolute top-[68px] right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full border shadow-md"
            aria-label="管理画面"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </Tooltip>
      )}

      {role && (
        <LogoutButton
          className={`absolute ${role === "admin" ? "top-[132px]" : "top-[68px]"} bg-secondary text-secondary-foreground right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full border shadow-md`}
        />
      )}
    </>
  );
}
