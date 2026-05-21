"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { LockerInput } from "@/features/locker/schemas/locker";

const PRICE_OPTIONS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function PricingEditor() {
  const { watch, setValue } = useFormContext<LockerInput>();
  const pricing = watch("pricing");
  const [open, setOpen] = useState(false);

  function togglePrice(price: number) {
    if (pricing.includes(price)) {
      setValue("pricing", pricing.filter((p) => p !== price));
    } else {
      setValue("pricing", [...pricing, price].sort((a, b) => a - b));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">料金</label>

      {pricing.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pricing.map((price) => (
            <span
              key={price}
              className="flex-shrink-0 flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium"
            >
              ¥{price.toLocaleString()}
              <button
                type="button"
                onClick={() => togglePrice(price)}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/20 text-xs leading-none"
                aria-label={`¥${price.toLocaleString()}を削除`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-input bg-background text-sm text-left min-h-[44px]"
      >
        <span className={pricing.length > 0 ? "text-foreground" : "text-muted-foreground"}>
          {pricing.length > 0 ? `${pricing.length}件選択中` : "料金を選択"}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1001] flex items-end"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-background rounded-t-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-base">料金を選択</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-primary min-h-[44px] min-w-[44px] flex items-center justify-end"
              >
                完了
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "60dvh" }}>
              {PRICE_OPTIONS.map((price, i) => (
                <label
                  key={price}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-accent active:bg-accent ${
                    i < PRICE_OPTIONS.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pricing.includes(price)}
                    onChange={() => togglePrice(price)}
                    className="w-4 h-4"
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
