"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "./lib/auth";
import { PAGE_ROUTES } from "@/lib/routes";

function isSafeRedirectPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://")
  );
}

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
  const redirectTo = formData.get("redirectTo");
  redirect(isSafeRedirectPath(redirectTo) ? redirectTo : PAGE_ROUTES.home);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
