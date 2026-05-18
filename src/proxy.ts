import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "clf_session";
const encoder = new TextEncoder();

async function hmacHex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(signed: string, secret: string): Promise<boolean> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;

  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = await hmacHex(value, secret);

  if (sig.length !== expected.length) return false;

  // 定数時間比較（HEX文字列をcharCodeで比較）
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function proxy(req: NextRequest) {
  const secret = process.env.SESSION_SECRET ?? "";
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const authenticated = secret ? await verify(token, secret) : false;

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!authenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const isWriteApi =
    pathname.startsWith("/api/lockers") || pathname.startsWith("/api/photos");
  const isWriteMethod = ["POST", "PUT", "DELETE"].includes(req.method);

  if (isWriteApi && isWriteMethod && !authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/lockers/:path*", "/api/photos/:path*"],
};
