import type { Locker } from "@/features/locker/schemas/locker";

export type LockerGroup = {
  lat: number;
  lng: number;
  lockers: Locker[];
};

export function groupLockersByCoord(lockers: Locker[]): LockerGroup[] {
  const map = new Map<string, Locker[]>();
  for (const locker of lockers) {
    const key = `${locker.lat.toFixed(5)},${locker.lng.toFixed(5)}`;
    const group = map.get(key);
    if (group) {
      group.push(locker);
    } else {
      map.set(key, [locker]);
    }
  }
  return Array.from(map.values()).map((group) => ({
    lat: group[0].lat,
    lng: group[0].lng,
    lockers: group,
  }));
}
