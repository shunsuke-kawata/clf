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
          className="absolute top-[68px] left-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-md border"
          aria-label="使い方"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>
      </Tooltip>

      {!role && (
        <Tooltip tooltipKey="login" side="left">
          <Link
            href={PAGE_ROUTES.login}
            className="absolute bottom-6 right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="ログイン"
          >
            <LogIn className="w-6 h-6" />
          </Link>
        </Tooltip>
      )}

      {role && (
        <Tooltip tooltipKey="newLocker" side="left">
          <Link
            href={PAGE_ROUTES.newLocker}
            className="absolute bottom-6 right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="新規投稿"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </Tooltip>
      )}

      {role === "admin" && (
        <Tooltip tooltipKey="admin" side="left">
          <Link
            href={PAGE_ROUTES.admin}
            className="absolute top-[68px] right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-md border"
            aria-label="管理画面"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </Tooltip>
      )}

      {role && (
        <LogoutButton
          className={`absolute ${role === "admin" ? "top-[132px]" : "top-[68px]"} right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-md border`}
        />
      )}
    </>
  );
}
