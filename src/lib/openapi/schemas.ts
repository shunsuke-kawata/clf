import { z } from "zod";
import { registry } from "./registry";

export const SessionRoleSchema = registry.register(
  "SessionRole",
  z.enum(["user", "admin"]).openapi({ description: "セッションロール" })
);

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    error: z.string().openapi({ description: "エラーメッセージ" }),
  })
);

export const LockerInputSchema = registry.register(
  "LockerInput",
  z.object({
    lat: z.number().openapi({ description: "緯度", example: 35.6812 }),
    lng: z.number().openapi({ description: "経度", example: 139.7671 }),
    note: z.string().optional().openapi({ description: "メモ（任意）", example: "B1 左の列" }),
    pricing: z
      .array(z.number().int().min(1))
      .openapi({ description: "料金一覧（円、正の整数）", example: [300, 500, 700] }),
  })
);

export const LockerSchema = registry.register(
  "Locker",
  LockerInputSchema.extend({
    id: z.string().uuid().openapi({ description: "ロッカー UUID" }),
    created_at: z.string().datetime().openapi({ description: "作成日時（ISO 8601）" }),
    updated_at: z.string().datetime().openapi({ description: "更新日時（ISO 8601）" }),
  })
);

export const LockerPhotoSchema = registry.register(
  "LockerPhoto",
  z.object({
    id: z.string().uuid(),
    locker_id: z.string().uuid(),
    storage_key: z
      .string()
      .openapi({ description: "Supabase Storage のオブジェクトキー", example: "abc123/photo.jpg" }),
    order_index: z.number().int().openapi({ description: "表示順" }),
    created_at: z.string().datetime(),
  })
);

export const LockerWithPhotosSchema = registry.register(
  "LockerWithPhotos",
  LockerSchema.extend({
    locker_photos: z.array(LockerPhotoSchema),
  })
);

export const GeocodeResultSchema = registry.register(
  "GeocodeResult",
  z.object({
    lat: z.string().openapi({ description: "緯度（文字列）", example: "35.6812" }),
    lon: z.string().openapi({ description: "経度（文字列）", example: "139.7671" }),
    display_name: z.string().openapi({ description: "表示名", example: "東京駅, 東京" }),
  })
);

export const SearchHistorySchema = registry.register(
  "SearchHistory",
  z.object({
    id: z.string().uuid(),
    query: z.string().openapi({ example: "東京駅" }),
    lat: z.number().nullable().openapi({ example: 35.6812 }),
    lng: z.number().nullable().openapi({ example: 139.7671 }),
    display_name: z.string().nullable().openapi({ example: "東京駅, 東京" }),
    searched_at: z.string().datetime(),
  })
);
