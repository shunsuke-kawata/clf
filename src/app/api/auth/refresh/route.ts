import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/features/auth/lib/auth";

export async function POST(req: NextRequest) {
  logger.debug("[auth/refresh] request received");
  const secretBytes = new TextEncoder().encode(serverEnv.SESSION_SECRET);
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? "";

  try {
    const { payload } = await jwtVerify(refreshToken, secretBytes);
    if (payload.sub !== REFRESH_COOKIE) throw new Error("Invalid subject");
    logger.debug("[auth/refresh] refresh token verified");
  } catch (e) {
    logger.warn("[auth/refresh] invalid refresh token", e);
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const newAccessToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ACCESS_COOKIE)
    .setIssuedAt()
    .setExpirationTime(APP_CONFIG.auth.accessTokenExpiry)
    .sign(secretBytes);
  logger.debug("[auth/refresh] new access token signed");

  logger.info("[auth/refresh] access token refreshed");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: APP_CONFIG.auth.accessMaxAge,
    path: "/",
  });
  return res;
}
