"use client";

import { useFormContext } from "react-hook-form";
import type { LockerInput } from "@/lib/schemas/locker";

const PRICE_OPTIONS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function PricingEditor() {
  const { watch, setValue } = useFormContext<LockerInput>();
  const pricing = watch("pricing");

  function addPrice(price: number) {
    setValue("pricing", [...pricing, price]);
  }

  function removePrice(index: number) {
    setValue("pricing", pricing.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">料金</label>

      {pricing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pricing.map((price, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary text-primary-foreground text-sm"
            >
              ¥{price.toLocaleString()}
              <button
                type="button"
                onClick={() => removePrice(i)}
                className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/20 text-xs leading-none"
                aria-label="削除"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {PRICE_OPTIONS.map((price) => (
          <button
            key={price}
            type="button"
            onClick={() => addPrice(price)}
            className="py-1.5 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent active:scale-95 transition-transform"
          >
            {price}
          </button>
        ))}
      </div>
    </div>
  );
}
