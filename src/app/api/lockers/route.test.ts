/**
 * GET /api/lockers・POST /api/lockers のルートハンドラーテスト
 *
 * Supabase クライアントを vi.mock でモックし、実 DB 接続なしに
 * - 正常レスポンス（200 / 201）
 * - バリデーション失敗（400）
 * - Supabase エラー時（500）
 * を検証する。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase クライアントはモジュール評価時に process.env を検証して throw するため、
// vi.mock で実モジュールを読み込まずに差し替える。
// vi.hoisted でモックオブジェクトを宣言しないと vi.mock の factory 内で参照できない。
const { mockChain, mockFrom } = vi.hoisted(() => {
  const mockChain = {
    // 中間メソッドは this（mockChain 自身）を返すことでチェーンを実現する
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  return { mockChain, mockFrom: vi.fn().mockReturnValue(mockChain) };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseReader: { from: mockFrom },
  supabaseAdmin: { from: mockFrom },
}));

import { GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks でリセットされた後に mockReturnThis を再設定する
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.insert.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockChain.delete.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
});

// ─────────────────────────────────────────────
// GET /api/lockers
// ─────────────────────────────────────────────

describe("GET /api/lockers", () => {
  it("ロッカー一覧を 200 で返す", async () => {
    // Supabase が正常にデータを返した場合の正常系
    const mockLockers = [
      { id: "uuid-1", lat: 35.0, lng: 135.0, pricing: [300], created_at: "2024-01-01" },
    ];
    mockChain.order.mockResolvedValueOnce({ data: mockLockers, error: null });

    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockLockers);
  });

  it("Supabase がエラーを返した場合は 500 を返す", async () => {
    // DB 接続失敗などのサーバーエラーで 500 を返すことを確認
    mockChain.order.mockResolvedValueOnce({
      data: null,
      error: { message: "connection error" },
    });

    const res = await GET();

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("connection error");
  });
});

// ─────────────────────────────────────────────
// POST /api/lockers
// ─────────────────────────────────────────────

describe("POST /api/lockers", () => {
  function makeRequest(body: unknown) {
    return new NextRequest("http://localhost/api/lockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("有効なデータで 201 とロッカーを返す", async () => {
    // lockerSchema を通過し Supabase insert が成功する正常系
    const created = { id: "uuid-new", lat: 35.0, lng: 135.0, pricing: [300] };
    mockChain.single.mockResolvedValueOnce({ data: created, error: null });

    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300] }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("uuid-new");
  });

  it("lat が欠けている場合は 400 を返す", async () => {
    // lockerSchema.safeParse が失敗するバリデーション異常系
    const res = await POST(makeRequest({ lng: 135.0, pricing: [300] }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("pricing に負の数が含まれる場合は 400 を返す", async () => {
    const res = await POST(
      makeRequest({ lat: 35.0, lng: 135.0, pricing: [-100] })
    );

    expect(res.status).toBe(400);
  });

  it("pricing に小数が含まれる場合は 400 を返す", async () => {
    const res = await POST(
      makeRequest({ lat: 35.0, lng: 135.0, pricing: [300.5] })
    );

    expect(res.status).toBe(400);
  });

  it("リクエストボディが JSON でない場合は 400 を返す", async () => {
    // body が不正な JSON の場合、safeParse(null) となりバリデーション失敗
    const req = new NextRequest("http://localhost/api/lockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("Supabase insert がエラーを返した場合は 500 を返す", async () => {
    // バリデーションは通過するが DB 書き込みに失敗するケース
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });

    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300] }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("insert failed");
  });
});
