"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutAction } from "@/features/auth/actions";
import { PAGE_ROUTES } from "@/lib/routes";
import { Tooltip } from "@/components/ui/Tooltip";

type Props = {
  className?: string;
};

export function LogoutButton({ className }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    toast.success("ログアウトしました");
    router.push(PAGE_ROUTES.home);
    router.refresh();
  }

  return (
    <Tooltip tooltipKey="logout" side="left">
      <button
        type="button"
        onClick={handleLogout}
        className={className}
        aria-label="ログアウト"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </Tooltip>
  );
}
