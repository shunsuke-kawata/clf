import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const ACCESS_COOKIE = "clf_access";
export const REFRESH_COOKIE = "clf_refresh";

const ACCESS_MAX_AGE = 60 * 15; // 15分
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30日

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set");
  return new TextEncoder().encode(secret);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD must be set");
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
    issueJwt(ACCESS_COOKIE, "15m"),
    issueJwt(REFRESH_COOKIE, "30d"),
  ]);
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

// Route Handler から呼ぶ場合は response.cookies に直接セットする
export async function setSessionCookies(res: NextResponse): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    issueJwt(ACCESS_COOKIE, "15m"),
    issueJwt(REFRESH_COOKIE, "30d"),
  ]);
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getSecret());
      if (payload.sub === ACCESS_COOKIE) return true;
    } catch (e) {
      logger.debug("[auth] access token invalid, falling back to refresh token", e);
    }
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return false;
  try {
    const { payload } = await jwtVerify(refreshToken, getSecret());
    return payload.sub === REFRESH_COOKIE;
  } catch (e) {
    logger.warn("[auth] refresh token invalid or expired", e);
    return false;
  }
}
