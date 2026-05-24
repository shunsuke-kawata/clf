import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";

function sign(id: string): string {
  return createHmac("sha256", serverEnv.SESSION_SECRET).update(id).digest("hex");
}

export function createSearchSession(): { cookieValue: string; sessionId: string } {
  const sessionId = randomUUID();
  return { cookieValue: `${sessionId}.${sign(sessionId)}`, sessionId };
}

export function verifySearchSession(cookieValue: string): string | null {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) {
    logger.warn("[search-session] cookie missing separator");
    return null;
  }
  const sessionId = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const expected = sign(sessionId);

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) {
    logger.warn("[search-session] signature length mismatch");
    return null;
  }
  try {
    return timingSafeEqual(a, b) ? sessionId : null;
  } catch (e) {
    logger.error("[search-session] timingSafeEqual failed", e);
    return null;
  }
}

export function searchSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: APP_CONFIG.searchHistory.cookieMaxAge,
    path: "/",
  };
}

export function readSessionFromRequest(req: NextRequest): { sessionId: string | null; isNew: boolean } {
  const cookieValue = req.cookies.get(APP_CONFIG.searchHistory.cookieName)?.value;
  if (cookieValue) {
    const sessionId = verifySearchSession(cookieValue);
    if (sessionId) return { sessionId, isNew: false };
    logger.warn("[search-session] invalid cookie, issuing new session");
  }
  return { sessionId: null, isNew: true };
}
