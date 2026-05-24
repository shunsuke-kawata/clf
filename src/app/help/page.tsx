import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HelpPageClient } from "@/features/help/components/HelpPageClient";
import { PAGE_ROUTES } from "@/lib/routes";

export default function HelpPage() {
  return (
    <main className="bg-background min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.home}
          className="hover:bg-muted -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="地図に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold">使い方</h1>
      </header>

      {/* ヒーロー */}
      <div className="bg-muted/40 border-b px-4 py-6 text-center">
        <h2 className="mb-1 text-2xl font-bold">CLFの使い方</h2>
        <p className="text-muted-foreground text-sm">
          コインロッカーを地図に記録・管理するアプリです
        </p>
      </div>

      <HelpPageClient />
    </main>
  );
}
