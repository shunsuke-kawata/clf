import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConfig = {
  isProd: false,
  photo: { bucket: "locker-photos" },
};

vi.mock("@/lib/config", () => ({ APP_CONFIG: mockConfig }));

const { getPhotoUrl } = await import("./photo");

describe("getPhotoUrl", () => {
  describe("開発環境（isProd=false）", () => {
    beforeEach(() => { mockConfig.isProd = false; });

    it("プロキシURL /api/photos/proxy?key=... を返す", () => {
      const url = getPhotoUrl("http://127.0.0.1:54321", "lockers/uuid-1/photo.jpg");
      expect(url).toBe("/api/photos/proxy?key=lockers%2Fuuid-1%2Fphoto.jpg");
    });

    it("storageKey にパス区切りがない場合もエンコードして返す", () => {
      const url = getPhotoUrl("http://127.0.0.1:54321", "photo.jpg");
      expect(url).toBe("/api/photos/proxy?key=photo.jpg");
    });

    it("supabaseUrl を使わずプロキシURLを返す", () => {
      const url = getPhotoUrl("http://127.0.0.1:54321", "key");
      expect(url).not.toContain("127.0.0.1");
    });
  });

  describe("本番環境（isProd=true）", () => {
    beforeEach(() => { mockConfig.isProd = true; });

    it("Supabase Storage の直リンクを返す", () => {
      const url = getPhotoUrl("https://abc.supabase.co", "lockers/uuid-1/photo.jpg");
      expect(url).toBe(
        "https://abc.supabase.co/storage/v1/object/public/locker-photos/lockers/uuid-1/photo.jpg"
      );
    });

    it("バケット名 'locker-photos' が URL に含まれる", () => {
      const url = getPhotoUrl("https://example.supabase.co", "key");
      expect(url).toContain("locker-photos");
    });

    it("supabaseUrl 末尾のスラッシュがない前提で二重スラッシュが入らない", () => {
      const url = getPhotoUrl("https://abc.supabase.co", "key");
      expect(url).not.toContain("//storage");
    });
  });
});
