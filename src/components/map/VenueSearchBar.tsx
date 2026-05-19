"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import L from "leaflet";

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type Props = {
  onResult: (lat: number, lng: number, name: string) => void;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
  );
}

export function VenueSearchBar({ onResult }: Props) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return;
      const data: SearchResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  function commit(result: SearchResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 16, { duration: 1.5 });
    onResult(lat, lng, result.display_name);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setError("");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");

    let results = suggestions;
    if (results.length === 0) {
      setLoading(true);
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      setLoading(false);
      if (!res.ok) {
        setError("検索に失敗しました");
        return;
      }
      results = await res.json();
    }

    if (results.length === 0) {
      setError("場所が見つかりませんでした");
      return;
    }

    if (results.length === 1) {
      commit(results[0]);
      return;
    }

    // 複数ヒット時: 現在地から最も近い結果へジャンプ
    try {
      const pos = await getCurrentPosition();
      const { latitude: uLat, longitude: uLng } = pos.coords;
      const nearest = results.reduce((best, r) => {
        const d = (parseFloat(r.lat) - uLat) ** 2 + (parseFloat(r.lon) - uLng) ** 2;
        const bd = (parseFloat(best.lat) - uLat) ** 2 + (parseFloat(best.lon) - uLng) ** 2;
        return d < bd ? r : best;
      });
      commit(nearest);
    } catch {
      // 位置情報拒否の場合は先頭結果を使用
      commit(results[0]);
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm"
    >
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="会場名・駅名で検索"
          className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm shadow-md outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          autoComplete="off"
        />
        <Button type="submit" disabled={loading} className="min-h-[44px] shadow-md">
          {loading ? "..." : "検索"}
        </Button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="mt-1 rounded-md border border-border bg-background shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent"
                onClick={() => commit(s)}
              >
                <span className="block truncate">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-xs text-destructive bg-background px-2 py-1 rounded shadow">
          {error}
        </p>
      )}
    </div>
  );
}
