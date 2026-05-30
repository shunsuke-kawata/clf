import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setSessionCookies } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

export async function POST(req: NextRequest) {
  logger.debug("[auth/login] request received");
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  logger.debug("[auth/login] password extracted, verifying");

  const role = checkPassword(password);
  if (!role) {
    logger.warn("[auth/login] invalid password attempt");
    return withHeaders(
      NextResponse.json({ error: "Invalid password" }, { status: 401 }),
      NO_STORE_HEADERS
    );
  }

  logger.debug("[auth/login] password ok, issuing session cookies", { role });
  const res = NextResponse.json({ ok: true, role });
  await setSessionCookies(res, role);
  logger.info("[auth/login] session issued", { role });
  return withHeaders(res, NO_STORE_HEADERS);
}
