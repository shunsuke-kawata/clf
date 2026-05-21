import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/features/auth/lib/auth";
import { getLockerById } from "@/features/locker/data/lockers";
import { LockerForm } from "@/features/locker/components/LockerForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditLockerPage({ params }: Props) {
  if (!(await getSession())) {
    redirect("/login");
  }

  const { id } = await params;
  const locker = await getLockerById(id);
  if (!locker) notFound();

  return (
    <>
      <header className="sticky top-0 z-[800] bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href={`/lockers/${locker.id}`}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="詳細に戻る"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold">編集</h1>
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
