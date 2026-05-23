import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";

export const ACCESS_COOKIE = "clf_access";
export const REFRESH_COOKIE = "clf_refresh";
export type SessionRole = "admin" | "user";

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

async function issueJwt(subject: string, role: SessionRole, expiresIn: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

function comparePassword(input: string, stored: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch (e) {
    logger.error("[auth] timingSafeEqual failed unexpectedly", e);
    return false;
  }
}

export function checkPassword(input: string): SessionRole | null {
  if (serverEnv.ADMIN_PASSWORD && comparePassword(input, serverEnv.ADMIN_PASSWORD)) return "admin";
  if (comparePassword(input, serverEnv.APP_PASSWORD)) return "user";
  return null;
}

export async function createSession(role: SessionRole): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    issueJwt(ACCESS_COOKIE, role, APP_CONFIG.auth.accessTokenExpiry),
    issueJwt(REFRESH_COOKIE, role, APP_CONFIG.auth.refreshTokenExpiry),
  ]);
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(APP_CONFIG.auth.accessMaxAge));
  cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(APP_CONFIG.auth.refreshMaxAge));
  logger.info("[auth] session created", { role });
}

export async function setSessionCookies(res: NextResponse, role: SessionRole): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    issueJwt(ACCESS_COOKIE, role, APP_CONFIG.auth.accessTokenExpiry),
    issueJwt(REFRESH_COOKIE, role, APP_CONFIG.auth.refreshTokenExpiry),
  ]);
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(APP_CONFIG.auth.accessMaxAge));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(APP_CONFIG.auth.refreshMaxAge));
}

export async function destroySession(): Promise<void> {
  logger.debug("[auth] destroying session cookies");
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  logger.info("[auth] session destroyed");
}

type CookieGetter = { get(name: string): { value: string } | undefined };

function extractRole(payload: Record<string, unknown>): SessionRole {
  return payload["role"] === "admin" ? "admin" : "user";
}

async function tryVerifyJwt(token: string, expectedSub: string): Promise<SessionRole | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.sub !== expectedSub) return null;
    return extractRole(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function verifySessionCookies(store: CookieGetter): Promise<SessionRole | null> {
  logger.debug("[auth] verifySessionCookies: reading cookies");

  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const role = await tryVerifyJwt(accessToken, ACCESS_COOKIE);
    if (role !== null) {
      logger.info("[auth] session valid via access token");
      return role;
    }
    logger.debug("[auth] access token invalid, falling back to refresh token");
  }

  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const role = await tryVerifyJwt(refreshToken, REFRESH_COOKIE);
  if (role !== null) {
    logger.info("[auth] session valid via refresh token");
    return role;
  }

  logger.warn("[auth] both tokens invalid or expired");
  return null;
}

export async function getSession(): Promise<SessionRole | null> {
  return verifySessionCookies(await cookies());
}

export async function getSessionRole(req: NextRequest): Promise<SessionRole | null> {
  return verifySessionCookies(req.cookies);
}
