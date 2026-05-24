"use client";

import { useState } from "react";
import { List } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HelpContent, HELP_SECTIONS, type HelpSectionId } from "./HelpContent";
import { HelpToc } from "./HelpSidebar";

export function HelpPageClient() {
  const [activeId, setActiveId] = useState<HelpSectionId>(HELP_SECTIONS[0].id);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 固定の目次トグルボタン */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="目次を開く"
        className="bg-background fixed top-1/2 right-0 z-50 flex -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-xl border-y border-l px-1.5 py-3 shadow-md"
      >
        <List className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-[10px] [writing-mode:vertical-rl]">目次</span>
      </button>

      {/* 目次 Sheet（左から） */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 px-4 py-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-sm">目次</SheetTitle>
          </SheetHeader>
          <HelpToc activeId={activeId} onSelect={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* コンテンツ */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <HelpContent onSectionChange={setActiveId} />
      </div>
    </>
  );
}
