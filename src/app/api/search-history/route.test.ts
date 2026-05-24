import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const MOCK_SESSION_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const MOCK_COOKIE_VALUE = "mock-cookie-value";

const { mockReadSession, mockCreate } = vi.hoisted(() => ({
  mockReadSession: vi.fn<() => { sessionId: string | null; isNew: boolean }>(),
  mockCreate: vi.fn(),
}));

vi.mock("@/features/search-history/lib/session", () => ({
  readSessionFromRequest: mockReadSession,
  createSearchSession: mockCreate,
  searchSessionCookieOptions: () => ({ httpOnly: true, maxAge: 31536000, path: "/" }),
}));

const { mockChain, mockFrom } = vi.hoisted(() => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return { mockChain, mockFrom: vi.fn().mockReturnValue(mockChain) };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET, POST } from "./route";
import { APP_CONFIG } from "@/lib/config";

function makeRequest(method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  return new NextRequest(`http://localhost/api/search-history`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockReturnValue({ cookieValue: MOCK_COOKIE_VALUE, sessionId: MOCK_SESSION_ID });
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.order.mockReturnThis();
  mockChain.upsert.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
});

// ─────────────────────────────────────────────
// GET /api/search-history
// ─────────────────────────────────────────────

describe("GET /api/search-history", () => {
  it("新規セッションの場合は空配列と新しいCookieを返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: null, isNew: true });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(res.cookies.get(APP_CONFIG.searchHistory.cookieName)).toBeTruthy();
  });

  it("有効なセッションがある場合は履歴を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    const history = [{ id: "uuid-1", query: "東京駅", searched_at: "2026-01-01T00:00:00Z" }];
    mockChain.limit.mockResolvedValueOnce({ data: history, error: null });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(history);
  });

  it("Supabaseエラーは500を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    mockChain.limit.mockResolvedValueOnce({ data: null, error: { message: "db error" } });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────
// POST /api/search-history
// ─────────────────────────────────────────────

describe("POST /api/search-history", () => {
  it("queryなしは400を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: null, isNew: true });
    const res = await POST(makeRequest("POST", {}));
    expect(res.status).toBe(400);
  });

  it("空queryは400を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: null, isNew: true });
    const res = await POST(makeRequest("POST", { query: "  " }));
    expect(res.status).toBe(400);
  });

  it("有効なqueryでupsertを実行し200を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    const record = { id: "uuid-1", query: "東京駅", searched_at: "2026-01-01T00:00:00Z" };
    mockChain.single.mockResolvedValueOnce({ data: record, error: null });

    const res = await POST(makeRequest("POST", { query: "東京駅" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(record);
  });

  it("セッションなしでも新しいCookieを発行してupsertする", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: null, isNew: true });
    const record = { id: "uuid-2", query: "渋谷駅", searched_at: "2026-01-01T00:00:00Z" };
    mockChain.single.mockResolvedValueOnce({ data: record, error: null });

    const res = await POST(makeRequest("POST", { query: "渋谷駅" }));
    expect(res.status).toBe(200);
    expect(res.cookies.get(APP_CONFIG.searchHistory.cookieName)).toBeTruthy();
  });

  it("Supabaseエラーは500を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: "upsert failed" } });

    const res = await POST(makeRequest("POST", { query: "新宿駅" }));
    expect(res.status).toBe(500);
  });
});
