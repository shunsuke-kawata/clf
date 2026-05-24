import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const MOCK_SESSION_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const { mockReadSession } = vi.hoisted(() => ({
  mockReadSession: vi.fn<() => { sessionId: string | null; isNew: boolean }>(),
}));

vi.mock("@/features/search-history/lib/session", () => ({
  readSessionFromRequest: mockReadSession,
}));

const { deleteResult, mockChain, mockFrom } = vi.hoisted(() => {
  const deleteResult: { error: { message: string } | null } = { error: null };
  const mockChain = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (v: typeof deleteResult) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(deleteResult).then(resolve, reject),
  };
  return { deleteResult, mockChain, mockFrom: vi.fn().mockReturnValue(mockChain) };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { DELETE } from "./route";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/search-history/uuid-1", { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteResult.error = null;
  mockChain.delete.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockFrom.mockReturnValue(mockChain);
});

describe("DELETE /api/search-history/[id]", () => {
  it("セッションなしは401を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: null, isNew: true });
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: "uuid-1" }) });
    expect(res.status).toBe(401);
  });

  it("有効なセッションで204を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: "uuid-1" }) });
    expect(res.status).toBe(204);
  });

  it("Supabaseエラーは500を返す", async () => {
    mockReadSession.mockReturnValueOnce({ sessionId: MOCK_SESSION_ID, isNew: false });
    deleteResult.error = { message: "delete failed" };

    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: "uuid-1" }) });
    expect(res.status).toBe(500);
  });
});
