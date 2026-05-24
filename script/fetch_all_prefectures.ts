/**
 * 全47都道府県のコインロッカー情報を Overpass API から順番に取得して
 * 1つのCSVにまとめて保存するスクリプト。
 *
 * 使い方:
 *   pnpm fetch:all [出力CSVファイル名]
 *
 * 例:
 *   pnpm fetch:all all_lockers.csv
 *
 * デフォルト出力: all_lockers.csv
 *
 * Overpass APIへの負荷を下げるため各リクエスト後に DELAY_MS 待機する。
 * エラーが起きた都道府県は最大 MAX_RETRIES 回リトライし、それでも失敗した場合はスキップする。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fetchFromOverpass, toCSV, type LockerRow } from "./fetch_lockers";

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

const DELAY_MS = 10000;
const RATE_LIMIT_DELAY_MS = 60000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("429");
}

async function fetchWithRetry(prefecture: string): Promise<LockerRow[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const waitMs = isRateLimitError(lastError) ? RATE_LIMIT_DELAY_MS : DELAY_MS * attempt;
        console.log(`  リトライ ${attempt}/${MAX_RETRIES} (${waitMs / 1000}秒待機)...`);
        await sleep(waitMs);
      }
      return await fetchFromOverpass(prefecture);
    } catch (err) {
      lastError = err;
      console.warn(`  エラー: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw lastError;
}

async function main(): Promise<void> {
  const outputFile = process.argv[2] ?? "all_lockers.csv";
  const outputPath = path.resolve(outputFile);

  const total = PREFECTURES.length;
  const allRows: LockerRow[] = [];
  const failed: string[] = [];

  console.log(
    `全${total}都道府県の処理を開始します（推定時間: ${Math.ceil((total * DELAY_MS) / 60000)}〜${Math.ceil((total * (DELAY_MS + 10000)) / 60000)} 分）`
  );
  console.log("");

  for (let i = 0; i < PREFECTURES.length; i++) {
    const prefecture = PREFECTURES[i];
    const progress = `[${i + 1}/${total}]`;

    process.stdout.write(`${progress} ${prefecture} ...`);

    try {
      const rows = await fetchWithRetry(prefecture);
      allRows.push(...rows);
      process.stdout.write(` ${rows.length} 件 (累計: ${allRows.length} 件)\n`);
    } catch (err) {
      process.stdout.write(` スキップ\n`);
      console.error(`  ${prefecture} の取得に失敗:`, err instanceof Error ? err.message : err);
      failed.push(prefecture);
    }

    // 最後の都道府県以外は待機
    if (i < PREFECTURES.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("");
  console.log(`取得完了: ${allRows.length} 件 (スキップ: ${failed.length} 県)`);

  if (failed.length > 0) {
    console.warn(`失敗した都道府県: ${failed.join(", ")}`);
  }

  if (allRows.length === 0) {
    console.error("データが0件のためCSVを出力しません");
    process.exit(1);
  }

  const csv = toCSV(allRows);
  fs.writeFileSync(outputPath, csv, "utf-8");
  console.log(`${outputPath} に保存しました`);
}

main().catch((err) => {
  console.error("エラー:", err instanceof Error ? err.message : err);
  process.exit(1);
});
