import { NextResponse } from "next/server";
import { destroySession } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  await destroySession();
  logger.info("[auth/logout] session destroyed");
  return NextResponse.json({ ok: true });
}
