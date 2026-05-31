"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { X, Clock } from "lucide-react";
import { logger } from "@/lib/logger";
import { API_ROUTES } from "@/lib/routes";
import { APP_CONFIG } from "@/lib/config";
import { requestGeolocation } from "@/lib/utils/geolocation";

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type HistoryItem = {
  id: string;
  query: string;
  lat: number | null;
  lng: number | null;
  display_name: string | null;
  searched_at: string;
};

type Props = {
  onResult: (lat: number, lng: number, name: string) => void;
  onClear?: () => void;
};


export function VenueSearchBar({ onResult, onClear }: Props) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isCommitted, setIsCommitted] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  useEffect(() => {
    if (isCommitted) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(API_ROUTES.geocode.search(query.trim()));
      if (!res.ok) {
        logger.warn("[VenueSearchBar] suggest failed", { status: res.status });
        return;
      }
      const data: SearchResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      if (data.length > 0) setHistoryOpen(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, isCommitted]);

  async function fetchHistory() {
    const res = await fetch(API_ROUTES.searchHistory.list);
    if (!res.ok) {
      logger.warn("[VenueSearchBar] history fetch failed", { status: res.status });
      return;
    }
    const data: HistoryItem[] = await res.json();
    setHistory(data);
    if (data.length > 0) setHistoryOpen(true);
  }

  function commit(result: SearchResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const shortName = result.display_name.split(",")[0].trim();
    map.flyTo([lat, lng], 16, { duration: 1.5 });
    onResult(lat, lng, result.display_name);
    setQuery(shortName);
    setIsCommitted(true);
    setSuggestions([]);
    setOpen(false);
    setHistoryOpen(false);
    setError("");

    fetch(API_ROUTES.searchHistory.upsert, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: shortName, lat, lng, display_name: result.display_name }),
    }).catch((e) => logger.error("[VenueSearchBar] history upsert failed", e));
  }

  function commitFromHistory(item: HistoryItem) {
    setHistoryOpen(false);
    setError("");
    if (item.lat !== null && item.lng !== null) {
      const displayName = item.display_name ?? item.query;
      map.flyTo([item.lat, item.lng], 16, { duration: 1.5 });
      onResult(item.lat, item.lng, displayName);
      setQuery(item.query);
      setIsCommitted(true);
      setSuggestions([]);
      setOpen(false);
    } else {
      setError("場所の情報が不足しています");
    }
  }

  async function deleteHistory(id: string) {
    const res = await fetch(API_ROUTES.searchHistory.delete(id), { method: "DELETE" });
    if (!res.ok) {
      logger.warn("[VenueSearchBar] history delete failed", { status: res.status });
      return;
    }
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  function handleClear() {
    setQuery("");
    setIsCommitted(false);
    setSuggestions([]);
    setOpen(false);
    setHistoryOpen(false);
    setError("");
    onClear?.();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");
    setHistoryOpen(false);

    let results = suggestions;
    if (results.length === 0) {
      setLoading(true);
      const res = await fetch(API_ROUTES.geocode.search(query.trim()));
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
    const pos = await requestGeolocation();
    if (pos) {
      const { latitude: uLat, longitude: uLng } = pos.coords;
      const nearest = results.reduce((best, r) => {
        const d = (parseFloat(r.lat) - uLat) ** 2 + (parseFloat(r.lon) - uLng) ** 2;
        const bd = (parseFloat(best.lat) - uLat) ** 2 + (parseFloat(best.lon) - uLng) ** 2;
        return d < bd ? r : best;
      });
      commit(nearest);
    } else {
      commit(results[0]);
    }
  }

  const showHistory = historyOpen && !open && history.length > 0 && !isCommitted;

  return (
    <div ref={containerRef} className="absolute top-3 right-4 left-4 z-[1000]">
      <form onSubmit={handleSearch}>
        <div className="flex h-[52px] items-center gap-2 rounded-full bg-white px-4 shadow-lg">
          <svg
            className="h-5 w-5 shrink-0 text-gray-400"
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
              setIsCommitted(false);
              setError("");
              if (e.target.value.trim().length === 0) {
                setHistoryOpen(history.length > 0);
              }
            }}
            onFocus={() => {
              if (!isCommitted && suggestions.length > 0) {
                setOpen(true);
              } else if (!isCommitted && query.trim().length === 0) {
                fetchHistory();
              }
            }}
            placeholder="会場名・駅名で検索"
            className="min-w-0 flex-1 bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400"
            autoComplete="off"
          />
          {isCommitted ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="検索をクリア"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          ) : loading ? (
            <span className="shrink-0 text-xs text-gray-400">…</span>
          ) : (
            <button
              type="submit"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-sm font-medium text-blue-500"
            >
              検索
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="z-[1001] mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-2xl bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
                onClick={() => commit(s)}
              >
                <svg
                  className="h-4 w-4 shrink-0 text-gray-400"
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

      {showHistory && (
        <ul className="mt-2 mr-16 max-h-60 overflow-hidden overflow-y-auto rounded-2xl bg-white shadow-lg">
          {history.map((h) => (
            <li key={h.id} className="flex items-center">
              <button
                type="button"
                className="flex flex-1 items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
                onClick={() => commitFromHistory(h)}
              >
                <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="block truncate text-gray-700">{h.query}</span>
              </button>
              <button
                type="button"
                aria-label="履歴を削除"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-gray-400 hover:text-gray-600"
                onClick={() => deleteHistory(h.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 rounded-xl bg-white px-4 py-2 text-xs text-red-500 shadow">{error}</p>
      )}
    </div>
  );
}
