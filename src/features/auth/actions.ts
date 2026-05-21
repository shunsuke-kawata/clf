"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession } from "./lib/auth";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  if (!checkPassword(password)) {
    return { error: "パスワードが違います" };
  }
  await createSession();
  redirect("/admin/new");
}
