import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setSessionCookies } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  logger.debug("[auth/login] request received");
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  logger.debug("[auth/login] password extracted, verifying");

  const role = checkPassword(password);
  if (!role) {
    logger.warn("[auth/login] invalid password attempt");
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  logger.debug("[auth/login] password ok, issuing session cookies", { role });
  const res = NextResponse.json({ ok: true, role });
  await setSessionCookies(res, role);
  logger.info("[auth/login] session issued", { role });
  return res;
}
