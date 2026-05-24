"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { LockerInput } from "@/features/locker/schemas/locker";

const PRICE_OPTIONS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function PricingEditor() {
  const { watch, setValue } = useFormContext<LockerInput>();
  const pricing = watch("pricing");
  const [open, setOpen] = useState(false);

  function togglePrice(price: number) {
    if (pricing.includes(price)) {
      setValue(
        "pricing",
        pricing.filter((p) => p !== price)
      );
    } else {
      setValue(
        "pricing",
        [...pricing, price].sort((a, b) => a - b)
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">料金</label>

      {pricing.length > 0 && (
        <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
          {pricing.map((price) => (
            <span
              key={price}
              className="bg-primary text-primary-foreground flex flex-shrink-0 items-center gap-1 rounded-full py-1 pr-1.5 pl-2.5 text-xs font-medium"
            >
              ¥{price.toLocaleString()}
              <button
                type="button"
                onClick={() => togglePrice(price)}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20"
                aria-label={`¥${price.toLocaleString()}を削除`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-input bg-background flex min-h-[44px] w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm"
      >
        <span className={pricing.length > 0 ? "text-foreground" : "text-muted-foreground"}>
          {pricing.length > 0 ? `${pricing.length}件選択中` : "料金を選択"}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[1001] flex items-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="bg-background relative w-full overflow-hidden rounded-t-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">料金を選択</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-primary flex min-h-[44px] min-w-[44px] items-center justify-end text-sm font-medium"
              >
                完了
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "60dvh" }}>
              {PRICE_OPTIONS.map((price, i) => (
                <label
                  key={price}
                  className={`hover:bg-accent active:bg-accent flex cursor-pointer items-center gap-3 px-5 py-3.5 ${
                    i < PRICE_OPTIONS.length - 1 ? "border-border border-b" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pricing.includes(price)}
                    onChange={() => togglePrice(price)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">¥{price.toLocaleString()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
