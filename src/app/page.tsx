import { MapViewClient } from "@/features/map/components/MapViewClient";
import { MapFabs } from "@/features/map/components/MapFabs";
import { getLockers } from "@/features/locker/data/lockers";
import { getSession } from "@/features/auth/lib/auth";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ lat?: string; lng?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const [lockers, role, params] = await Promise.all([
    getLockers(),
    getSession(),
    searchParams,
  ]);
  const { lat, lng } = params;
  const flyTo =
    lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : null;

  return (
    <main className="relative">
      <MapViewClient lockers={lockers} supabaseUrl={serverEnv.SUPABASE_URL} flyTo={flyTo} />
      <MapFabs role={role} />
    </main>
  );
}
