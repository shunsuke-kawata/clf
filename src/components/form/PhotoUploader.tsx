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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    const newCount = count + 1;
    setCount(newCount);
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
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="min-h-[44px]"
      >
        {uploading ? "アップロード中..." : count > 0 ? "さらに写真を追加" : "写真を追加"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
