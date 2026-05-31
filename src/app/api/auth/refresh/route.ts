import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";
import { ACCESS_COOKIE, REFRESH_COOKIE, type SessionRole } from "@/features/auth/lib/auth";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

export async function POST(req: NextRequest) {
  logger.debug("[auth/refresh] request received");
  const secretBytes = new TextEncoder().encode(serverEnv.SESSION_SECRET);
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? "";

  let role: SessionRole = "user";
  try {
    const { payload } = await jwtVerify(refreshToken, secretBytes);
    if (payload.sub !== REFRESH_COOKIE) throw new Error("Invalid subject");
    role = payload["role"] === "admin" ? "admin" : "user";
    logger.debug("[auth/refresh] refresh token verified", { role });
  } catch (e) {
    logger.warn("[auth/refresh] invalid refresh token", e);
    return withHeaders(
      NextResponse.json({ error: "Invalid refresh token" }, { status: 401 }),
      NO_STORE_HEADERS
    );
  }

  const newAccessToken = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ACCESS_COOKIE)
    .setIssuedAt()
    .setExpirationTime(APP_CONFIG.auth.accessTokenExpiry)
    .sign(secretBytes);
  logger.debug("[auth/refresh] new access token signed");

  logger.info("[auth/refresh] access token refreshed", { role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: APP_CONFIG.auth.accessMaxAge,
    path: "/",
  });
  return withHeaders(res, NO_STORE_HEADERS);
}
