"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { Locker } from "@/features/locker/schemas/locker";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-dvh w-full items-center justify-center">
      <p className="text-muted-foreground text-sm">地図を読み込み中...</p>
    </div>
  ),
});

class MapErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
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
        <div className="bg-muted flex h-dvh w-full flex-col items-center justify-center gap-2 p-6">
          <p className="text-destructive text-sm font-medium">地図の読み込みに失敗しました</p>
          <pre className="text-muted-foreground text-xs break-all whitespace-pre-wrap">
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
  return (
    <MapErrorBoundary>
      <MapView lockers={lockers} supabaseUrl={supabaseUrl} flyTo={flyTo} />
    </MapErrorBoundary>
  );
}
