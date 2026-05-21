"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type UploadedPhoto = {
  id: string;
  storage_key: string;
  order_index: number;
};

export type PhotoUploaderHandle = {
  upload: (overrideLockerId?: string) => Promise<boolean>;
};

type Props = {
  /** 編集モードでは必須。作成モードでは upload(lockerId) で外部から指定する */
  lockerId?: string;
  onUpload?: (photo: UploadedPhoto) => void;
  onComplete?: () => void;
  /** true なら内蔵アップロードボタンを表示せず、ref 経由で親が制御する */
  controlled?: boolean;
  onChange?: (state: { pendingCount: number; uploading: boolean }) => void;
};

export const PhotoUploader = forwardRef<PhotoUploaderHandle, Props>(
  function PhotoUploader(
    { lockerId, onUpload, onComplete, controlled = false, onChange },
    ref
  ) {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [pending, setPending] = useState<PendingPhoto[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [orderOffset, setOrderOffset] = useState(0);

    useEffect(() => {
      onChange?.({ pendingCount: pending.length, uploading });
    }, [pending.length, uploading, onChange]);

    async function compressImage(file: File): Promise<File> {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          try {
            URL.revokeObjectURL(url);
            const MAX = 1920;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) {
                height = Math.round((height * MAX) / width);
                width = MAX;
              } else {
                width = Math.round((width * MAX) / height);
                height = MAX;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              logger.warn("[PhotoUploader] canvas context unavailable, skipping compression", { name: file.name });
              resolve(file);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  logger.warn("[PhotoUploader] toBlob returned null, using original file", { name: file.name });
                  resolve(file);
                  return;
                }
                resolve(
                  new File(
                    [blob],
                    file.name.replace(/\.[^.]+$/, ".jpg"),
                    { type: "image/jpeg" }
                  )
                );
              },
              "image/jpeg",
              0.85
            );
          } catch (e) {
            logger.error("[PhotoUploader] compression failed", e);
            resolve(file);
          }
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          logger.warn("[PhotoUploader] failed to load image for compression", { name: file.name, type: file.type, error: e });
          resolve(file);
        };
        img.src = url;
      });
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const newPending: PendingPhoto[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPending((prev) => [...prev, ...newPending]);
      e.target.value = "";
    }

    function removePending(id: string, index: number) {
      setPending((prev) => {
        const photo = prev.find((p) => p.id === id);
        if (photo) URL.revokeObjectURL(photo.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
      setCurrentIndex((i) => {
        const next = Math.max(0, i >= index ? i - 1 : i);
        return next;
      });
    }

    async function upload(overrideLockerId?: string): Promise<boolean> {
      if (pending.length === 0) return true;
      const targetLockerId = overrideLockerId ?? lockerId;
      if (!targetLockerId) {
        setError("ロッカーIDが未設定です");
        return false;
      }
      setError("");
      setUploading(true);

      let order = orderOffset;
      for (const p of pending) {
        let compressed: File;
        try {
          compressed = await compressImage(p.file);
        } catch (e) {
          logger.error("[PhotoUploader] compressImage threw unexpectedly", e);
          compressed = p.file;
        }
        const form = new FormData();
        form.append("file", compressed);
        form.append("locker_id", targetLockerId);
        form.append("order_index", String(order++));

        const res = await fetch("/api/photos", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = (await res
            .json()
            .catch(() => ({}))) as { error?: string };
          logger.error("[PhotoUploader] upload failed", {
            status: res.status,
            error: body.error,
          });
          setError(body.error ?? "アップロードに失敗しました");
          setUploading(false);
          return false;
        }
        const photo: UploadedPhoto = await res.json();
        onUpload?.(photo);
      }

      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setOrderOffset(order);
      setPending([]);
      setCurrentIndex(0);
      setUploading(false);
      return true;
    }

    useImperativeHandle(
      ref,
      () => ({
        upload,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pending, uploading, orderOffset, lockerId]
    );

    function scrollToIndex(idx: number) {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ left: el.clientWidth * idx, behavior: "smooth" });
    }

    function goPrev() {
      const next = Math.max(0, currentIndex - 1);
      setCurrentIndex(next);
      scrollToIndex(next);
    }

    function goNext() {
      const next = Math.min(pending.length - 1, currentIndex + 1);
      setCurrentIndex(next);
      scrollToIndex(next);
    }

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
      const target = e.currentTarget;
      const idx = Math.round(target.scrollLeft / target.clientWidth);
      if (idx !== currentIndex) setCurrentIndex(idx);
    }

    return (
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">写真</label>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="flex-1 min-h-[44px]"
          >
            カメラで撮影
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
            className="flex-1 min-h-[44px]"
          >
            ライブラリから選択
          </Button>
        </div>

        {pending.length > 0 && (
          <div className="relative -mx-4 aspect-[4/3]">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {pending.map((p, i) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-full h-full snap-center relative bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.previewUrl}
                    alt={`プレビュー ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePending(p.id, i)}
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-base leading-none"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {pending.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-xl leading-none"
                    aria-label="前へ"
                  >
                    ‹
                  </button>
                )}
                {currentIndex < pending.length - 1 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-xl leading-none"
                    aria-label="次へ"
                  >
                    ›
                  </button>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {pending.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === currentIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {!controlled && pending.length > 0 && (
          <Button
            type="button"
            onClick={async () => {
              const ok = await upload();
              if (ok) onComplete?.();
            }}
            disabled={uploading}
            className="min-h-[44px]"
          >
            {uploading ? "アップロード中..." : `${pending.length}枚をアップロード`}
          </Button>
        )}
      </div>
    );
  }
);
