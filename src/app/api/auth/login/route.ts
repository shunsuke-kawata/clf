import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setSessionCookies } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  logger.debug("[auth/login] request received");
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  logger.debug("[auth/login] password extracted, verifying");

  if (!checkPassword(password)) {
    logger.warn("[auth/login] invalid password attempt");
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  logger.debug("[auth/login] password ok, issuing session cookies");
  const res = NextResponse.json({ ok: true });
  await setSessionCookies(res);
  logger.info("[auth/login] session issued");
  return res;
}
