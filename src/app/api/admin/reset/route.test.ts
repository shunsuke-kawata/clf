import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetSessionRole } = vi.hoisted(() => ({
  mockGetSessionRole: vi.fn<() => Promise<"admin" | "user" | null>>(),
}));

vi.mock("@/features/auth/lib/auth", () => ({
  getSessionRole: mockGetSessionRole,
}));

const { mockChain, mockFrom, mockStorageBucket } = vi.hoisted(() => {
  const mockStorageBucket = { remove: vi.fn().mockResolvedValue({ error: null }) };
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    not: vi.fn().mockResolvedValue({ error: null }),
  };
  return {
    mockChain,
    mockFrom: vi.fn().mockReturnValue(mockChain),
    mockStorageBucket,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseReader: { from: mockFrom },
  supabaseAdmin: {
    from: mockFrom,
    storage: { from: vi.fn().mockReturnValue(mockStorageBucket) },
  },
}));

import { DELETE } from "./route";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/admin/reset", { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.delete.mockReturnThis();
  mockChain.not.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue(mockChain);
  mockStorageBucket.remove.mockResolvedValue({ error: null });
});

describe("DELETE /api/admin/reset", () => {
  it("認証なしで 401 を返す", async () => {
    mockGetSessionRole.mockResolvedValue(null);
    const res = await DELETE(makeRequest());
    expect(res.status).toBe(401);
  });

  it("user 権限で 403 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("user");
    const res = await DELETE(makeRequest());
    expect(res.status).toBe(403);
  });

  it("admin 権限でリセット成功時に 204 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("admin");
    mockChain.select.mockResolvedValueOnce({ data: [{ storage_key: "photo/1.jpg" }], error: null });
    mockChain.not.mockResolvedValueOnce({ error: null });

    const res = await DELETE(makeRequest());
    expect(res.status).toBe(204);
  });

  it("admin 権限で DB エラー時に 500 を返す", async () => {
    mockGetSessionRole.mockResolvedValue("admin");
    mockChain.select.mockResolvedValueOnce({ data: [], error: null });
    mockChain.not.mockResolvedValueOnce({ error: { message: "delete failed" } });

    const res = await DELETE(makeRequest());
    expect(res.status).toBe(500);
  });
});
