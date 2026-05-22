/**
 * getPhotoUrl のユニットテスト
 *
 * 外部依存がない純粋関数のため、URL 組み立てのロジックを直接検証する。
 * バケット名 "locker-photos" がハードコードされているため、
 * それが変更された場合にテストが失敗してリグレッションを検知できる。
 */

import { describe, it, expect } from "vitest";
import { getPhotoUrl } from "./photo";

describe("getPhotoUrl", () => {
  it("supabaseUrl と storageKey から正しい公開 URL を組み立てる", () => {
    const url = getPhotoUrl("https://abc.supabase.co", "lockers/uuid-1/photo.jpg");
    expect(url).toBe(
      "https://abc.supabase.co/storage/v1/object/public/locker-photos/lockers/uuid-1/photo.jpg"
    );
  });

  it("storageKey にパス区切りがなくてもそのまま結合する", () => {
    const url = getPhotoUrl("https://abc.supabase.co", "photo.jpg");
    expect(url).toBe(
      "https://abc.supabase.co/storage/v1/object/public/locker-photos/photo.jpg"
    );
  });

  it("バケット名 'locker-photos' が URL に含まれる", () => {
    // バケット名変更時のリグレッション検知
    const url = getPhotoUrl("https://example.supabase.co", "key");
    expect(url).toContain("locker-photos");
  });

  it("supabaseUrl 末尾のスラッシュがない前提で正しく結合する", () => {
    // URL の二重スラッシュが入らないことを確認
    const url = getPhotoUrl("https://abc.supabase.co", "key");
    expect(url).not.toContain("//storage");
  });
});
