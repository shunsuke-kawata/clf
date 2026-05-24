import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { LockerForm } from "@/features/locker/components/LockerForm";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default async function NewLockerPage() {
  if (!(await getSession())) {
    redirect(PAGE_ROUTES.login);
  }
  return (
    <>
      <header className="bg-background/95 sticky top-0 z-[800] flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.home}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <h1 className="flex-1 text-base font-semibold">新規投稿</h1>
        <LogoutButton className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors" />
      </header>
      <LockerForm mode="create" />
    </>
  );
}
