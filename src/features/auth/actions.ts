"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "./lib/auth";
import { PAGE_ROUTES } from "@/lib/routes";

export async function loginAction(
  variant: "user" | "admin",
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password =
    typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const role = checkPassword(password);
  if (!role || role !== variant) {
    return { error: "パスワードが違います" };
  }
  await createSession(role);
  redirect(PAGE_ROUTES.home);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
