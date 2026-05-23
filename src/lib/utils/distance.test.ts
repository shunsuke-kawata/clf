import { describe, it, expect } from "vitest";
import { haversineDistance, formatDistance } from "./distance";

describe("haversineDistance", () => {
  it("同じ地点は0mを返す", () => {
    expect(haversineDistance(35.6812, 139.7671, 35.6812, 139.7671)).toBe(0);
  });

  it("東京〜横浜間は約26kmを返す", () => {
    const dist = haversineDistance(35.6895, 139.6917, 35.4437, 139.638);
    expect(dist).toBeGreaterThan(25_000);
    expect(dist).toBeLessThan(28_000);
  });

  it("近隣2点の距離を正しく計算する", () => {
    // 約111m差（緯度0.001度 ≒ 111m）
    const dist = haversineDistance(35.0, 139.0, 35.001, 139.0);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });
});

describe("formatDistance", () => {
  it("1000m未満はm表記", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(500)).toBe("500m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("1000m以上はkm表記（小数1桁）", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1500)).toBe("1.5km");
    expect(formatDistance(26000)).toBe("26.0km");
  });
});
