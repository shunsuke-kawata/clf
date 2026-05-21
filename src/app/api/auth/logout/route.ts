import { NextResponse } from "next/server";
import { destroySession } from "@/features/auth/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
