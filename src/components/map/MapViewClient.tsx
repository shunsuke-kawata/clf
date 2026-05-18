"use client";

import dynamic from "next/dynamic";
import type { Locker } from "@/lib/schemas/locker";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-dvh w-full flex items-center justify-center bg-muted">
      <p className="text-muted-foreground text-sm">地図を読み込み中...</p>
    </div>
  ),
});

type Props = {
  lockers: Locker[];
};

export function MapViewClient({ lockers }: Props) {
  return <MapView lockers={lockers} />;
}
