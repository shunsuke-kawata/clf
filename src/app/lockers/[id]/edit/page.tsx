import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/features/auth/lib/auth";
import { getLockerById } from "@/features/locker/data/lockers";
import { PAGE_ROUTES } from "@/lib/routes";
import { LockerForm } from "@/features/locker/components/LockerForm";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

type Props = { params: Promise<{ id: string }> };

export default async function EditLockerPage({ params }: Props) {
  if (!(await getSession())) {
    redirect(PAGE_ROUTES.login);
  }

  const { id } = await params;
  const locker = await getLockerById(id);
  if (!locker) notFound();

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-[800] flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.lockerDetail(locker.id)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="詳細に戻る"
        >
          ←
        </Link>
        <h1 className="flex-1 text-base font-semibold">編集</h1>
        <LogoutButton className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors" />
      </header>
      <LockerForm
        mode="edit"
        lockerId={locker.id}
        defaultValues={{
          lat: locker.lat,
          lng: locker.lng,
          note: locker.note ?? "",
          pricing: locker.pricing,
        }}
      />
    </>
  );
}
