import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-sm">
        <Link
          href={PAGE_ROUTES.home}
          className="hover:bg-muted -ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors"
          aria-label="地図に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold">管理者ログイン</h1>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <LoginForm variant="admin" redirectTo={safeRedirectTo} />
      </main>
    </div>
  );
}
