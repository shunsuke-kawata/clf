"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, type ReactNode } from "react";
import type { Locker } from "@/features/locker/schemas/locker";
import { logger } from "@/lib/logger";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-dvh w-full flex items-center justify-center bg-muted">
      <p className="text-muted-foreground text-sm">地図を読み込み中...</p>
    </div>
  ),
});

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="h-dvh w-full flex flex-col items-center justify-center gap-2 bg-muted p-6">
          <p className="text-destructive text-sm font-medium">地図の読み込みに失敗しました</p>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

type Props = {
  lockers: Locker[];
  supabaseUrl: string;
  flyTo?: { lat: number; lng: number } | null;
};

export function MapViewClient({ lockers, supabaseUrl, flyTo }: Props) {
  useEffect(() => {
    if (!navigator.geolocation) return;
    // dynamic import完了前に許可ダイアログを表示させる（timeoutなしでユーザーの応答を待つ）
    navigator.geolocation.getCurrentPosition(
      () => {},
      (err) => logger.warn("[MapViewClient] geolocation permission denied", err)
    );
  }, []);

  return (
    <MapErrorBoundary>
      <MapView lockers={lockers} supabaseUrl={supabaseUrl} flyTo={flyTo} />
    </MapErrorBoundary>
  );
}
