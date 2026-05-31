import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "@/lib/env";

const ACCESS_COOKIE = "clf_access";
const REFRESH_COOKIE = "clf_refresh";
const ACCESS_MAX_AGE = 60 * 15; // 15分

function getSecret(): Uint8Array {
  return new TextEncoder().encode(serverEnv.SESSION_SECRET);
}

async function verifyToken(token: string, subject: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub === subject;
  } catch {
    return false;
  }
}

async function issueAccessToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ACCESS_COOKIE)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isWriteApi =
    (pathname.startsWith("/api/lockers") || pathname.startsWith("/api/photos")) &&
    ["POST", "PUT", "DELETE"].includes(req.method);
  const isProtectedPage =
    pathname.startsWith("/admin") ||
    pathname === "/new" ||
    /^\/lockers\/[^/]+\/edit$/.test(pathname);
  const isProtected = isProtectedPage || isWriteApi;

  if (!isProtected) return NextResponse.next();

  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value ?? "";
  if (await verifyToken(accessToken, ACCESS_COOKIE)) {
    return NextResponse.next();
  }

  // アクセストークン期限切れ → リフレッシュトークンで透過的に更新
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? "";
  if (await verifyToken(refreshToken, REFRESH_COOKIE)) {
    const newAccessToken = await issueAccessToken();
    const response = NextResponse.next();
    response.cookies.set(ACCESS_COOKIE, newAccessToken, {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: ACCESS_MAX_AGE,
      path: "/",
    });
    return response;
  }

  // 両トークンとも無効
  if (isWriteApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/new", "/lockers/:id/edit", "/api/lockers/:path*", "/api/photos/:path*"],
};
