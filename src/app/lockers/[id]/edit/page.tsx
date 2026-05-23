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
      <header className="sticky top-0 z-[800] bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href={PAGE_ROUTES.lockerDetail(locker.id)}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="詳細に戻る"
        >
          ←
        </Link>
        <h1 className="flex-1 text-base font-semibold">編集</h1>
        <LogoutButton className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" />
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
