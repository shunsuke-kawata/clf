/**
 * CSVファイルから Supabase の lockers テーブルへ一括登録するスクリプト。
 * 同一座標のデータは重複とみなしてスキップする。
 *
 * 使い方:
 *   pnpm import [CSVファイル]
 *
 * 例:
 *   pnpm import lockers.csv
 *
 * 必要な環境変数 (.env ファイルか export で設定):
 *   SUPABASE_URL          — SupabaseプロジェクトURL
 *   SUPABASE_SERVICE_ROLE_KEY — service_role キー
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type LockerInsert = {
  name: string;
  lat: number;
  lng: number;
  note: string;
  pricing: unknown[];
};

// RFC 4180準拠の簡易CSVパーサー
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCSV(content: string): LockerInsert[] {
  const lines = content.trim().split('\n');
  const rows: LockerInsert[] = [];

  // 1行目はヘッダー行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 5) {
      console.warn(`行 ${i + 1} をスキップ (フィールド数不足): ${line}`);
      continue;
    }

    const [name, latStr, lngStr, note, pricingStr] = fields;
    const lat = parseFloat(latStr ?? '');
    const lng = parseFloat(lngStr ?? '');

    if (!name?.trim() || isNaN(lat) || isNaN(lng)) {
      console.warn(`行 ${i + 1} をスキップ (name/lat/lng が無効): ${line}`);
      continue;
    }

    let pricing: unknown[] = [];
    try {
      const parsed = JSON.parse(pricingStr ?? '[]') as unknown;
      if (Array.isArray(parsed)) pricing = parsed;
    } catch {
      // pricing のパース失敗は無視して空配列のまま
    }

    rows.push({
      name: name.trim(),
      lat,
      lng,
      note: note?.trim() ?? '',
      pricing,
    });
  }

  return rows;
}

// 既存データの座標セットを作成（小数点5桁で比較 ≒ 約1m精度）
function buildExistingSet(existing: { lat: number; lng: number }[]): Set<string> {
  return new Set(
    existing.map(r => `${r.lat.toFixed(5)},${r.lng.toFixed(5)}`)
  );
}

async function main(): Promise<void> {
  const csvFile = process.argv[2] ?? 'lockers.csv';
  const filePath = path.resolve(csvFile);

  if (!fs.existsSync(filePath)) {
    console.error(`ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env['SUPABASE_URL'];
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '環境変数 SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`CSVから ${rows.length} 件のデータを読み込みました`);

  const { data: existing, error: fetchError } = await supabase
    .from('lockers')
    .select('lat,lng');

  if (fetchError) {
    console.error('既存データの取得に失敗:', fetchError.message);
    process.exit(1);
  }

  const existingSet = buildExistingSet(existing ?? []);
  const newRows = rows.filter(row => {
    const key = `${row.lat.toFixed(5)},${row.lng.toFixed(5)}`;
    return !existingSet.has(key);
  });

  const skipped = rows.length - newRows.length;
  if (skipped > 0) console.log(`重複 ${skipped} 件をスキップ`);
  console.log(`${newRows.length} 件を登録します...`);

  if (newRows.length === 0) {
    console.log('登録対象がありません');
    return;
  }

  const BATCH_SIZE = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
    const batch = newRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('lockers').insert(batch);
    if (error) {
      console.error(`バッチ ${Math.floor(i / BATCH_SIZE) + 1} の挿入に失敗:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r${inserted}/${newRows.length} 件挿入済み`);
    }
  }

  console.log(`\n完了: ${inserted} 件登録, ${failed} 件失敗`);
}

main().catch(err => {
  console.error('エラー:', err instanceof Error ? err.message : err);
  process.exit(1);
});
