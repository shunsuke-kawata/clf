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
  const photos = locker.locker_photos ?? [];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24">
      <Link href="/" className="text-sm text-muted-foreground mb-4 inline-block">
        ← 地図に戻る
      </Link>

      <h1 className="text-2xl font-bold mb-4">{locker.name}</h1>

      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {photos
            .sort((a, b) => a.order_index - b.order_index)
            .map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={getPhotoUrl(supabaseUrl, photo.storage_key)}
                alt="ロッカー写真"
                className="h-48 w-auto rounded-lg object-cover flex-shrink-0"
              />
            ))}
        </div>
      )}

      {locker.pricing.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-semibold mb-2">料金</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="text-left px-3 py-2">サイズ</th>
                <th className="text-left px-3 py-2">時間</th>
                <th className="text-right px-3 py-2">料金</th>
              </tr>
            </thead>
            <tbody>
              {locker.pricing.map((item, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">{item.size}</td>
                  <td className="px-3 py-2">{item.duration}</td>
                  <td className="px-3 py-2 text-right">¥{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {locker.note && (
        <section className="mb-4">
          <h2 className="text-base font-semibold mb-2">メモ</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
            {locker.note}
          </p>
        </section>
      )}

      <Link
        href={`/admin/${locker.id}/edit`}
        className="fixed bottom-6 right-4 flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-lg text-xl"
        aria-label="編集"
      >
        ✏️
      </Link>
    </main>
  );
}
