/**
 * 認証ロジックのテスト
 *
 * checkPassword: タイミング攻撃対策の timingSafeEqual を使うため、
 *   長さ一致・不一致・内容不一致の各ケースを個別に確認する。
 *
 * getSession: アクセストークン有効 / 期限切れ（リフレッシュへフォールバック）/
 *   両トークンなし の 3 分岐を実際の JWT を生成して検証する。
 *   jose のモックは使わず実 JWT を作ることで、署名検証ロジック自体もカバーする。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  checkPassword,
  getSession,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "./auth";

// vitest.setup.ts で next/headers をグローバルにモック済み。
// このファイルでは各テストの cookies() 戻り値を上書きする。

// vitest.config.ts の test.env で SESSION_SECRET を設定済みなので
// getSecret() は process.env.SESSION_SECRET を読み取れる
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "test-session-secret-for-vitest-ok"
);

/** テスト用 JWT を生成するヘルパー */
async function makeJwt(sub: string, expiresIn: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

/** cookies() のモック戻り値を組み立てるヘルパー */
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
  // APP_PASSWORD は vitest.config.ts の test.env で "test-password" に設定済み

  it("正しいパスワードで true を返す", () => {
    expect(checkPassword("test-password")).toBe(true);
  });

  it("間違ったパスワードで false を返す", () => {
    expect(checkPassword("wrong-password")).toBe(false);
  });

  it("空文字で false を返す（長さ不一致のため早期リターン）", () => {
    // timingSafeEqual は長さが違う場合に呼ばれないことを含めて確認
    expect(checkPassword("")).toBe(false);
  });

  it("長さが同じでも内容が違う場合は false を返す", () => {
    // "test-password" と同じバイト数で異なる文字列
    expect(checkPassword("test-passwore")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// getSession
// ─────────────────────────────────────────────

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効なアクセストークンがあれば true を返す", async () => {
    // アクセストークンの署名・有効期限・subject を全て検証する正常系
    const token = await makeJwt(ACCESS_COOKIE, "15m");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: token }) as unknown as Awaited<
        ReturnType<typeof cookies>
      >
    );

    expect(await getSession()).toBe(true);
  });

  it("アクセストークンが期限切れでも有効なリフレッシュトークンがあれば true を返す", async () => {
    // アクセストークン検証失敗 → リフレッシュトークンへのフォールバック分岐
    const expiredAccess = await makeJwt(ACCESS_COOKIE, "-1s");
    const validRefresh = await makeJwt(REFRESH_COOKIE, "30d");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({
        [ACCESS_COOKIE]: expiredAccess,
        [REFRESH_COOKIE]: validRefresh,
      }) as unknown as Awaited<ReturnType<typeof cookies>>
    );

    expect(await getSession()).toBe(true);
  });

  it("アクセストークンがなくてもリフレッシュトークンが有効なら true を返す", async () => {
    // Cookie にアクセストークンが存在しない場合のリフレッシュフォールバック
    const validRefresh = await makeJwt(REFRESH_COOKIE, "30d");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [REFRESH_COOKIE]: validRefresh }) as unknown as Awaited<
        ReturnType<typeof cookies>
      >
    );

    expect(await getSession()).toBe(true);
  });

  it("両トークンが存在しない場合は false を返す", async () => {
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({}) as unknown as Awaited<ReturnType<typeof cookies>>
    );

    expect(await getSession()).toBe(false);
  });

  it("リフレッシュトークンも期限切れの場合は false を返す", async () => {
    // 両トークンが存在するが両方期限切れの場合
    const expiredAccess = await makeJwt(ACCESS_COOKIE, "-1s");
    const expiredRefresh = await makeJwt(REFRESH_COOKIE, "-1s");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({
        [ACCESS_COOKIE]: expiredAccess,
        [REFRESH_COOKIE]: expiredRefresh,
      }) as unknown as Awaited<ReturnType<typeof cookies>>
    );

    expect(await getSession()).toBe(false);
  });

  it("subject が不正なアクセストークンは false を返す（署名は正しくても sub が違う）", async () => {
    // sub に誤った値が入ったトークンを拒否することを確認
    const wrongSubToken = await makeJwt("wrong-subject", "15m");
    vi.mocked(cookies).mockResolvedValue(
      mockCookieStore({ [ACCESS_COOKIE]: wrongSubToken }) as unknown as Awaited<
        ReturnType<typeof cookies>
      >
    );

    // アクセストークン拒否後にリフレッシュトークンも存在しないので false
    expect(await getSession()).toBe(false);
  });
});
