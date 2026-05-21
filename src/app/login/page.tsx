import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/lib/auth";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/admin/new");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
