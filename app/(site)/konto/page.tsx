import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, Heart } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getAuthService } from "@/services/auth/auth-service";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({ title: "Moje konto", description: "Twoje rezerwacje i zapytania.", path: "/konto", noIndex: true });

export default async function AccountPage() {
  const user = await getAuthService().getSession();
  if (!user) redirect("/logowanie?next=/konto");
  if (user.role === "provider") redirect("/panel");
  if (user.role === "admin") redirect("/admin");
  return (
    <div className="container-page py-10 sm:py-16">
      <h1 className="text-[34px] font-bold">Cześć, {user.name.split(" ")[0]}</h1>
      <p className="mt-2 text-ink-soft">{user.email}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: CalendarDays, t: "Rezerwacje", d: "Nie masz jeszcze rezerwacji. Znajdź specjalistę i umów termin.", href: "/uslugi", cta: "Znajdź usługę" },
          { icon: ClipboardList, t: "Zapytania", d: "Opisz zadanie, a specjaliści przyślą Ci propozycje.", href: "/zlecenie", cta: "Dodaj zlecenie" },
          { icon: Heart, t: "Ulubieni specjaliści", d: "Zapisuj profile, do których chcesz wrócić.", href: "/specjalisci", cta: "Przeglądaj profile" },
        ].map(({ icon: Icon, t, d, href, cta }) => (
          <div key={t} className="card flex flex-col p-6">
            <Icon className="size-6 text-brand-700" aria-hidden />
            <h2 className="mt-4 font-sans text-lg font-semibold tracking-normal">{t}</h2>
            <p className="mt-1 flex-1 text-ink-soft">{d}</p>
            <Button asChild variant="secondary" className="mt-5 self-start">
              <Link href={href}>{cta}</Link>
            </Button>
          </div>
        ))}
      </div>
      <form action="/api/auth/logout" method="post" className="mt-10">
        <Button type="submit" variant="ghost">Wyloguj się</Button>
      </form>
    </div>
  );
}
