import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

const BUCKET = "locker-photos";

async function ensureBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const lockerId = formData.get("locker_id");
  const orderIndex = Number(formData.get("order_index") ?? 0);

  if (!(file instanceof File) || typeof lockerId !== "string" || !lockerId) {
    return NextResponse.json(
      { error: "file and locker_id are required" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storageKey = `${lockerId}/${randomUUID()}.${ext}`;

  let { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storageKey, file, { contentType: file.type });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      try {
        await ensureBucket();
        const retry = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(storageKey, file, { contentType: file.type });
        uploadError = retry.error;
      } catch (e) {
        logger.error("[photos] bucket creation failed", e);
        return NextResponse.json({ error: "Storage bucket setup failed" }, { status: 500 });
      }
    }
  }

  if (uploadError) {
    logger.error("[photos] upload error", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("locker_photos")
    .insert({ locker_id: lockerId, storage_key: storageKey, order_index: orderIndex })
    .select()
    .single();

  if (dbError) {
    logger.error("[photos] db error", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
