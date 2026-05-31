import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { LoginForm } from "@/features/auth/components/LoginForm";

function isSafeRedirectPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://")
  );
}

type Props = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const role = await getSession();
  const { redirectTo } = await searchParams;
  const safeRedirectTo = isSafeRedirectPath(redirectTo) ? redirectTo : undefined;

  if (role === "admin") redirect(safeRedirectTo ?? PAGE_ROUTES.home);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <LoginForm variant="admin" redirectTo={safeRedirectTo} />
    </main>
  );
}
