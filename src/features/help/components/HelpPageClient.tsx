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
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1 py-3 px-1.5 bg-background border-l border-y rounded-l-xl shadow-md"
      >
        <List className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground [writing-mode:vertical-rl]">目次</span>
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <HelpContent onSectionChange={setActiveId} />
      </div>
    </>
  );
}
