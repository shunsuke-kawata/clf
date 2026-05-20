"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { lockerSchema, type LockerInput, type Locker } from "@/lib/schemas/locker";
import { PricingEditor } from "./PricingEditor";
import { PhotoUploader, type PhotoUploaderHandle } from "./PhotoUploader";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
      <p className="text-sm text-muted-foreground">地図を読み込み中...</p>
    </div>
  ),
});

type LocationMode = "pin" | "spot";
type GeoState = "idle" | "loading" | "ok" | "error";

type Props = {
  defaultValues?: Partial<LockerInput>;
  lockerId?: string;
  mode: "create" | "edit";
};

export function LockerForm({ defaultValues, lockerId, mode }: Props) {
  const router = useRouter();
  const [savedId, setSavedId] = useState<string | null>(lockerId ?? null);
  const [photoStep, setPhotoStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>(mode === "create" ? "spot" : "pin");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoError, setGeoError] = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const photoRef = useRef<PhotoUploaderHandle>(null);
  const [photoState, setPhotoState] = useState({ pendingCount: 0, uploading: false });

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

  useEffect(() => {
    // useStateの初期値はルーターキャッシュで保持されるため、
    // マウントのたびにkeyを更新してMapPickerを強制リマウントする
    setMapKey(Date.now());
    if (mode === "create") fetchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCurrentLocation() {
    setGeoState("loading");
    setGeoError("");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      setValue("lat", latitude, { shouldValidate: true });
      setValue("lng", longitude, { shouldValidate: true });
      setFlyTarget({ lat: latitude, lng: longitude });
      setGeoState("ok");
    } catch {
      setGeoError("現在地を取得できませんでした。位置情報の許可を確認してください。");
      setGeoState("error");
    }
  }

  function handleLocationModeChange(next: LocationMode) {
    setLocationMode(next);
    if (next === "spot") {
      fetchCurrentLocation();
    } else {
      setGeoState("idle");
      setGeoError("");
    }
  }

  async function onSubmit(data: LockerInput) {
    setServerError("");

    if (mode === "create") {
      // 作成モードでは保存はせず、photoStep に遷移してアップロード/スキップ時に保存する
      setPhotoStep(true);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/lockers/${lockerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      logger.error("[LockerForm] update failed", { id: lockerId, status: res.status });
      setServerError("保存に失敗しました");
      return;
    }

    const saved: Locker = await res.json();
    router.push(`/lockers/${saved.id}`);
  }

  async function finalizeCreate(withPhotos: boolean) {
    setServerError("");
    setSubmitting(true);

    // ロッカー未作成なら作成（リトライ時の重複作成を防ぐため savedId を確認）
    let targetId = savedId;
    if (!targetId) {
      const data = methods.getValues();
      const res = await fetch("/api/lockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        logger.error("[LockerForm] create failed", { status: res.status });
        toast.error("登録に失敗しました");
        setServerError("保存に失敗しました");
        setSubmitting(false);
        return;
      }
      const saved: Locker = await res.json();
      targetId = saved.id;
      setSavedId(saved.id);
    }

    if (withPhotos) {
      const ok = await photoRef.current?.upload(targetId);
      if (!ok) {
        // ロッカーは保存済み。ユーザーがリトライ可能な状態にとどめる
        logger.warn("[LockerForm] photo upload failed, locker saved", { id: targetId });
        setSubmitting(false);
        return;
      }
    }

    toast.success("コインロッカーを登録しました");
    router.push("/");
  }

  async function handleDelete() {
    if (!lockerId) return;
    if (!confirm("削除しますか？")) return;

    const res = await fetch(`/api/lockers/${lockerId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      logger.error("[LockerForm] delete failed", { id: lockerId, status: res.status });
      setServerError("削除に失敗しました");
    }
  }

  if (photoStep) {
    const busy = photoState.uploading || submitting;
    return (
      <div className="flex flex-col h-[calc(100dvh-3.5rem)] w-full max-w-lg mx-auto">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 px-4 py-5">
          <div className="rounded-lg bg-muted p-4 text-sm text-center">
            写真を追加できます（任意）。アップロードまたはスキップで保存します。
          </div>
          <PhotoUploader
            ref={photoRef}
            lockerId={savedId ?? undefined}
            controlled
            onChange={setPhotoState}
          />
          {serverError && (
            <p className="text-sm text-destructive text-center">{serverError}</p>
          )}
        </div>
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-6 px-4 flex flex-col gap-3">
          {photoState.pendingCount > 0 && (
            <Button
              type="button"
              onClick={() => finalizeCreate(true)}
              disabled={busy}
              className="min-h-[44px] w-full"
            >
              {busy
                ? "保存中..."
                : `${photoState.pendingCount}枚をアップロード`}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => finalizeCreate(false)}
            disabled={busy}
            className="min-h-[44px] w-full"
          >
            {busy && photoState.pendingCount === 0 ? "保存中..." : "スキップ"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col h-[calc(100dvh-3.5rem)] w-full max-w-lg mx-auto"
      >
        {/* 地図セクション（固定） */}
        <div className="flex-shrink-0 px-4 pt-4 flex flex-col gap-2">
          {mode === "create" && (
            <div className="flex w-full rounded-lg border border-border overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => handleLocationModeChange("pin")}
                className={`flex-1 py-2.5 font-medium transition-colors ${
                  locationMode === "pin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                地図から登録
              </button>
              <button
                type="button"
                onClick={() => handleLocationModeChange("spot")}
                className={`flex-1 py-2.5 font-medium transition-colors ${
                  locationMode === "spot"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                現在地を登録
              </button>
            </div>
          )}

          <div className="relative h-48 w-full">
            {mapKey === 0 ? (
              <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground">地図を読み込み中...</p>
              </div>
            ) : (
              <MapPicker
                key={mapKey}
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setValue("lat", newLat, { shouldValidate: true });
                  setValue("lng", newLng, { shouldValidate: true });
                }}
                flyTarget={locationMode === "spot" ? flyTarget : null}
              />
            )}
            {locationMode === "spot" && geoState === "loading" && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-[400]">
                <p className="text-sm text-muted-foreground">現在地を取得中...</p>
              </div>
            )}
          </div>

          <p className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            {locationMode === "pin" || mode === "edit" ? (
              <>地図をタップして場所を指定 — {lat.toFixed(5)}, {lng.toFixed(5)}</>
            ) : geoState === "ok" ? (
              <>
                <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                <button type="button" onClick={fetchCurrentLocation} className="text-primary underline">再取得</button>
              </>
            ) : geoState === "error" ? (
              <>
                <span className="text-destructive">{geoError}</span>
                <button type="button" onClick={fetchCurrentLocation} className="text-primary underline">再試行</button>
              </>
            ) : null}
          </p>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-5 px-4 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">場所の名称</label>
              <input
                {...register("name")}
                placeholder="例: 渋谷駅東口コインロッカー"
                className="rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <PricingEditor />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">メモ</label>
              <textarea
                {...register("note")}
                placeholder="混雑状況・アクセスメモなど"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {mode === "edit" && savedId && (
              <PhotoUploader lockerId={savedId} onUpload={() => {}} />
            )}

            {serverError && (
              <p className="text-sm text-destructive text-center">{serverError}</p>
            )}
          </div>
        </div>

        {/* ボタン（固定） */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-6 px-4 flex flex-col gap-3">
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
