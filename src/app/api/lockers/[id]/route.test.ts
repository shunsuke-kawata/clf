/**
 * GET・PUT・DELETE /api/lockers/[id] のルートハンドラーテスト
 *
 * Supabase の PGRST116 エラーコード（行が見つからない）を 404 に変換する分岐と、
 * その他のエラーを 500 に変換する分岐を中心に検証する。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockChain, mockFrom } = vi.hoisted(() => {
  const mockChain = {
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

import { GET, PUT, DELETE } from "./route";

/** Route Handler の第 2 引数として渡す params ヘルパー */
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.insert.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockChain.delete.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
});

// ─────────────────────────────────────────────
// GET /api/lockers/[id]
// ─────────────────────────────────────────────

describe("GET /api/lockers/[id]", () => {
  it("ロッカーが存在する場合は 200 とデータを返す", async () => {
    const mockLocker = {
      id: "uuid-1",
      lat: 35.0,
      lng: 135.0,
      pricing: [300],
      locker_photos: [],
    };
    mockChain.single.mockResolvedValueOnce({ data: mockLocker, error: null });

    const req = new NextRequest("http://localhost/api/lockers/uuid-1");
    const res = await GET(req, makeParams("uuid-1"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("uuid-1");
  });

  it("存在しない ID は PGRST116 エラーを 404 に変換する", async () => {
    // Supabase が .single() で行を見つけられない場合に返す固有エラーコード
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    });

    const req = new NextRequest("http://localhost/api/lockers/not-exist");
    const res = await GET(req, makeParams("not-exist"));

    expect(res.status).toBe(404);
  });

  it("PGRST116 以外の Supabase エラーは 500 を返す", async () => {
    // ネットワーク障害など PGRST116 以外のエラーは 500 にマッピングされる
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST999", message: "internal error" },
    });

    const req = new NextRequest("http://localhost/api/lockers/uuid-1");
    const res = await GET(req, makeParams("uuid-1"));

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────
// PUT /api/lockers/[id]
// ─────────────────────────────────────────────

describe("PUT /api/lockers/[id]", () => {
  function makeRequest(id: string, body: unknown) {
    return new NextRequest(`http://localhost/api/lockers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("有効なデータで 200 と更新後のロッカーを返す", async () => {
    const updated = { id: "uuid-1", lat: 36.0, lng: 136.0, pricing: [500] };
    mockChain.single.mockResolvedValueOnce({ data: updated, error: null });

    const res = await PUT(
      makeRequest("uuid-1", { lat: 36.0, lng: 136.0, pricing: [500] }),
      makeParams("uuid-1")
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.lat).toBe(36.0);
  });

  it("バリデーション失敗の場合は 400 を返す", async () => {
    // pricing に文字列が混入するなど schema を通過しないデータ
    const res = await PUT(
      makeRequest("uuid-1", { lat: "invalid", lng: 135.0, pricing: [300] }),
      makeParams("uuid-1")
    );

    expect(res.status).toBe(400);
  });

  it("Supabase update がエラーを返した場合は 500 を返す", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "update failed" },
    });

    const res = await PUT(
      makeRequest("uuid-1", { lat: 35.0, lng: 135.0, pricing: [300] }),
      makeParams("uuid-1")
    );

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/lockers/[id]
// ─────────────────────────────────────────────

describe("DELETE /api/lockers/[id]", () => {
  it("削除成功時は 204 を返す（ボディなし）", async () => {
    // .delete().eq() の終端は single() ではなく delete 自体が Promise を返す
    mockChain.eq.mockResolvedValueOnce({ error: null });

    const req = new NextRequest("http://localhost/api/lockers/uuid-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("uuid-1"));

    expect(res.status).toBe(204);
  });

  it("Supabase delete がエラーを返した場合は 500 を返す", async () => {
    mockChain.eq.mockResolvedValueOnce({
      error: { message: "delete failed" },
    });

    const req = new NextRequest("http://localhost/api/lockers/uuid-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("uuid-1"));

    expect(res.status).toBe(500);
  });
});
