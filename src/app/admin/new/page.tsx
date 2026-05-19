import Link from "next/link";
import { LockerForm } from "@/components/form/LockerForm";

export default function NewLockerPage() {
  return (
    <>
      <header className="sticky top-0 z-[800] bg-background/95 backdrop-blur-sm border-b flex items-center gap-3 px-4 h-14">
        <Link
          href="/"
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="地図に戻る"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold">新規投稿</h1>
      </header>
      <LockerForm mode="create" />
    </>
  );
}
