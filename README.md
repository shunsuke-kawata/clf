# CLF — Coin Locker Finder

自分や身近な人が「次回また使いたいコインロッカー」を地図上にピンで記録するプライベートメモツール。

## 機能

- **地図表示**: 登録済みのコインロッカーをマップ上にピンで表示
- **ピンタップで詳細表示**: タップするとボトムシートで写真・料金・メモを確認
- **会場名検索**: 駅名・施設名で地図を移動
- **新規登録**: 現在地またはマップ上のピン指定で場所を登録、写真・料金・メモを記録
- **編集・削除**: 登録済みロッカーの情報を更新
- **パスワード認証**: 投稿・編集にはパスワードが必要（閲覧は誰でも可）

## 技術スタック

| 用途 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 + shadcn/ui |
| 地図 | Leaflet + react-leaflet |
| DB / Storage | Supabase (PostgreSQL + Storage) |
| バリデーション | Zod + react-hook-form |
| 会場検索 | Nominatim (OpenStreetMap) |
| デプロイ | Vercel |
| パッケージ管理 | pnpm |

---

## ローカル開発環境のセットアップ

### 1. 必要なツールをインストール

#### Homebrew（macOS のパッケージマネージャー）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Docker Desktop

Supabase のローカル環境は Docker で動作します。

[Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) をダウンロードしてインストールし、起動しておいてください。

#### Node.js（v20 以上）

```bash
brew install node
```

インストール確認:

```bash
node --version   # v20.x.x 以上
```

#### pnpm（パッケージマネージャー）

```bash
npm install -g pnpm
```

インストール確認:

```bash
pnpm --version   # 9.x.x 以上
```

#### Supabase CLI

```bash
brew install supabase/tap/supabase
```

インストール確認:

```bash
supabase --version
```

#### cloudflared（HTTPS トンネル）

iPhone など外部デバイスから HTTPS でアクセスするために使用します。

```bash
brew install cloudflared
```

インストール確認:

```bash
cloudflared --version
```

---

### 2. リポジトリをクローン

```bash
git clone https://github.com/shunsuke-kawata/clf.git
cd clf
```

### 3. 依存パッケージをインストール

```bash
pnpm install
```

### 4. 環境変数を設定

プロジェクトルートに `.env.local` を作成します。

```bash
touch .env.local
```

次のステップ（Supabase 起動後）で取得したキーを設定します。

### 5. Supabase をローカルで起動してキーを取得

```bash
supabase start
```

起動後に以下のような出力が表示されます（初回は数分かかります）。

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5...
service_role key: eyJhbGciOiJIUzI1NiIsInR5...
```

この値を `.env.local` に設定します。

```env
# Supabase（ローカル開発用）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<上記の anon key>
SUPABASE_SERVICE_ROLE_KEY=<上記の service_role key>

# 認証
APP_PASSWORD=任意のパスワード
SESSION_SECRET=<32文字以上のランダム文字列>
```

`SESSION_SECRET` は以下で生成できます。

```bash
openssl rand -base64 32
```

> `supabase start` を停止・再起動してもキーは変わりません。

### 6. Supabase Storage のバケットを作成

ローカルの Supabase ダッシュボード（[http://127.0.0.1:54323](http://127.0.0.1:54323)）を開き、  
**Storage → New bucket** で以下を作成します。

| 項目 | 値 |
|------|----|
| バケット名 | `locker-photos` |
| Public | オン |

> DBスキーマ（テーブル作成）はマイグレーションファイルから自動適用されるため、手動実行不要です。

---

## 開発サーバーの起動

Docker Desktop が起動していることを確認してから実行します。

```bash
make dev
```

このコマンド一つで以下がすべて起動します。

1. Supabase（ローカル DB / Storage）
2. Cloudflare HTTPS トンネル（iPhone などからのアクセス用）
3. Next.js 開発サーバー（localhost:3000）

ターミナルに以下のように表示されます。

```
Cloudflare tunnel 起動中.....
  HTTPS: https://xxxx.trycloudflare.com
```

- **ブラウザ（PC）**: [http://localhost:3000](http://localhost:3000)
- **iPhone / スマートフォン**: 上記 HTTPS URL（現在地機能を使う場合は必須）

---

## make コマンド一覧

| コマンド | 説明 |
|----------|------|
| `make dev` | 開発環境をフルで起動（Supabase + Cloudflare tunnel + Next.js） |
| `make stop` | すべてのサービスを停止（Supabase + Cloudflare tunnel + Next.js） |
| `make db-start` | Supabase のみ起動 |
| `make db-stop` | Supabase のみ停止 |
| `make db-status` | Supabase の起動状態を確認 |

### 各コマンドの詳細

#### `make dev`

```bash
make dev
```

- Supabase が未起動なら自動起動（起動済みならスキップ）
- 既存の Cloudflare tunnel を再起動してHTTPS URLを表示
- ポート 3000 が使用中なら既存プロセスを終了してから Next.js を起動
- ターミナルに HTTPS URL が表示されるので、そのまま iPhone でアクセスできる

#### `make stop`

```bash
make stop
```

- Supabase を停止
- Cloudflare tunnel を停止
- Next.js（ポート 3000）を停止

#### `make db-start` / `make db-stop`

```bash
make db-start   # Supabase のみ起動
make db-stop    # Supabase のみ停止
```

Next.js だけを手動で起動したい場合などに使用します。

#### `make db-status`

```bash
make db-status
```

Supabase の起動状態・各サービスのポートを確認できます。

---

## pnpm コマンド

| コマンド | 説明 |
|----------|------|
| `pnpm dev` | Next.js 開発サーバーのみ起動（Supabase は別途起動が必要） |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番ビルドのサーバー起動 |
| `pnpm test` | テスト実行（watch モード） |
| `pnpm test:run` | テスト実行（一回のみ） |
| `pnpm test:coverage` | カバレッジレポート付きテスト |

---

## デプロイ

`main` ブランチへのプッシュで Vercel に自動デプロイされます。

### Vercel の環境変数設定

Vercel ダッシュボード → Settings → Environment Variables に以下を登録します。

| 変数名 | 取得場所 |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ダッシュボード → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase ダッシュボード → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase ダッシュボード → Settings → API → service_role |
| `APP_PASSWORD` | 任意のパスワード（投稿・編集時に使用） |
| `SESSION_SECRET` | 32文字以上のランダム文字列（`openssl rand -base64 32`） |

### Supabase 本番テーブルの作成

Supabase ダッシュボードの SQL Editor で以下を実行します。

```sql
CREATE TABLE lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  note TEXT,
  pricing JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE locker_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_id UUID NOT NULL REFERENCES lockers(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Supabase Storage のバケット作成（本番）

Supabase ダッシュボード → Storage → New bucket で以下を作成します。

| 項目 | 値 |
|------|----|
| バケット名 | `locker-photos` |
| Public | オン |
