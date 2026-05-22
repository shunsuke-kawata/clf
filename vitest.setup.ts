import { vi } from "vitest";

// next/headers の cookies() はサーバーランタイム専用のため、テスト環境ではモックに差し替える。
// 各テストファイルで vi.mocked(cookies) を使って戻り値を上書きできる。
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
