import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";

export const ACCESS_COOKIE = "clf_access";
export const REFRESH_COOKIE = "clf_refresh";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(serverEnv.SESSION_SECRET);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

async function issueJwt(subject: string, expiresIn: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export function checkPassword(input: string): boolean {
  const password = serverEnv.APP_PASSWORD;
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(password);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch (e) {
    logger.error("[auth] checkPassword failed unexpectedly", e);
    return false;
  }
}

export async function createSession(): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    issueJwt(ACCESS_COOKIE, APP_CONFIG.auth.accessTokenExpiry),
    issueJwt(REFRESH_COOKIE, APP_CONFIG.auth.refreshTokenExpiry),
  ]);
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(APP_CONFIG.auth.accessMaxAge));
  cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(APP_CONFIG.auth.refreshMaxAge));
  logger.info("[auth] session created");
}

// Route Handler から呼ぶ場合は response.cookies に直接セットする
export async function setSessionCookies(res: NextResponse): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    issueJwt(ACCESS_COOKIE, APP_CONFIG.auth.accessTokenExpiry),
    issueJwt(REFRESH_COOKIE, APP_CONFIG.auth.refreshTokenExpiry),
  ]);
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(APP_CONFIG.auth.accessMaxAge));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(APP_CONFIG.auth.refreshMaxAge));
}

export async function destroySession(): Promise<void> {
  logger.debug("[auth] destroying session cookies");
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  logger.debug("[auth] session cookies deleted");
  logger.info("[auth] session destroyed");
}

export async function getSession(): Promise<boolean> {
  logger.debug("[auth] getSession: reading cookies");
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  logger.debug("[auth] getSession: access token present", { present: !!accessToken });
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getSecret());
      if (payload.sub === ACCESS_COOKIE) {
        logger.info("[auth] session valid via access token");
        return true;
      }
      logger.debug("[auth] access token sub mismatch");
    } catch (e) {
      logger.debug("[auth] access token invalid, falling back to refresh token", e);
    }
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  logger.debug("[auth] getSession: refresh token present", { present: !!refreshToken });
  if (!refreshToken) return false;
  try {
    const { payload } = await jwtVerify(refreshToken, getSecret());
    if (payload.sub === REFRESH_COOKIE) {
      logger.info("[auth] session valid via refresh token");
      return true;
    }
    logger.debug("[auth] refresh token sub mismatch");
    return false;
  } catch (e) {
    logger.warn("[auth] refresh token invalid or expired", e);
    return false;
  }
}
