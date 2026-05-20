import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/lib/schemas/locker";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseReader
    .from("lockers")
    .select(
      "id, lat, lng, note, pricing, created_at, updated_at, locker_photos(id, storage_key, order_index)"
    )
    .eq("id", id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    if (status === 500) logger.error("[lockers] get failed", { id, error });
    else logger.debug("[lockers] not found", { id });
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = lockerSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("[lockers] update validation failed", { id, error: parsed.error.flatten() });
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("lockers")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("[lockers] update failed", { id, error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("[lockers] updated", { id });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("lockers")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error("[lockers] delete failed", { id, error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("[lockers] deleted", { id });
  return new NextResponse(null, { status: 204 });
}
