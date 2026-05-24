/**
 * Overpass API (OpenStreetMap) からコインロッカー情報を取得してCSVに保存するスクリプト。
 *
 * 使い方:
 *   pnpm fetch [エリア名] [出力CSVファイル名]
 *
 * 例:
 *   pnpm fetch "東京都" lockers.csv
 *   pnpm fetch "大阪府" osaka_lockers.csv
 *
 * デフォルト: エリア=東京都, 出力=lockers.csv
 *
 * CSVフォーマット: name,lat,lng,note,pricing
 *   pricing は JSON 配列文字列（例: []）
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type OverpassNode = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassNode[];
};

export type LockerRow = {
  name: string;
  lat: number;
  lng: number;
  note: string;
  pricing: string;
};

export async function fetchFromOverpass(areaName: string): Promise<LockerRow[]> {
  const query = `
[out:json][timeout:90];
area["name"="${areaName}"]->.target;
(
  node["amenity"="locker"](area.target);
  node["amenity"="luggage_locker"](area.target);
  node["amenity"="left_luggage"](area.target);
);
out body;
`.trim();

  console.log(`Overpass API へクエリを送信中 (エリア: ${areaName})...`);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "CLF/1.0 (Coin Locker Finder; https://github.com/shunsuke-kawata/clf)",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API エラー: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OverpassResponse;

  return data.elements.map((node): LockerRow => {
    const tags = node.tags ?? {};
    const name = tags["name"] ?? tags["name:ja"] ?? tags["operator"] ?? "コインロッカー";

    const noteParts: string[] = [];
    if (tags["operator"]) noteParts.push(`運営: ${tags["operator"]}`);
    if (tags["opening_hours"]) noteParts.push(`営業時間: ${tags["opening_hours"]}`);
    if (tags["fee"]) noteParts.push(`料金: ${tags["fee"]}`);
    if (tags["description"]) noteParts.push(tags["description"]);
    if (tags["note"]) noteParts.push(tags["note"]);

    return {
      name,
      lat: node.lat,
      lng: node.lon,
      note: noteParts.join("\n"),
      pricing: "[]",
    };
  });
}

export function escapeCSVField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCSV(rows: LockerRow[]): string {
  const header = "name,lat,lng,note,pricing";
  const lines = rows.map((row) =>
    [
      escapeCSVField(row.name),
      row.lat,
      row.lng,
      escapeCSVField(row.note),
      escapeCSVField(row.pricing),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

async function main(): Promise<void> {
  const areaName = process.argv[2] ?? "東京都";
  const outputFile = process.argv[3] ?? "lockers.csv";

  const rows = await fetchFromOverpass(areaName);
  console.log(`${rows.length} 件のデータを取得しました`);

  if (rows.length === 0) {
    console.warn('データが0件です。エリア名が正しいか確認してください（例: "東京都", "大阪府"）');
  }

  const csv = toCSV(rows);
  const outputPath = path.resolve(outputFile);
  fs.writeFileSync(outputPath, csv, "utf-8");
  console.log(`${outputPath} に保存しました`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("エラー:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
