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

## 環境構築

### 必要なもの

- Node.js 20 以上
- pnpm
- Supabase プロジェクト（無料プランで可）

### 1. リポジトリをクローン

```bash
git clone https://github.com/shunsuke-kawata/clf.git
cd clf
```

### 2. 依存パッケージをインストール

```bash
pnpm install
```

### 3. 環境変数を設定

`.env.local` をプロジェクトルートに作成し、以下を設定します。

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 認証
APP_PASSWORD=your-app-password
SESSION_SECRET=your-random-string-32-chars-or-more
```

| 変数名 | 取得場所 |
|--------|---------|
| `SUPABASE_URL` | Supabase ダッシュボード → Settings → API → Project URL |
| `ANON_KEY` | Supabase ダッシュボード → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase ダッシュボード → Settings → API → service_role |
| `APP_PASSWORD` | 任意のパスワード（投稿・編集時に使用） |
| `SESSION_SECRET` | 32文字以上のランダム文字列（例: `openssl rand -base64 32` で生成） |

### 4. Supabase のテーブルを作成

Supabase ダッシュボードの SQL Editor で以下を実行します。

```sql
CREATE TABLE lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

### 5. Supabase Storage のバケットを作成

Supabase ダッシュボード → Storage → New bucket で以下を作成します。

- バケット名: `locker-photos`
- Public: オン

## 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開きます。

### iPhone / スマートフォンからのアクセス

スマートフォンから開発環境にアクセスする場合は、同一ネットワーク内のPCのIPアドレスを使用します。

```bash
# PCのIPアドレスを確認
ipconfig getifaddr en0   # Mac

# アクセス例
http://192.168.x.x:3000
```

> **注意**: HTTP + 非localhost 環境では位置情報（Geolocation API）が使用できません。
> スマートフォンで現在地機能を使いたい場合は [Cloudflare Quick Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) などでHTTPS化してください。
>
> ```bash
> cloudflared tunnel --url http://localhost:3000
> ```

## ビルド

```bash
pnpm build
```

## デプロイ

`main` ブランチへのプッシュで Vercel に自動デプロイされます。
Vercel の環境変数設定に `.env.local` の内容を登録してください。
