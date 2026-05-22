import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";

const ACCESS_COOKIE = "clf_access";
const REFRESH_COOKIE = "clf_refresh";

export async function POST(req: NextRequest) {
  const secretBytes = new TextEncoder().encode(serverEnv.SESSION_SECRET);
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? "";

  try {
    const { payload } = await jwtVerify(refreshToken, secretBytes);
    if (payload.sub !== REFRESH_COOKIE) throw new Error("Invalid subject");
  } catch (e) {
    logger.warn("[auth/refresh] invalid refresh token", e);
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const newAccessToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ACCESS_COOKIE)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretBytes);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });
  return res;
}
