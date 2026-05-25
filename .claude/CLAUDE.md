# CLF (Coin Locker Finder)

自分や身近な人が「次回また使いたいコインロッカー」を記録するプライベートメモツール。パブリックサービスではない。

## 技術スタック

| 用途           | 技術                                          |
| -------------- | --------------------------------------------- |
| フレームワーク | Next.js 16 (App Router)                       |
| 言語           | TypeScript（`any`禁止、`unknown`を使う）      |
| スタイル       | Tailwind CSS v4 + shadcn/ui                   |
| 地図           | Leaflet + react-leaflet（SSR無効）            |
| DB / Storage   | Supabase（PostgreSQL + Storage）              |
| バリデーション | Zod + react-hook-form + @hookform/resolvers   |
| 会場検索       | Nominatim（OpenStreetMap）- 無料・APIキー不要 |
| デプロイ       | Vercel（mainブランチ自動デプロイ）            |
| パッケージ管理 | pnpm                                          |

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # / 地図メイン画面
│   ├── login/page.tsx              # パスワード入力
│   ├── lockers/[id]/page.tsx       # ロッカー詳細
│   ├── admin/
│   │   ├── new/page.tsx            # 新規投稿フォーム
│   │   └── [id]/edit/page.tsx      # 編集フォーム
│   └── api/
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       ├── geocode/route.ts        # Nominatim プロキシ
│       ├── lockers/route.ts        # GET・POST
│       ├── lockers/[id]/route.ts   # GET・PUT・DELETE
│       └── photos/route.ts         # POST（アップロード）
├── components/
│   ├── map/
│   │   ├── MapView.tsx             # Leaflet 本体（dynamic import）
│   │   ├── LockerMarker.tsx
│   │   ├── MapClickHandler.tsx
│   │   └── VenueSearchBar.tsx      # 会場名検索バー
│   ├── locker/
│   │   ├── LockerCard.tsx
│   │   ├── PhotoCarousel.tsx
│   │   └── PricingTable.tsx
│   └── form/
│       ├── LockerForm.tsx
│       ├── PricingEditor.tsx
│       └── PhotoUploader.tsx
├── lib/
│   ├── auth.ts                     # Cookie署名・検証・パスワード照合
│   ├── supabase/
│   │   ├── client.ts               # anon key（ブラウザ用）
│   │   └── server.ts               # service_role key（API Route用）
│   ├── schemas/locker.ts           # Zod スキーマ
│   └── utils/photo.ts              # Storage URL 生成
├── hooks/
│   ├── useLockers.ts
│   └── useGeolocation.ts
└── middleware.ts                   # 認証ミドルウェア
```

## 環境変数

`.env.local` に設定。

| 変数名                          | 内容                                     |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | SupabaseプロジェクトURL                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon publicキー                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | service_roleキー（API Routeのみ使用）    |
| `APP_PASSWORD`                  | 投稿・編集に必要なパスワード             |
| `SESSION_SECRET`                | Cookie署名用ランダム文字列（32文字以上） |

## 認証方針

JWT・DB不使用。**Cookie + HMAC-SHA256署名**のみ。

- 閲覧（`GET /api/lockers/*`、`/`、`/lockers/*`）: 誰でもOK
- 投稿・編集・削除（`/admin/*`、書き込み系API）: パスワード認証済みのみ

## Supabaseスキーマ

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

## 会場名検索

Nominatim API（無料・APIキー不要）を `/api/geocode` 経由で呼び出し、緯度経度を取得して地図を `flyTo` で移動させる。DBテーブル不要。

## 開発フロー

- ブランチ: `main` / `develop` / `feat/issue{番号}`
- **作業開始前に必ず Notion Issue と GitHub Issue を作成してからブランチを切る**（/start-task スキルを使う）
- リポジトリ: https://github.com/shunsuke-kawata/clf

## Git 操作ルール（厳守）

**`git commit` / `git push` はユーザーが明示的に指示した場合のみ実行する。**

- 実装完了後は変更内容を報告し、コミット・push の指示を待つ
- 「タスクを進めてください」「自動で進めてください」などの指示はコミット・push の許可を含まない
- PR 作成もユーザーの指示があるまで行わない
- いかなる状況でも無断でコミット・push・PR 作成を行わないこと

## GitHub 操作

GitHub MCP はこのプロジェクトで Issue 作成の権限がない。**GitHub への書き込み操作は常に `gh` CLI を使うこと。**

```bash
# Issue 作成
gh issue create --repo shunsuke-kawata/clf --title "..." --body "..."

# PR 作成
gh pr create --base develop --title "..." --body "..."
```

## コマンド

```bash
pnpm dev        # 開発サーバー起動
pnpm build      # ビルド
pnpm test       # テスト（watch モード）
pnpm test:run   # テスト（一回実行）
```

## iPhone でのローカル開発（geolocation テスト）

iPhoneから `localhost` には直接アクセスできず、LAN IP（`http://192.168.x.x:3000`）経由はHTTPのためブラウザがgeolocationをブロックする。HTTPSトンネルを使ってiPhoneからアクセスする。

### Cloudflare Quick Tunnel（推奨・アカウント不要）

```bash
# 1. cloudflared をインストール（初回のみ）
brew install cloudflared

# 2. 開発サーバーを起動
pnpm dev

# 3. 別ターミナルでトンネルを起動
cloudflared tunnel --url http://localhost:3000
```

起動後に表示される `https://xxxx.trycloudflare.com` をiPhoneのブラウザで開く。
`next.config.ts` の `allowedDevOrigins` に設定済みなので追加設定は不要。

### localtunnel（アカウント不要・インストール不要）

```bash
npx localtunnel --port 3000
```

`https://xxxx.loca.lt` のURLが発行される。初回アクセス時にパスワード入力画面が出る場合は、表示されているIPアドレスをそのまま入力する。

## テスト方針

テストフレームワークは **Vitest v2 + happy-dom**。

### 新規機能を実装するときのルール

**ユーザーが操作する機能を追加・変更した場合は、`/help` ページの説明も必ず更新する。**

- 説明を追加・更新する対象: `src/features/help/components/HelpContent.tsx`
- 既存セクションに収まる変更（例: ボタンの挙動変更）→ 該当セクションの説明文を修正する
- 新しい操作フローが生まれる変更（例: 新機能の追加）→ 既存セクションに追記、またはセクション自体を追加する
- `HELP_SECTIONS` 配列を変更した場合は `HelpSidebar` の目次も自動的に追従するため追加作業は不要

**APIルートまたはOpenAPIスキーマを追加・変更した場合は、`pnpm generate:swagger` を実行して `docs/swagger.yaml` を更新する。**

- 対象: `src/app/api/` 配下のルートハンドラ、`src/lib/openapi/` 配下のスキーマ・パス定義
- 実行後は生成された `docs/swagger.yaml` を一緒にコミットする

**純粋なロジックを含む実装には必ずテストを追加する。**

| 対象                                | テストの要否                                           |
| ----------------------------------- | ------------------------------------------------------ |
| Zod スキーマ                        | **必須**（バリデーション境界値を網羅する）             |
| 認証ロジック（JWT・パスワード検証） | **必須**                                               |
| API Route Handler                   | **必須**（正常系・バリデーション失敗・DB エラーの3軸） |
| 純粋関数（utils など）              | **必須**                                               |
| Leaflet/地図コンポーネント          | 不要（jsdom では動作不安定のため対象外）               |
| UI コンポーネント全般               | 原則不要（E2E の領域）                                 |

### テストファイルの置き場

ソースファイルの隣にコロケーションで配置する。

```
src/features/locker/schemas/locker.ts
src/features/locker/schemas/locker.test.ts  ← 隣に置く
```

### モックの方針

- `next/headers`（cookies）: `vitest.setup.ts` でグローバルにモック済み
- Supabase クライアント: `vi.hoisted` + `vi.mock("@/lib/supabase/server")` でテストファイル内でモックする
- jose（JWT）: モックせず実際の JWT を生成してテストする

## コーディング原則

- **DRY**（Don't Repeat Yourself）: 同じロジックを複数箇所に書かない。共通化できるものは関数・コンポーネント・フックに切り出す
- **KISS**（Keep It Simple, Stupid）: シンプルな実装を優先する。過度な抽象化・汎用化をしない
- **YAGNI**（You Aren't Gonna Need It）: 今必要でない機能・拡張ポイントは実装しない。将来の要件を先読みしてコードを膨らませない
- **マジックナンバー禁止**: コード中に数値・文字列リテラルを直接埋め込まない。`APP_CONFIG` など定数として一元管理し、変更箇所を最小化する

### 例外処理

`catch` ブロックを空のまま（pass）にしない。必ず `logger` でエラー内容を出力し、状況に応じた処理を行う。

- **想定外エラー**: `logger.error` でスタックトレースを含むエラー情報を出力
- **期待される失敗**（期限切れ・バリデーション失敗など）: `logger.warn` または `logger.debug` でコンテキストを出力
- エラーを握りつぶして `return false` / `return null` するだけの実装は禁止。ログを出してから返す

### ログレベルの使い分け

デフォルトのログレベルは `warn`。環境変数 `LOG_LEVEL` または `NEXT_PUBLIC_LOG_LEVEL` で上書き可能。

| レベル         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `logger.error` | 想定外のエラー（DB障害・外部API失敗・例外）                            |
| `logger.warn`  | 期待される失敗（認証失敗・バリデーション失敗・トークン期限切れ）       |
| `logger.info`  | 主要フローの正常完了（セッション発行・ロッカー作成・写真アップロード） |
| `logger.debug` | 開発時のみ必要な詳細情報（クエリ結果件数・中間値）                     |

新規機能を実装するときは、以下のタイミングで適切なレベルのログを追加する。

- リクエスト処理の正常完了 → `logger.info`
- バリデーション失敗・認証拒否 → `logger.warn`
- DB・外部API・予期しない例外 → `logger.error`
- デバッグ用の詳細情報 → `logger.debug`

### SOLID原則

- **Single Responsibility**: 1つのクラス・関数は1つの責務のみを持つ
- **Open-Closed**: 拡張に対して開き、修正に対して閉じる
- **Liskov Substitution**: 派生クラスは基底クラスと置換可能であるべき
- **Interface Segregation**: クライアントが使わないメソッドへの依存を強制しない
- **Dependency Inversion**: 上位モジュールは下位モジュールに依存せず、抽象に依存する

## 環境の切り分け

`APP_CONFIG` に `isProd` / `isLocal` フラグが用意されている。環境によって挙動を変える場合はこれを使う。

```ts
import { APP_CONFIG } from "@/lib/config";

// ローカルのみ実行
if (APP_CONFIG.isLocal) { ... }

// 本番のみ実行
if (APP_CONFIG.isProd) { ... }
```

| フラグ               | 値                          | 用途例                                             |
| -------------------- | --------------------------- | -------------------------------------------------- |
| `APP_CONFIG.isLocal` | `NODE_ENV !== "production"` | HTTP LAN接続でのgeolocation許可、デバッグ専用処理  |
| `APP_CONFIG.isProd`  | `NODE_ENV === "production"` | セキュリティチェック強化、外部サービス呼び出し制限 |

## 写真URLの生成ルール

**Supabase Storage の写真URLは必ず `getPhotoUrl(supabaseUrl, storageKey)` を使うこと。**

```ts
import { getPhotoUrl } from "@/lib/utils/photo";

// ✅ 正しい
const url = getPhotoUrl(supabaseUrl, photo.storage_key);

// ❌ 禁止 — ローカル開発時にブラウザが 127.0.0.1 へのリクエストをブロックする
const url = `${supabaseUrl}/storage/v1/object/public/locker-photos/${photo.storage_key}`;
```

### 理由

ローカル Supabase は `http://127.0.0.1:54321` で動作する。Cloudflare Tunnel 等のHTTPSトンネル経由でアクセスすると、ブラウザのセキュリティポリシー（loopback access block）により CORS エラーが発生する。

`getPhotoUrl()` はローカル環境では `/api/photos/proxy?key=...` を返し、Next.js サーバー経由でフェッチすることでブラウザの制限を回避する。本番環境では直接 Supabase URL を返す。

## 注意事項

- `lib/supabase/server.ts` はサーバー専用（service_role key）。クライアントからimportしない
- Leafletは `dynamic` + `ssr: false` で読み込む（`window is not defined` エラー回避）
- スマホメインなのでタップ領域は44px以上、地図には `h-dvh` を使う
- ロードマップは `ROADMAP.md` を参照
