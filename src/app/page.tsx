import Link from "next/link";
import { Plus, Settings, LogIn } from "lucide-react";
import { MapViewClient } from "@/features/map/components/MapViewClient";
import { getLockers } from "@/features/locker/data/lockers";
import { getSession } from "@/features/auth/lib/auth";
import { serverEnv } from "@/lib/env";
import { PAGE_ROUTES } from "@/lib/routes";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

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

      {!role && (
        <Link
          href={PAGE_ROUTES.login}
          className="absolute bottom-6 right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
          aria-label="ログイン"
        >
          <LogIn className="w-6 h-6" />
        </Link>
      )}

      {role && (
        <Link
          href={PAGE_ROUTES.newLocker}
          className="absolute bottom-6 right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
          aria-label="新規投稿"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}

      {role === "admin" && (
        <Link
          href={PAGE_ROUTES.admin}
          className="absolute top-[68px] right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-md border"
          aria-label="管理画面"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}

      {role && (
        <LogoutButton
          className={`absolute ${role === "admin" ? "top-[132px]" : "top-[68px]"} right-4 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-md border`}
        />
      )}
    </main>
  );
}
