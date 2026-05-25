import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
import "./schemas";
import "./paths";

export function generateDocument() {
  registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "clf_access",
    description: "JWT Access Token（httpOnly Cookie）。有効期限 15 分。",
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "CLF (Coin Locker Finder) API",
      version: "1.0.0",
      description: [
        "コインロッカーをプライベートに記録・管理するアプリ CLF の API 仕様書。",
        "",
        "## 認証",
        "JWT（HS256）を httpOnly Cookie で管理する。",
        "- `clf_access` — Access Token（有効期限 15 分）",
        "- `clf_refresh` — Refresh Token（有効期限 30 日）",
        "",
        "## ロール",
        "| ロール | 説明 |",
        "|--------|------|",
        "| `user`  | 一般ユーザー。閲覧・投稿・編集が可能 |",
        "| `admin` | 管理者。削除・リセット操作が可能 |",
      ].join("\n"),
    },
    servers: [
      { url: "https://clf-kohl.vercel.app", description: "本番環境" },
      { url: "http://localhost:3000", description: "ローカル開発環境" },
    ],
    tags: [
      { name: "auth", description: "認証（ログイン / ログアウト / トークンリフレッシュ）" },
      { name: "lockers", description: "コインロッカーの CRUD" },
      { name: "photos", description: "写真のアップロード" },
      { name: "geocode", description: "住所・会場名の検索（Photon プロキシ）" },
      { name: "search-history", description: "検索履歴（セッション Cookie で管理）" },
      { name: "admin", description: "管理者専用操作" },
    ],
  });
}
