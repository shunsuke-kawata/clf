import { NextResponse } from "next/server";
import { destroySession } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  logger.debug("[auth/logout] request received");
  await destroySession();
  logger.info("[auth/logout] session destroyed");
  return NextResponse.json({ ok: true });
}
