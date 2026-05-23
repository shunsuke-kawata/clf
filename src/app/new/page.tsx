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
      <header className="sticky top-0 z-[800] bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href={PAGE_ROUTES.home}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <h1 className="flex-1 text-base font-semibold">新規投稿</h1>
        <LogoutButton className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" />
      </header>
      <LockerForm mode="create" />
    </>
  );
}
