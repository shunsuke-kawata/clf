import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const BUCKET = "locker-photos";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const lockerId = formData.get("locker_id");
  const orderIndex = Number(formData.get("order_index") ?? 0);

  if (!(file instanceof File) || typeof lockerId !== "string") {
    return NextResponse.json(
      { error: "file and locker_id are required" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storageKey = `${lockerId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storageKey, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("locker_photos")
    .insert({ locker_id: lockerId, storage_key: storageKey, order_index: orderIndex })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
