import { NextResponse } from "next/server";
import { destroySession } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";
import { PAGE_ROUTES } from "@/lib/routes";

export async function POST(req: Request) {
  logger.debug("[auth/logout] request received");
  await destroySession();
  logger.info("[auth/logout] session destroyed");
  return NextResponse.redirect(new URL(PAGE_ROUTES.home, req.url), 303);
}
