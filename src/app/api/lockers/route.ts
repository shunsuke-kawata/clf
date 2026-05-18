import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/lib/schemas/locker";

export async function GET() {
  const { data, error } = await supabaseReader
    .from("lockers")
    .select("id, name, lat, lng, note, pricing, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
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
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
