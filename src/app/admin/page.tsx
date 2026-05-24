import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/features/auth/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { PAGE_ROUTES } from "@/lib/routes";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminLockerList } from "@/features/admin/components/AdminLockerList";
import { ResetSection } from "@/features/admin/components/ResetSection";

export default async function AdminPage() {
  const role = await getSession();
  if (role !== "admin") redirect(PAGE_ROUTES.home);

  const [lockersResult, photoCountResult] = await Promise.all([
    supabaseAdmin
      .from("lockers")
      .select("id, note, created_at, locker_photos(id, storage_key, order_index)")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("locker_photos").select("id", { count: "exact", head: true }),
  ]);

  const lockers = lockersResult.data ?? [];
  const photoCount = photoCountResult.count ?? 0;

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-[800] flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.home}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-base font-semibold">管理画面</h1>
          <Badge variant="outline" className="text-xs">
            ADMIN
          </Badge>
        </div>
        <Link
          href={PAGE_ROUTES.newLocker}
          className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="新規投稿"
        >
          <Plus className="h-5 w-5" />
        </Link>
        <LogoutButton className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors" />
      </header>

      <main className="flex flex-col gap-6 py-6">
        {/* 統計 */}
        <section>
          <h2 className="text-muted-foreground mb-3 px-4 text-sm font-semibold tracking-wide uppercase">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-2 px-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold tabular-nums">{lockers.length}</p>
                <p className="text-muted-foreground mt-1 text-xs">ロッカー</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold tabular-nums">{photoCount}</p>
                <p className="text-muted-foreground mt-1 text-xs">写真</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ロッカー一覧 */}
        <section>
          <h2 className="text-muted-foreground mb-3 px-4 text-sm font-semibold tracking-wide uppercase">
            Lockers
          </h2>
          <div className="px-4">
            <AdminLockerList
              lockers={lockers as Parameters<typeof AdminLockerList>[0]["lockers"]}
              supabaseUrl={serverEnv.SUPABASE_URL}
            />
          </div>
        </section>

        {/* 危険操作 */}
        <ResetSection />
      </main>
    </>
  );
}
