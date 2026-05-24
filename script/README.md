# CLF スクリプト

Overpass API (OpenStreetMap) からコインロッカー情報を取得し、Supabase に一括登録するスクリプト群。

## セットアップ

```bash
cd script
pnpm install
```

## 環境変数

`import_to_db.ts` を使う際は以下の環境変数が必要。

| 変数名                      | 内容                                             |
| --------------------------- | ------------------------------------------------ |
| `SUPABASE_URL`              | SupabaseプロジェクトURL                          |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role キー（`SUPABASE_SERVICE_ROLE_KEY`） |

`.env` ファイルを作るか、実行時に `export` で設定する。

```bash
export SUPABASE_URL=https://xxxxxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## スクリプト

### 1. 特定エリアのデータ取得

```bash
pnpm fetch [エリア名] [出力ファイル]
```

| 引数         | デフォルト    | 説明                             |
| ------------ | ------------- | -------------------------------- |
| エリア名     | `東京都`      | OSM の `name` タグに一致する地名 |
| 出力ファイル | `lockers.csv` | 出力先CSVファイルパス            |

```bash
pnpm fetch                          # 東京都 → lockers.csv
pnpm fetch "大阪府"                  # 大阪府 → lockers.csv
pnpm fetch "大阪府" osaka.csv        # 大阪府 → osaka.csv
```

### 2. 全都道府県のデータ取得

47都道府県を順番に処理して1つのCSVにまとめる。各リクエスト後に2秒待機するため完了まで **約2〜5分** かかる。

```bash
pnpm fetch:all [出力ファイル]
```

```bash
pnpm fetch:all                      # → all_lockers.csv
pnpm fetch:all japan.csv            # → japan.csv
```

エラーが発生した都道府県は最大2回リトライし、それでも失敗した場合はスキップして続行する。処理後に失敗した都道府県の一覧が表示される。

### 3. DB への一括登録

CSVを読み込んで `lockers` テーブルに登録する。同一座標のレコードは重複とみなしてスキップする。

```bash
pnpm import [CSVファイル]
```

```bash
pnpm import                         # lockers.csv を登録
pnpm import all_lockers.csv         # all_lockers.csv を登録
```

## 典型的な流れ

```bash
# 1. 全都道府県のデータを取得
pnpm fetch:all all_lockers.csv

# 2. 内容を確認（件数・データ）
head all_lockers.csv

# 3. DB に登録
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
pnpm import all_lockers.csv
```

## CSV フォーマット

```
name,lat,lng,note,pricing
"新宿駅東口コインロッカー",35.69072,139.70011,"運営: JR東日本","[]"
```

| カラム    | 型             | 説明                                  |
| --------- | -------------- | ------------------------------------- |
| `name`    | string         | ロッカー名（OSM の `name` タグ）      |
| `lat`     | number         | 緯度                                  |
| `lng`     | number         | 経度                                  |
| `note`    | string         | 運営・営業時間・料金など              |
| `pricing` | JSON配列文字列 | 料金情報（初期値 `[]`、手動で編集可） |
