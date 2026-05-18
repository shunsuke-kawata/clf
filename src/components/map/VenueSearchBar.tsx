"use client";

import { useState } from "react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export function VenueSearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");
    setLoading(true);

    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(query.trim())}`
    );
    setLoading(false);

    if (!res.ok) {
      setError("検索に失敗しました");
      return;
    }

    const results: NominatimResult[] = await res.json();
    if (results.length === 0) {
      setError("場所が見つかりませんでした");
      return;
    }

    const { lat, lon } = results[0];
    map.flyTo([parseFloat(lat), parseFloat(lon)], 16, { duration: 1.5 });
  }

  return (
    <form
      onSubmit={handleSearch}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 w-[calc(100%-2rem)] max-w-sm"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setError("");
        }}
        placeholder="会場名・駅名で検索"
        className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm shadow-md outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
      />
      <Button type="submit" disabled={loading} className="min-h-[44px] shadow-md">
        {loading ? "..." : "検索"}
      </Button>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-destructive bg-background px-2 py-1 rounded shadow">
          {error}
        </p>
      )}
    </form>
  );
}
