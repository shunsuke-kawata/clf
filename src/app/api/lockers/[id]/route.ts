import { NextRequest, NextResponse } from "next/server";
import { supabaseReader, supabaseAdmin } from "@/lib/supabase/server";
import { lockerSchema } from "@/features/locker/schemas/locker";
import { getSessionRole } from "@/features/auth/lib/auth";
import { APP_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { withHeaders, NO_STORE_HEADERS } from "@/lib/api-headers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  logger.debug("[lockers] get: querying DB", { id });

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
    return withHeaders(NextResponse.json({ error: error.message }, { status }), NO_STORE_HEADERS);
  }

  logger.debug("[lockers] get: DB returned", { id, photoCount: data.locker_photos?.length ?? 0 });
  logger.info("[lockers] get ok", { id });
  return withHeaders(NextResponse.json(data), NO_STORE_HEADERS);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const role = await getSessionRole(req);
  if (!role) {
    logger.warn("[lockers] update: unauthorized");
    return withHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), NO_STORE_HEADERS);
  }

  const { id } = await params;
  logger.debug("[lockers] update: parsing request body", { id });
  const body = await req.json().catch(() => null);
  const parsed = lockerSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("[lockers] update validation failed", { id, error: parsed.error.flatten() });
    return withHeaders(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }), NO_STORE_HEADERS);
  }

  logger.debug("[lockers] update: validation ok, updating DB", { id });
  const { data, error } = await supabaseAdmin
    .from("lockers")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("[lockers] update failed", { id, error });
    return withHeaders(NextResponse.json({ error: error.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.debug("[lockers] update: DB update ok", { id });
  logger.info("[lockers] updated", { id });
  return withHeaders(NextResponse.json(data), NO_STORE_HEADERS);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const role = await getSessionRole(req);
  if (!role) {
    logger.warn("[lockers] delete: unauthorized");
    return withHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), NO_STORE_HEADERS);
  }
  if (role !== "admin") {
    logger.warn("[lockers] delete: forbidden (not admin)");
    return withHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }), NO_STORE_HEADERS);
  }

  const { id } = await params;
  logger.debug("[lockers] delete: fetching photo keys", { id });

  const { data: photos } = await supabaseAdmin
    .from("locker_photos")
    .select("storage_key")
    .eq("locker_id", id);

  if (photos && photos.length > 0) {
    const keys = photos.map((p: { storage_key: string }) => p.storage_key);
    const { error: storageError } = await supabaseAdmin.storage
      .from(APP_CONFIG.photo.bucket)
      .remove(keys);
    if (storageError) {
      logger.error("[lockers] delete: storage removal failed", { id, error: storageError });
    } else {
      logger.debug("[lockers] delete: storage files removed", { id, count: keys.length });
    }
  }

  logger.debug("[lockers] delete: deleting from DB", { id });
  const { error } = await supabaseAdmin.from("lockers").delete().eq("id", id);

  if (error) {
    logger.error("[lockers] delete failed", { id, error });
    return withHeaders(NextResponse.json({ error: error.message }, { status: 500 }), NO_STORE_HEADERS);
  }

  logger.info("[lockers] deleted", { id });
  return withHeaders(new NextResponse(null, { status: 204 }), NO_STORE_HEADERS);
}
