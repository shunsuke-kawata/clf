"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type UploadedPhoto = {
  id: string;
  storage_key: string;
  order_index: number;
};

type Props = {
  lockerId: string;
  onUpload: (photo: UploadedPhoto) => void;
};

export function PhotoUploader({ lockerId, onUpload }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("locker_id", lockerId);
    form.append("order_index", String(count));

    const res = await fetch("/api/photos", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      setError("アップロードに失敗しました");
      return;
    }

    const photo: UploadedPhoto = await res.json();
    setCount((c) => c + 1);
    onUpload(photo);

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">写真</label>
        {count > 0 && (
          <span className="text-xs text-muted-foreground">{count}枚追加済み</span>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleChange(e, cameraRef)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleChange(e, galleryRef)}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex-1 min-h-[44px]"
        >
          {uploading ? "アップロード中..." : "カメラで撮影"}
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

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
