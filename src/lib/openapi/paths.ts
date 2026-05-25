import { z } from "zod";
import { registry } from "./registry";
import {
  SessionRoleSchema,
  ErrorResponseSchema,
  LockerInputSchema,
  LockerSchema,
  LockerWithPhotosSchema,
  LockerPhotoSchema,
  GeocodeResultSchema,
  SearchHistorySchema,
} from "./schemas";

const uuidPath = (name: string, description: string) => ({
  name,
  in: "path" as const,
  required: true,
  schema: z.string().uuid(),
  description,
});

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: ErrorResponseSchema } },
});

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["auth"],
  summary: "ログイン",
  description:
    "パスワードを検証し、JWT を httpOnly Cookie としてセットする。ロールに応じて `user` または `admin` を付与する。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ password: z.string().openapi({ example: "your-password" }) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "ログイン成功。clf_access / clf_refresh Cookie をセット。",
      content: {
        "application/json": {
          schema: z.object({ ok: z.boolean(), role: SessionRoleSchema }),
        },
      },
    },
    401: errorResponse("パスワード不正"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["auth"],
  summary: "ログアウト",
  description: "Cookie（clf_access・clf_refresh）を削除してトップページへリダイレクト。",
  responses: {
    303: { description: "ログアウト成功。/ へリダイレクト。" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["auth"],
  summary: "Access Token リフレッシュ",
  description:
    "clf_refresh Cookie を検証し、新しい Access Token（clf_access）を発行する。Access Token の有効期限（15 分）が切れた場合に呼び出す。",
  responses: {
    200: {
      description: "リフレッシュ成功。新しい clf_access Cookie をセット。",
      content: {
        "application/json": { schema: z.object({ ok: z.boolean() }) },
      },
    },
    401: errorResponse("Refresh Token 無効"),
  },
});

// ──────────────────────────────────────────
// Lockers
// ──────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/lockers",
  tags: ["lockers"],
  summary: "ロッカー一覧取得",
  description: "登録済みのコインロッカーを新着順で全件返す。認証不要。",
  responses: {
    200: {
      description: "ロッカー一覧",
      content: { "application/json": { schema: z.array(LockerSchema) } },
    },
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/lockers",
  tags: ["lockers"],
  summary: "ロッカー作成",
  description: "新しいコインロッカーを登録する。user または admin 認証必須。",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: LockerInputSchema } },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: { "application/json": { schema: LockerSchema } },
    },
    400: errorResponse("バリデーションエラー"),
    401: errorResponse("未認証"),
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/lockers/{id}",
  tags: ["lockers"],
  summary: "ロッカー詳細取得",
  description: "指定した ID のロッカーと紐づく写真一覧を返す。認証不要。",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: "ロッカー詳細（写真付き）",
      content: { "application/json": { schema: LockerWithPhotosSchema } },
    },
    404: errorResponse("ロッカーが見つからない"),
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/lockers/{id}",
  tags: ["lockers"],
  summary: "ロッカー更新",
  description: "指定した ID のロッカー情報を更新する。user または admin 認証必須。",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: LockerInputSchema } },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: { "application/json": { schema: LockerSchema } },
    },
    400: errorResponse("バリデーションエラー"),
    401: errorResponse("未認証"),
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/lockers/{id}",
  tags: ["lockers"],
  summary: "ロッカー削除",
  description: "指定した ID のロッカーと紐づく写真（Storage + DB）を全て削除する。admin ロール必須。",
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: "削除成功（レスポンスボディなし）" },
    401: errorResponse("未認証"),
    403: errorResponse("権限不足（admin ロールが必要）"),
    500: errorResponse("サーバーエラー"),
  },
});

// ──────────────────────────────────────────
// Photos
// ──────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/photos",
  tags: ["photos"],
  summary: "写真アップロード",
  description:
    "写真を Supabase Storage にアップロードし、locker_photos テーブルに記録する。jpg / png / gif / webp / heic 等、最大 10MB。",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ format: "binary", description: "画像ファイル（最大 10MB）" }),
            locker_id: z.string().uuid().openapi({ description: "紐づけるロッカーの UUID" }),
            order_index: z.number().int().default(0).openapi({ description: "表示順（昇順）" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "アップロード成功",
      content: { "application/json": { schema: LockerPhotoSchema } },
    },
    400: errorResponse("バリデーションエラー"),
    500: errorResponse("サーバーエラー"),
  },
});

// ──────────────────────────────────────────
// Geocode
// ──────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/geocode",
  tags: ["geocode"],
  summary: "住所・会場名検索",
  description:
    "Photon（OpenStreetMap）経由で会場名・住所を検索し緯度経度を返す。日本国内のみ、最大 5 件。認証不要。",
  request: {
    query: z.object({
      q: z.string().openapi({ description: "検索クエリ", example: "東京駅" }),
    }),
  },
  responses: {
    200: {
      description: "検索結果（最大 5 件）",
      content: { "application/json": { schema: z.array(GeocodeResultSchema) } },
    },
    400: errorResponse("クエリパラメータ q が未指定"),
    502: errorResponse("上流の Photon API エラー"),
  },
});

// ──────────────────────────────────────────
// Search History
// ──────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/search-history",
  tags: ["search-history"],
  summary: "検索履歴一覧取得",
  description:
    "セッション Cookie（clf_search_session）に紐づく検索履歴を新着順で返す。Cookie がない場合は空配列を返し、新しいセッション Cookie を発行する。",
  responses: {
    200: {
      description: "検索履歴一覧（最大 10 件）",
      content: { "application/json": { schema: z.array(SearchHistorySchema) } },
    },
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/search-history",
  tags: ["search-history"],
  summary: "検索履歴を追加・更新",
  description:
    "検索クエリを履歴に追加する。同一セッション × 同一クエリの場合は searched_at を更新する（upsert）。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            query: z.string().openapi({ description: "検索クエリ", example: "東京駅" }),
            lat: z.number().nullable().optional().openapi({ example: 35.6812 }),
            lng: z.number().nullable().optional().openapi({ example: 139.7671 }),
            display_name: z.string().nullable().optional().openapi({ example: "東京駅, 東京" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "追加・更新成功",
      content: { "application/json": { schema: SearchHistorySchema } },
    },
    400: errorResponse("バリデーションエラー"),
    500: errorResponse("サーバーエラー"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/search-history/{id}",
  tags: ["search-history"],
  summary: "検索履歴を削除",
  description: "指定した ID の検索履歴を削除する。セッション Cookie が一致するレコードのみ削除可能。",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: "削除成功（レスポンスボディなし）" },
    401: errorResponse("セッション Cookie なし"),
    500: errorResponse("サーバーエラー"),
  },
});

// ──────────────────────────────────────────
// Admin
// ──────────────────────────────────────────
registry.registerPath({
  method: "delete",
  path: "/api/admin/reset",
  tags: ["admin"],
  summary: "全データリセット",
  description:
    "全ロッカー・写真（Storage + DB）・検索履歴を削除する。admin ロール必須。この操作は取り消せない。",
  security: [{ cookieAuth: [] }],
  responses: {
    204: { description: "リセット成功（レスポンスボディなし）" },
    401: errorResponse("未認証"),
    403: errorResponse("権限不足（admin ロールが必要）"),
    500: errorResponse("サーバーエラー"),
  },
});
