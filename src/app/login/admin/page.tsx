import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function AdminLoginPage() {
  const role = await getSession();
  if (role === "admin") redirect(PAGE_ROUTES.home);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <LoginForm variant="admin" />
    </main>
  );
}
