import Link from "next/link";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/env";
import { DEMO_PASSWORD, demoAccounts, getAuthService, isDemoAuth } from "@/services/auth/auth-service";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = buildMetadata({ title: "Zaloguj się", description: "Zaloguj się do SWOJ.", path: "/logowanie", noIndex: true });

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getAuthService().getSession();
  if (user) redirect(user.role === "admin" ? "/admin" : user.role === "provider" ? "/panel" : "/konto");
  const demo = isDemoAuth();
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-[34px] font-bold">Zaloguj się</h1>
        <p className="mb-8 mt-2 text-ink-soft">
          Nie masz konta? <Link href="/zaloz-profil" className="font-medium text-brand-700 hover:underline">Załóż profil specjalisty</Link>
        </p>
        <LoginForm
          demoAccounts={demo ? demoAccounts.map(({ email, name, description }) => ({ email, name, description })) : []}
          demoPassword={demo ? DEMO_PASSWORD : null}
          next={next}
          googleEnabled={!demo && isSupabaseConfigured}
        />
      </div>
    </div>
  );
}
