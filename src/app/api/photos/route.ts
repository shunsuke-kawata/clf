import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { APP_CONFIG } from "@/lib/config";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

const BUCKET = APP_CONFIG.photo.bucket;

async function ensureBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: APP_CONFIG.photo.maxFileSizeBytes,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function POST(req: NextRequest) {
  logger.debug("[photos] request received");
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return withHeaders(NextResponse.json({ error: "Invalid form data" }, { status: 400 }), NO_STORE_HEADERS);
  }

  const file = formData.get("file");
  const lockerId = formData.get("locker_id");
  const orderIndex = Number(formData.get("order_index") ?? 0);

  if (!(file instanceof File) || typeof lockerId !== "string" || !lockerId) {
    return withHeaders(
      NextResponse.json({ error: "file and locker_id are required" }, { status: 400 }),
      NO_STORE_HEADERS
    );
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = APP_CONFIG.photo.allowedExtensions.includes(rawExt) ? rawExt : "jpg";
  const storageKey = `${lockerId}/${randomUUID()}.${ext}`;
  const contentType = file.type || "image/jpeg";
  logger.debug("[photos] file parsed", { lockerId, ext, size: file.size, contentType });

  logger.debug("[photos] uploading to storage", { storageKey });
  let { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storageKey, file, { contentType });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      logger.debug("[photos] bucket not found, creating bucket");
      try {
        await ensureBucket();
        const retry = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(storageKey, file, { contentType });
        uploadError = retry.error;
        logger.debug("[photos] retry upload after bucket creation", { ok: !retry.error });
      } catch (e) {
        logger.error("[photos] bucket creation failed", e);
        return withHeaders(
          NextResponse.json({ error: "Storage bucket setup failed" }, { status: 500 }),
          NO_STORE_HEADERS
        );
      }
    }
  }

  if (uploadError) {
    logger.error("[photos] upload error", uploadError);
    return withHeaders(NextResponse.json({ error: uploadError.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.debug("[photos] storage upload ok, inserting to DB", { storageKey });
  const { data, error: dbError } = await supabaseAdmin
    .from("locker_photos")
    .insert({ locker_id: lockerId, storage_key: storageKey, order_index: orderIndex })
    .select()
    .single();

  if (dbError) {
    logger.error("[photos] db error", dbError);
    return withHeaders(NextResponse.json({ error: dbError.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.debug("[photos] DB insert ok", { id: data.id });
  logger.info("[photos] uploaded", { id: data.id, lockerId, storageKey });
  return withHeaders(NextResponse.json(data, { status: 201 }), NO_STORE_HEADERS);
}
