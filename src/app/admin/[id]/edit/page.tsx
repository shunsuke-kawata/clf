import { notFound } from "next/navigation";
import Link from "next/link";
import { LockerForm } from "@/components/form/LockerForm";
import type { LockerWithPhotos } from "@/lib/schemas/locker";

type Props = { params: Promise<{ id: string }> };

async function getLocker(id: string): Promise<LockerWithPhotos | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/lockers/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch locker");
  return res.json();
}

export default async function EditLockerPage({ params }: Props) {
  const { id } = await params;
  const locker = await getLocker(id);
  if (!locker) notFound();

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href={`/lockers/${locker.id}`}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="詳細に戻る"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold">編集</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-5">
        <LockerForm
          mode="edit"
          lockerId={locker.id}
          defaultValues={{
            name: locker.name,
            lat: locker.lat,
            lng: locker.lng,
            note: locker.note ?? "",
            pricing: locker.pricing,
          }}
        />
      </main>
    </>
  );
}
