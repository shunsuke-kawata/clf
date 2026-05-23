import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetSessionRole } = vi.hoisted(() => ({
  mockGetSessionRole: vi.fn<() => Promise<"admin" | "user" | null>>(),
}));

vi.mock("@/features/auth/lib/auth", () => ({
  getSessionRole: mockGetSessionRole,
}));

const { mockChain, mockFrom, mockStorage } = vi.hoisted(() => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
  };
  const mockStorageBucket = { remove: vi.fn().mockResolvedValue({ error: null }) };
  const mockStorage = { from: vi.fn().mockReturnValue(mockStorageBucket) };
  return { mockChain, mockFrom: vi.fn().mockReturnValue(mockChain), mockStorage };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseReader: { from: mockFrom },
  supabaseAdmin: { from: mockFrom, storage: mockStorage },
}));

import { GET, PUT, DELETE } from "./route";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method: string, id: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/lockers/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.insert.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockChain.delete.mockReturnThis();
  mockChain.not.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
  mockStorage.from.mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) });
});

// ─────────────────────────────────────────────
// GET /api/lockers/[id]
// ─────────────────────────────────────────────

describe("GET /api/lockers/[id]", () => {
  it("ロッカーが存在する場合は 200 とデータを返す", async () => {
    const mockLocker = { id: "uuid-1", lat: 35.0, lng: 135.0, pricing: [300], locker_photos: [] };
    mockChain.single.mockResolvedValueOnce({ data: mockLocker, error: null });

    const res = await GET(makeRequest("GET", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe("uuid-1");
  });

  it("存在しない ID は PGRST116 エラーを 404 に変換する", async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116", message: "no rows" } });

    const res = await GET(makeRequest("GET", "not-exist"), makeParams("not-exist"));
    expect(res.status).toBe(404);
  });

  it("PGRST116 以外の Supabase エラーは 500 を返す", async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST999", message: "internal error" } });

    const res = await GET(makeRequest("GET", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────
// PUT /api/lockers/[id]
// ─────────────────────────────────────────────

describe("PUT /api/lockers/[id]", () => {
  it("認証なしで 401 を返す", async () => {
    mockGetSessionRole.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", "uuid-1", { lat: 36.0, lng: 136.0, pricing: [500] }), makeParams("uuid-1"));
    expect(res.status).toBe(401);
  });

  it("user 認証で有効なデータなら 200 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const updated = { id: "uuid-1", lat: 36.0, lng: 136.0, pricing: [500] };
    mockChain.single.mockResolvedValueOnce({ data: updated, error: null });

    const res = await PUT(makeRequest("PUT", "uuid-1", { lat: 36.0, lng: 136.0, pricing: [500] }), makeParams("uuid-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).lat).toBe(36.0);
  });

  it("バリデーション失敗で 400 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await PUT(makeRequest("PUT", "uuid-1", { lat: "invalid", lng: 135.0, pricing: [300] }), makeParams("uuid-1"));
    expect(res.status).toBe(400);
  });

  it("Supabase update がエラーを返した場合は 500 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: "update failed" } });

    const res = await PUT(makeRequest("PUT", "uuid-1", { lat: 35.0, lng: 135.0, pricing: [300] }), makeParams("uuid-1"));
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/lockers/[id]
// ─────────────────────────────────────────────

describe("DELETE /api/lockers/[id]", () => {
  it("認証なしで 401 を返す", async () => {
    mockGetSessionRole.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(401);
  });

  it("user 権限で 403 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await DELETE(makeRequest("DELETE", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(403);
  });

  it("admin 権限で削除成功時に 204 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("admin");
    mockChain.eq.mockResolvedValueOnce({ data: [], error: null });
    mockChain.eq.mockResolvedValueOnce({ error: null });

    const res = await DELETE(makeRequest("DELETE", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(204);
  });

  it("admin 権限で DB エラー時に 500 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("admin");
    mockChain.eq.mockResolvedValueOnce({ data: [], error: null });
    mockChain.eq.mockResolvedValueOnce({ error: { message: "delete failed" } });

    const res = await DELETE(makeRequest("DELETE", "uuid-1"), makeParams("uuid-1"));
    expect(res.status).toBe(500);
  });
});
