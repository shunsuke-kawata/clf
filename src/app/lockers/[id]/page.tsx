import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getLockerById } from "@/features/locker/data/lockers";
import { LockerDetail } from "@/features/locker/components/LockerDetail";
import { serverEnv } from "@/lib/env";

type Props = { params: Promise<{ id: string }> };

export default async function LockerDetailPage({ params }: Props) {
  const { id } = await params;
  const locker = await getLockerById(id);
  if (!locker) notFound();

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <h1 className="truncate text-base font-semibold">コインロッカー詳細</h1>
        <Link
          href={`/admin/${locker.id}/edit`}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -mr-2 ml-auto flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="編集"
        >
          <Pencil className="h-5 w-5" />
        </Link>
      </header>

      <main className="mx-auto max-w-lg pb-10">
        <LockerDetail locker={locker} supabaseUrl={serverEnv.SUPABASE_URL} />
      </main>
    </>
  );
}
