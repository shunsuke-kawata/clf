"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { lockerSchema, type LockerInput, type Locker } from "@/features/locker/schemas/locker";
import { PricingEditor } from "./PricingEditor";
import { PhotoUploader, type PhotoUploaderHandle } from "./PhotoUploader";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { API_ROUTES, PAGE_ROUTES } from "@/lib/routes";
import { APP_CONFIG } from "@/lib/config";
import { usePreventIOSZoom } from "@/hooks/usePreventIOSZoom";

const MapPicker = dynamic(() => import("@/features/map/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-48 items-center justify-center rounded-lg">
      <p className="text-muted-foreground text-sm">地図を読み込み中...</p>
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
  usePreventIOSZoom();
  const [savedId, setSavedId] = useState<string | null>(lockerId ?? null);
  const [photoStep, setPhotoStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>(
    mode === "create" ? "spot" : "pin"
  );
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoError, setGeoError] = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const photoRef = useRef<PhotoUploaderHandle>(null);
  const [photoState, setPhotoState] = useState({ pendingCount: 0, uploading: false });

  const methods = useForm<LockerInput>({
    resolver: zodResolver(lockerSchema),
    defaultValues: {
      lat: APP_CONFIG.map.defaultCenter.lat,
      lng: APP_CONFIG.map.defaultCenter.lng,
      note: "",
      pricing: [],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;
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

    if (!window.isSecureContext) {
      logger.warn("[LockerForm] geolocation unavailable: insecure context");
      if (APP_CONFIG.isProd) {
        setGeoError("HTTPSでない接続では現在地を取得できません。地図から場所を指定してください。");
        setGeoState("error");
      } else {
        // ローカル開発のLAN HTTP接続ではブラウザがgeolocationをブロックするためピンモードへフォールバック
        setGeoState("idle");
      }
      setLocationMode("pin");
      return;
    }

    if (!navigator.geolocation) {
      logger.warn("[LockerForm] geolocation unavailable: API not supported");
      setGeoError("このブラウザは位置情報に対応していません。地図から場所を指定してください。");
      setGeoState("error");
      setLocationMode("pin");
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: APP_CONFIG.map.geolocationTimeout,
        })
      );
      const { latitude, longitude } = pos.coords;
      setValue("lat", latitude, { shouldValidate: true });
      setValue("lng", longitude, { shouldValidate: true });
      setFlyTarget({ lat: latitude, lng: longitude });
      setGeoState("ok");
    } catch (e) {
      logger.warn("[LockerForm] geolocation failed", e);
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
    try {
      const res = await fetch(API_ROUTES.lockers.update(lockerId!), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        logger.error("[LockerForm] update failed", {
          id: lockerId,
          status: res.status,
          error: body.error,
        });
        setServerError(body.error ?? "保存に失敗しました");
        return;
      }
      const saved: Locker = await res.json();
      router.push(`/lockers/${saved.id}`);
    } catch (e) {
      logger.error("[LockerForm] update threw", e);
      setServerError("保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function finalizeCreate(withPhotos: boolean) {
    setServerError("");
    setSubmitting(true);

    try {
      // ロッカー未作成なら作成（リトライ時の重複作成を防ぐため savedId を確認）
      let targetId = savedId;
      if (!targetId) {
        const data = methods.getValues();
        const res = await fetch(API_ROUTES.lockers.create, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          logger.error("[LockerForm] create failed", { status: res.status, error: body.error });
          toast.error("登録に失敗しました");
          setServerError(body.error ?? "保存に失敗しました");
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
          return;
        }
      }

      toast.success("コインロッカーを登録しました");
      const { lat, lng } = methods.getValues();
      router.push(`${PAGE_ROUTES.home}?lat=${lat}&lng=${lng}`);
    } catch (e) {
      logger.error("[LockerForm] finalizeCreate threw", e);
      setServerError("保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!lockerId) return;
    if (!confirm("削除しますか？")) return;

    try {
      const res = await fetch(API_ROUTES.lockers.delete(lockerId), { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        logger.error("[LockerForm] delete failed", {
          id: lockerId,
          status: res.status,
          error: body.error,
        });
        setServerError(body.error ?? "削除に失敗しました");
      }
    } catch (e) {
      logger.error("[LockerForm] delete threw", e);
      setServerError("削除に失敗しました");
    }
  }

  if (photoStep) {
    const busy = photoState.uploading || submitting;
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-lg flex-col">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5">
          <div className="bg-muted rounded-lg p-4 text-center text-sm">
            写真を追加できます（任意）。アップロードまたはスキップで保存します。
          </div>
          <PhotoUploader
            ref={photoRef}
            lockerId={savedId ?? undefined}
            controlled
            onChange={setPhotoState}
          />
          {serverError && <p className="text-destructive text-center text-sm">{serverError}</p>}
        </div>
        <div className="bg-background/95 sticky bottom-0 flex flex-col gap-3 border-t px-4 pt-4 pb-6 backdrop-blur-sm">
          {photoState.pendingCount > 0 && (
            <Button
              type="button"
              onClick={() => finalizeCreate(true)}
              disabled={busy}
              className="min-h-[44px] w-full"
            >
              {busy ? "保存中..." : `${photoState.pendingCount}枚をアップロード`}
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
        className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-lg flex-col"
      >
        {/* 地図セクション（固定） */}
        <div className="flex flex-shrink-0 flex-col gap-2 px-4 pt-2">
          {mode === "create" && (
            <div className="border-border flex w-full overflow-hidden rounded-lg border text-sm">
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

          <div className="relative h-64 w-full">
            {mapKey === 0 ? (
              <div className="bg-muted flex h-64 items-center justify-center rounded-lg">
                <p className="text-muted-foreground text-sm">地図を読み込み中...</p>
              </div>
            ) : (
              <MapPicker
                key={mapKey}
                lat={lat}
                lng={lng}
                onChange={
                  locationMode === "pin" || mode === "edit"
                    ? (newLat, newLng) => {
                        setValue("lat", newLat, { shouldValidate: true });
                        setValue("lng", newLng, { shouldValidate: true });
                      }
                    : undefined
                }
                flyTarget={locationMode === "spot" ? flyTarget : null}
              />
            )}
            {locationMode === "spot" && geoState === "loading" && (
              <div className="bg-background/70 absolute inset-0 z-[400] flex items-center justify-center rounded-lg backdrop-blur-sm">
                <p className="text-muted-foreground text-sm">現在地を取得中...</p>
              </div>
            )}
          </div>

          <p className="text-muted-foreground flex items-center justify-between pb-1 text-xs">
            {locationMode === "pin" || mode === "edit" ? (
              <>
                地図をタップして場所を指定 — {lat.toFixed(5)}, {lng.toFixed(5)}
              </>
            ) : geoState === "ok" ? (
              <>
                <span>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  className="text-primary underline"
                >
                  再取得
                </button>
              </>
            ) : geoState === "error" ? (
              <>
                <span className="text-destructive">{geoError}</span>
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  className="text-primary underline"
                >
                  再試行
                </button>
              </>
            ) : null}
          </p>
        </div>

        {/* コンテンツ（ページ自体がスクロールするため overflow-y-auto 不要） */}
        <div className="flex-1">
          <div className="flex flex-col gap-5 px-4 py-4">
            <PricingEditor />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">メモ</label>
              <textarea
                {...register("note")}
                placeholder="混雑状況・アクセスメモなど"
                rows={3}
                className="border-input bg-background focus:ring-ring w-full resize-none rounded-md border px-4 py-3 text-[16px] outline-none focus:ring-2"
              />
            </div>

            {mode === "edit" && savedId && <PhotoUploader lockerId={savedId} onUpload={() => {}} />}

            {serverError && <p className="text-destructive text-center text-sm">{serverError}</p>}
          </div>
        </div>

        {/* ボタン（ページスクロール時も画面下部に固定） */}
        <div className="bg-background/95 sticky bottom-0 flex flex-col gap-3 border-t px-4 pt-4 pb-6 backdrop-blur-sm">
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
