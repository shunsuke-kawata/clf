"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { logger } from "@/lib/logger";

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
      if (!res.ok) {
        logger.warn("[VenueSearchBar] suggest failed", { status: res.status });
        return;
      }
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
        logger.error("[VenueSearchBar] search failed", { status: res.status });
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
      className="absolute top-3 left-4 right-4 z-[1000]"
    >
      <form onSubmit={handleSearch}>
        <div className="flex items-center bg-white rounded-full shadow-lg h-[52px] px-4 gap-2">
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="会場名・駅名で検索"
            className="flex-1 bg-transparent text-base outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
            autoComplete="off"
          />
          {loading ? (
            <span className="text-gray-400 text-xs shrink-0">…</span>
          ) : (
            <button
              type="submit"
              className="text-blue-500 text-sm font-medium shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              検索
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="mt-2 rounded-2xl bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
                onClick={() => commit(s)}
              >
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="block truncate text-gray-700">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500 bg-white px-4 py-2 rounded-xl shadow">
          {error}
        </p>
      )}
    </div>
  );
}
