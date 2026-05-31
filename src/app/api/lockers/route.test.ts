import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetSessionRole } = vi.hoisted(() => ({
  mockGetSessionRole: vi.fn<() => Promise<"admin" | "user" | null>>(),
}));

vi.mock("@/features/auth/lib/auth", () => ({
  getSessionRole: mockGetSessionRole,
}));

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

import { GET, POST } from "./route";

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
// GET /api/lockers
// ─────────────────────────────────────────────

describe("GET /api/lockers", () => {
  it("ロッカー一覧を 200 で返す", async () => {
    const mockLockers = [
      { id: "uuid-1", lat: 35.0, lng: 135.0, pricing: [300], created_at: "2024-01-01" },
    ];
    mockChain.order.mockResolvedValueOnce({ data: mockLockers, error: null });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockLockers);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("Supabase がエラーを返した場合は 500 を返す", async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: { message: "connection error" } });

    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("connection error");
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

  it("認証なしで 401 を返す", async () => {
    mockGetSessionRole.mockResolvedValue(null);
    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300] }));
    expect(res.status).toBe(401);
  });

  it("有効なデータで 201 とロッカーを返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const created = { id: "uuid-new", lat: 35.0, lng: 135.0, pricing: [300] };
    mockChain.single.mockResolvedValueOnce({ data: created, error: null });

    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300] }));
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("uuid-new");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("lat が欠けている場合は 400 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await POST(makeRequest({ lng: 135.0, pricing: [300] }));
    expect(res.status).toBe(400);
  });

  it("pricing に負の数が含まれる場合は 400 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [-100] }));
    expect(res.status).toBe(400);
  });

  it("pricing に小数が含まれる場合は 400 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300.5] }));
    expect(res.status).toBe(400);
  });

  it("リクエストボディが JSON でない場合は 400 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const req = new NextRequest("http://localhost/api/lockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("Supabase insert がエラーを返した場合は 500 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: "insert failed" } });

    const res = await POST(makeRequest({ lat: 35.0, lng: 135.0, pricing: [300] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("insert failed");
  });
});
