# CLF ロードマップ

## Phase 1 — 基盤構築 🚧 進行中

- [x] Next.js 16 プロジェクト初期化
- [x] shadcn/ui・Leaflet・Supabase・Zod・react-hook-form インストール
- [x] CLAUDE.md・ROADMAP.md 作成
- [ ] Supabase テーブル作成・RLS設定・Storageバケット作成
- [ ] `.env.local` 設定
- [ ] `lib/supabase/client.ts`・`server.ts` 作成

## Phase 2 — 認証

- [ ] `lib/auth.ts`（Cookie署名・検証・パスワード照合）
- [ ] `middleware.ts`（`/admin/*` と書き込み系APIを保護）
- [ ] `POST /api/auth/login`・`POST /api/auth/logout`
- [ ] `/login` ページ（パスワード入力画面）

## Phase 3 — 地図・ロッカー表示

- [ ] `MapView.tsx`（Leaflet、dynamic import・SSR無効）
- [ ] `GET /api/lockers`（全件取得）
- [ ] `/`（地図メイン画面）でピン表示
- [ ] `GET /api/lockers/[id]`（1件取得）
- [ ] `/lockers/[id]`（詳細画面：写真・料金・メモ）

## Phase 4 — 投稿フォーム

- [ ] `MapClickHandler.tsx`（地図クリックで緯度経度取得）
- [ ] `PricingEditor.tsx`（料金の動的追加・削除）
- [ ] `PhotoUploader.tsx` + `POST /api/photos`（Supabase Storage）
- [ ] `LockerForm.tsx` + `POST /api/lockers`（新規作成）
- [ ] `/admin/new`（新規投稿画面）
- [ ] `PUT /api/lockers/[id]`・`DELETE /api/lockers/[id]`
- [ ] `/admin/[id]/edit`（編集画面）

## Phase 5 — 会場名検索

- [ ] `GET /api/geocode`（Nominatim プロキシ）
- [ ] `VenueSearchBar.tsx`（入力→API→地図 flyTo）

## Phase 6 — 仕上げ・デプロイ

- [ ] スマホ実機確認（`h-dvh`・タップ領域44px以上）
- [ ] エラーハンドリング・ローディング状態
- [ ] Vercel デプロイ + 環境変数設定

---

## デプロイ構成

| 環境 | ブランチ | プラットフォーム |
|------|---------|----------------|
| 本番 | `main` | Vercel（自動デプロイ） |
| 開発 | `develop` | — |
