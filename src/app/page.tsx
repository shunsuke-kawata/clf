import Link from "next/link";
import { MapViewClient } from "@/features/map/components/MapViewClient";
import { getLockers } from "@/features/locker/data/lockers";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lat?: string; lng?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const lockers = await getLockers();
  const { lat, lng } = await searchParams;
  const flyTo =
    lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : null;

  return (
    <main className="relative">
      <MapViewClient lockers={lockers} supabaseUrl={serverEnv.SUPABASE_URL} flyTo={flyTo} />
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
