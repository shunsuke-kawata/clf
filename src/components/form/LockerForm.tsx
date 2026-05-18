"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { lockerSchema, type LockerInput, type Locker } from "@/lib/schemas/locker";
import { PricingEditor } from "./PricingEditor";
import { PhotoUploader } from "./PhotoUploader";
import { Button } from "@/components/ui/button";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
      <p className="text-sm text-muted-foreground">地図を読み込み中...</p>
    </div>
  ),
});

type Props = {
  defaultValues?: Partial<LockerInput>;
  lockerId?: string;
  mode: "create" | "edit";
};

export function LockerForm({ defaultValues, lockerId, mode }: Props) {
  const router = useRouter();
  const [savedId, setSavedId] = useState<string | null>(lockerId ?? null);
  const [photoStep, setPhotoStep] = useState(false); // 新規作成後の写真アップロードステップ
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<LockerInput>({
    resolver: zodResolver(lockerSchema),
    defaultValues: {
      name: "",
      lat: 35.6812,
      lng: 139.7671,
      note: "",
      pricing: [],
      ...defaultValues,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = methods;
  const lat = watch("lat");
  const lng = watch("lng");

  async function onSubmit(data: LockerInput) {
    setServerError("");
    setSubmitting(true);

    const url = mode === "create" ? "/api/lockers" : `/api/lockers/${lockerId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSubmitting(false);

    if (!res.ok) {
      setServerError("保存に失敗しました");
      return;
    }

    const saved: Locker = await res.json();

    if (mode === "create") {
      // 新規作成後は写真アップロードステップへ
      setSavedId(saved.id);
      setPhotoStep(true);
    } else {
      router.push(`/lockers/${saved.id}`);
    }
  }

  async function handleDelete() {
    if (!lockerId) return;
    if (!confirm("削除しますか？")) return;

    const res = await fetch(`/api/lockers/${lockerId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      setServerError("削除に失敗しました");
    }
  }

  // 新規作成後の写真アップロードステップ
  if (photoStep && savedId) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg bg-muted p-4 text-sm text-center">
          ロッカーを保存しました。写真を追加できます（任意）。
        </div>
        <PhotoUploader lockerId={savedId} onUpload={() => {}} />
        <Button
          onClick={() => router.push(`/lockers/${savedId}`)}
          className="min-h-[44px]"
        >
          完了
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">場所の名称 *</label>
          <input
            {...register("name")}
            placeholder="例: 渋谷駅東口コインロッカー"
            className="rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">場所を地図でタップ *</label>
          <p className="text-xs text-muted-foreground">
            現在: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
          <MapPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setValue("lat", newLat, { shouldValidate: true });
              setValue("lng", newLng, { shouldValidate: true });
            }}
          />
        </div>

        <PricingEditor />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">メモ</label>
          <textarea
            {...register("note")}
            placeholder="混雑状況・アクセスメモなど"
            rows={3}
            className="rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {mode === "edit" && savedId && (
          <PhotoUploader lockerId={savedId} onUpload={() => {}} />
        )}

        {serverError && (
          <p className="text-sm text-destructive text-center">{serverError}</p>
        )}

        <div className="flex flex-col gap-3 pb-6">
          <Button type="submit" disabled={submitting} className="min-h-[44px]">
            {submitting ? "保存中..." : mode === "create" ? "次へ（写真を追加）" : "更新する"}
          </Button>

          {mode === "edit" && lockerId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="min-h-[44px]"
            >
              削除する
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="min-h-[44px]"
          >
            キャンセル
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
