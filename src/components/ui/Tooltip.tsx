"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import tooltips from "@/lib/tooltips.json";

export type TooltipKey = keyof typeof tooltips;

type Props = {
  tooltipKey: TooltipKey;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
};

export function Tooltip({ tooltipKey, children, side = "left", className }: Props) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            avoidCollisions
            collisionPadding={8}
            sideOffset={8}
            className={cn(
              "bg-foreground text-background z-[9999] rounded-md px-2.5 py-1.5 text-xs shadow-md",
              "whitespace-nowrap select-none",
              className
            )}
          >
            {tooltips[tooltipKey]}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
