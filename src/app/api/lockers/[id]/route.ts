import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/lib/schemas/locker";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseReader
    .from("lockers")
    .select(
      "id, name, lat, lng, note, pricing, created_at, updated_at, locker_photos(id, storage_key, order_index)"
    )
    .eq("id", id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = lockerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("lockers")
    .update({ ...parsed.data, name: parsed.data.name || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("lockers")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
