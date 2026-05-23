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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href="/"
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold truncate">コインロッカー詳細</h1>
        <Link
          href={`/admin/${locker.id}/edit`}
          className="ml-auto flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="編集"
        >
          <Pencil className="w-5 h-5" />
        </Link>
      </header>

      <main className="max-w-lg mx-auto pb-10">
        <LockerDetail locker={locker} supabaseUrl={serverEnv.SUPABASE_URL} />
      </main>
    </>
  );
}
