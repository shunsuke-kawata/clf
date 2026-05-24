import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/features/locker/schemas/locker";
import { getSessionRole } from "@/features/auth/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  logger.debug("[lockers] list: querying DB");
  const { data, error } = await supabaseReader
    .from("lockers")
    .select("id, lat, lng, note, pricing, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[lockers] list failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.debug("[lockers] list: DB returned", { count: data?.length ?? 0 });
  logger.info("[lockers] list ok", { count: data?.length ?? 0 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const role = await getSessionRole(req);
  if (!role) {
    logger.warn("[lockers] create: unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.debug("[lockers] create: parsing request body");
  const body = await req.json().catch(() => null);
  const parsed = lockerSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("[lockers] create validation failed", parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  logger.debug("[lockers] create: validation ok, inserting to DB", {
    lat: parsed.data.lat,
    lng: parsed.data.lng,
  });
  const { data, error } = await supabaseAdmin.from("lockers").insert(parsed.data).select().single();

  if (error) {
    logger.error("[lockers] create failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.debug("[lockers] create: DB insert ok", { id: data.id });
  logger.info("[lockers] created", { id: data.id });
  return NextResponse.json(data, { status: 201 });
}
