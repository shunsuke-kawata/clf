import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HelpPageClient } from "@/features/help/components/HelpPageClient";
import { PAGE_ROUTES } from "@/lib/routes";

export default function HelpPage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.home}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full hover:bg-muted transition-colors"
          aria-label="地図に戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-semibold">使い方</h1>
      </header>

      {/* ヒーロー */}
      <div className="bg-muted/40 border-b px-4 py-6 text-center">
        <h2 className="text-2xl font-bold mb-1">CLFの使い方</h2>
        <p className="text-sm text-muted-foreground">
          コインロッカーを地図に記録・管理するアプリです
        </p>
      </div>

      <HelpPageClient />
    </main>
  );
}
