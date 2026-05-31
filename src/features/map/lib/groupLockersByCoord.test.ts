import { describe, it, expect } from "vitest";
import { groupLockersByCoord } from "./groupLockersByCoord";
import type { Locker } from "@/features/locker/schemas/locker";

function makeLocker(id: string, lat: number, lng: number): Locker {
  return {
    id,
    name: `locker-${id}`,
    lat,
    lng,
    note: null,
    pricing: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("groupLockersByCoord", () => {
  it("空配列は空配列を返す", () => {
    expect(groupLockersByCoord([])).toEqual([]);
  });

  it("異なる座標のロッカーはそれぞれ別グループになる", () => {
    const lockers = [makeLocker("a", 35.0, 139.0), makeLocker("b", 35.1, 139.1)];
    const groups = groupLockersByCoord(lockers);
    expect(groups).toHaveLength(2);
    expect(groups[0].lockers).toHaveLength(1);
    expect(groups[1].lockers).toHaveLength(1);
  });

  it("完全一致の座標は同じグループにまとめられる", () => {
    const lockers = [
      makeLocker("a", 35.0, 139.0),
      makeLocker("b", 35.0, 139.0),
      makeLocker("c", 35.0, 139.0),
    ];
    const groups = groupLockersByCoord(lockers);
    expect(groups).toHaveLength(1);
    expect(groups[0].lockers).toHaveLength(3);
  });

  it("小数点6桁目以降のみ異なる座標は同じグループにまとめられる（約1cm差）", () => {
    // toFixed(5) で丸めが発生しない範囲（6桁目が1〜4）で同一グループになることを確認
    const lockers = [
      makeLocker("a", 35.123451, 139.123451),
      makeLocker("b", 35.123452, 139.123452),
      makeLocker("c", 35.123453, 139.123453),
    ];
    const groups = groupLockersByCoord(lockers);
    expect(groups).toHaveLength(1);
    expect(groups[0].lockers).toHaveLength(3);
  });

  it("小数点5桁目が異なる座標は別グループになる（約11cm差）", () => {
    const lockers = [
      makeLocker("a", 35.12345, 139.12345),
      makeLocker("b", 35.12346, 139.12346),
    ];
    const groups = groupLockersByCoord(lockers);
    expect(groups).toHaveLength(2);
  });

  it("一部が近接・一部が離れた混在ケース", () => {
    const lockers = [
      makeLocker("a", 35.123451, 139.123451),
      makeLocker("b", 35.123453, 139.123453),
      makeLocker("c", 36.0, 140.0),
    ];
    const groups = groupLockersByCoord(lockers);
    expect(groups).toHaveLength(2);
    const stacked = groups.find((g) => Math.abs(g.lat - 35.12345) < 0.001);
    const single = groups.find((g) => g.lat === 36.0);
    expect(stacked?.lockers).toHaveLength(2);
    expect(single?.lockers).toHaveLength(1);
  });

  it("グループのlat/lngはグループ内最初のロッカーの座標と一致する", () => {
    const lockers = [makeLocker("a", 35.123456, 139.654321)];
    const groups = groupLockersByCoord(lockers);
    expect(groups[0].lat).toBe(35.123456);
    expect(groups[0].lng).toBe(139.654321);
  });
});
