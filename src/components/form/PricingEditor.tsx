"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { LockerInput } from "@/lib/schemas/locker";

export function PricingEditor() {
  const { register, control, formState: { errors } } = useFormContext<LockerInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "pricing" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">料金</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ size: "", duration: "", price: 0 })}
          className="min-h-[44px]"
        >
          ＋ 追加
        </Button>
      </div>

      {fields.map((field, i) => (
        <div key={field.id} className="flex gap-2 items-start">
          <input
            {...register(`pricing.${i}.size`)}
            placeholder="サイズ (S/M/L)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          <input
            {...register(`pricing.${i}.duration`)}
            placeholder="時間 (1時間)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          <input
            {...register(`pricing.${i}.price`, { valueAsNumber: true })}
            type="number"
            placeholder="円"
            className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(i)}
            className="min-h-[44px] text-destructive"
          >
            削除
          </Button>
        </div>
      ))}

      {errors.pricing && (
        <p className="text-xs text-destructive">料金情報を正しく入力してください</p>
      )}
    </div>
  );
}
