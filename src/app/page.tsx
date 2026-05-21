import Link from "next/link";
import { MapViewClient } from "@/features/map/components/MapViewClient";
import { getLockers } from "@/features/locker/data/lockers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lockers = await getLockers();

  return (
    <main className="relative">
      <MapViewClient lockers={lockers} />
      <Link
        href="/admin/new"
        className="absolute bottom-6 right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg text-2xl font-light"
        aria-label="新規投稿"
      >
        ＋
      </Link>
    </main>
  );
}
