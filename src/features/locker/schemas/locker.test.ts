/**
 * lockerSchema のバリデーションテスト
 *
 * フォーム送信・API リクエストの両方がこのスキーマを通過するため、
 * 境界値と型違反を網羅して入力ガードの正確さを保証する。
 */

import { describe, it, expect } from "vitest";
import { lockerSchema } from "./locker";

describe("lockerSchema", () => {
  describe("正常系", () => {
    it("lat・lng・pricing の最小セットを受け入れる", () => {
      // note はオプショナルなので省略可能
      const result = lockerSchema.safeParse({
        lat: 35.6812,
        lng: 139.7671,
        pricing: [300],
      });
      expect(result.success).toBe(true);
    });

    it("note を含む完全なオブジェクトを受け入れる", () => {
      const result = lockerSchema.safeParse({
        lat: 35.6812,
        lng: 139.7671,
        note: "B1 左の列",
        pricing: [200, 300, 500],
      });
      expect(result.success).toBe(true);
    });

    it("pricing が空配列でも受け入れる", () => {
      // 料金未設定のロッカーも登録できる
      const result = lockerSchema.safeParse({ lat: 0, lng: 0, pricing: [] });
      expect(result.success).toBe(true);
    });

    it("lat・lng が 0（赤道・本初子午線の交点）でも受け入れる", () => {
      // 0 は falsy だが有効な数値として扱われることを確認
      const result = lockerSchema.safeParse({ lat: 0, lng: 0, pricing: [] });
      expect(result.success).toBe(true);
    });

    it("lat・lng が負の数でも受け入れる（南緯・西経）", () => {
      const result = lockerSchema.safeParse({
        lat: -33.8688,
        lng: -70.6693,
        pricing: [100],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("異常系 - 必須フィールド欠落", () => {
    it("lat が欠けている場合は失敗する", () => {
      const result = lockerSchema.safeParse({ lng: 139.7671, pricing: [300] });
      expect(result.success).toBe(false);
    });

    it("lng が欠けている場合は失敗する", () => {
      const result = lockerSchema.safeParse({ lat: 35.6812, pricing: [300] });
      expect(result.success).toBe(false);
    });

    it("pricing が欠けている場合は失敗する", () => {
      const result = lockerSchema.safeParse({ lat: 35.6812, lng: 139.7671 });
      expect(result.success).toBe(false);
    });
  });

  describe("異常系 - 型違反", () => {
    it("lat が文字列の場合は失敗する", () => {
      const result = lockerSchema.safeParse({
        lat: "35.6812",
        lng: 139.7671,
        pricing: [300],
      });
      expect(result.success).toBe(false);
    });

    it("pricing に負の数が含まれる場合は失敗する（positive のみ許可）", () => {
      const result = lockerSchema.safeParse({
        lat: 35.0,
        lng: 135.0,
        pricing: [-100],
      });
      expect(result.success).toBe(false);
    });

    it("pricing に 0 が含まれる場合は失敗する（positive のみ許可）", () => {
      // 0 は positive ではないため拒否される
      const result = lockerSchema.safeParse({
        lat: 35.0,
        lng: 135.0,
        pricing: [0],
      });
      expect(result.success).toBe(false);
    });

    it("pricing に小数が含まれる場合は失敗する（int のみ許可）", () => {
      const result = lockerSchema.safeParse({
        lat: 35.0,
        lng: 135.0,
        pricing: [300.5],
      });
      expect(result.success).toBe(false);
    });

    it("pricing が配列でない場合は失敗する", () => {
      const result = lockerSchema.safeParse({
        lat: 35.0,
        lng: 135.0,
        pricing: 300,
      });
      expect(result.success).toBe(false);
    });
  });
});
