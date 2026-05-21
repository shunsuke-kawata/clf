import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/features/locker/schemas/locker";
import { logger } from "@/lib/logger";

export async function GET() {
  const { data, error } = await supabaseReader
    .from("lockers")
    .select("id, lat, lng, note, pricing, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[lockers] list failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.debug("[lockers] list ok", { count: data?.length ?? 0 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = lockerSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("[lockers] create validation failed", parsed.error.flatten());
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("lockers")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    logger.error("[lockers] create failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("[lockers] created", { id: data.id });
  return NextResponse.json(data, { status: 201 });
}
