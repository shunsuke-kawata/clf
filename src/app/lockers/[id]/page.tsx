import { notFound } from "next/navigation";
import Link from "next/link";
import type { LockerWithPhotos } from "@/lib/schemas/locker";
import { getPhotoUrl } from "@/lib/utils/photo";

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

export default async function LockerDetailPage({ params }: Props) {
  const { id } = await params;
  const locker = await getLocker(id);
  if (!locker) notFound();

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const photos = (locker.locker_photos ?? []).sort((a, b) => a.order_index - b.order_index);

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
        <h1 className="text-base font-semibold truncate">{locker.name || "名称なし"}</h1>
        <Link
          href={`/admin/${locker.id}/edit`}
          className="ml-auto flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="編集"
        >
          ✏️
        </Link>
      </header>

      <main className="max-w-lg mx-auto pb-10">
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2 snap-x snap-mandatory">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={getPhotoUrl(supabaseUrl, photo.storage_key)}
                alt="ロッカー写真"
                className="h-52 w-auto rounded-xl object-cover flex-shrink-0 snap-start"
              />
            ))}
          </div>
        )}

        <div className="px-4 pt-4 flex flex-col gap-5">
          {locker.pricing.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">料金</h2>
              <div className="flex flex-wrap gap-2">
                {locker.pricing.map((price, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                  >
                    ¥{price.toLocaleString()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {locker.note && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">メモ</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{locker.note}</p>
            </section>
          )}

          {locker.pricing.length === 0 && !locker.note && photos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">情報がありません</p>
          )}
        </div>
      </main>
    </>
  );
}
