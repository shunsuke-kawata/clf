import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  checkPassword,
  getSession,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "./auth";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "test-session-secret-for-vitest-ok"
);

async function makeJwt(sub: string, expiresIn: string, role?: "admin" | "user"): Promise<string> {
  const payload = role ? { role } : {};
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

function mockCookieStore(tokenMap: Record<string, string | undefined>) {
  return {
    get: vi.fn().mockImplementation((name: string) =>
      tokenMap[name] !== undefined ? { name, value: tokenMap[name] } : undefined
    ),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

// ─────────────────────────────────────────────
// checkPassword
// ─────────────────────────────────────────────

describe("checkPassword", () => {
  it("APP_PASSWORDで 'user' を返す", () => {
    expect(checkPassword("test-password")).toBe("user");
  });

  it("ADMIN_PASSWORDで 'admin' を返す", () => {
    expect(checkPassword("test-admin-password")).toBe("admin");
  });

  it("間違ったパスワードで null を返す", () => {
    expect(checkPassword("wrong-password")).toBeNull();
  });

  it("空文字で null を返す（長さ不一致のため早期リターン）", () => {
    expect(checkPassword("")).toBeNull();
  });

  it("長さが同じでも内容が違う場合は null を返す", () => {
    expect(checkPassword("test-passwore")).toBeNull();
  });
});

// ─────────────────────────────────────────────
// getSession
// ─────────────────────────────────────────────

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin ロール付きアクセストークンで 'admin' を返す", async () => {
    const token = await makeJwt(ACCESS_COOKIE, "15m", "admin");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: token }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBe("admin");
  });

  it("user ロール付きアクセストークンで 'user' を返す", async () => {
    const token = await makeJwt(ACCESS_COOKIE, "15m", "user");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: token }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBe("user");
  });

  it("ロールなし（旧形式）トークンは 'user' にフォールバックする", async () => {
    const token = await makeJwt(ACCESS_COOKIE, "15m");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: token }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBe("user");
  });

  it("アクセストークンが期限切れでも有効なリフレッシュトークンがあれば role を返す", async () => {
    const expiredAccess = await makeJwt(ACCESS_COOKIE, "-1s", "admin");
    const validRefresh = await makeJwt(REFRESH_COOKIE, "30d", "admin");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({
        [ACCESS_COOKIE]: expiredAccess,
        [REFRESH_COOKIE]: validRefresh,
      }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBe("admin");
  });

  it("アクセストークンがなくてもリフレッシュトークンが有効なら role を返す", async () => {
    const validRefresh = await makeJwt(REFRESH_COOKIE, "30d", "user");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [REFRESH_COOKIE]: validRefresh }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBe("user");
  });

  it("両トークンが存在しない場合は null を返す", async () => {
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({}) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBeNull();
  });

  it("リフレッシュトークンも期限切れの場合は null を返す", async () => {
    const expiredAccess = await makeJwt(ACCESS_COOKIE, "-1s", "user");
    const expiredRefresh = await makeJwt(REFRESH_COOKIE, "-1s", "user");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({
        [ACCESS_COOKIE]: expiredAccess,
        [REFRESH_COOKIE]: expiredRefresh,
      }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBeNull();
  });

  it("subject が不正なアクセストークンは null を返す", async () => {
    const wrongSubToken = await makeJwt("wrong-subject", "15m", "admin");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: wrongSubToken }) as unknown as Awaited<ReturnType<typeof cookies>>
    );
    expect(await getSession()).toBeNull();
  });
});
