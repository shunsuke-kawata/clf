import Link from "next/link";
import type { Locker } from "@/lib/schemas/locker";
import { MapViewClient } from "@/components/map/MapViewClient";

async function getLockers(): Promise<Locker[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/lockers`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

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
