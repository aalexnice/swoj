import Link from "next/link";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { PageHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/site";

const notifications = [
  ["Nowa rezerwacja", "E-mail i SMS", true],
  ["Nowe zapytanie w mojej kategorii", "E-mail", true],
  ["Nowa opinia", "E-mail", true],
  ["Porady i nowości SWOJ", "E-mail", false],
] as const;

export default async function SettingsPage() {
  const { provider, user } = await getCurrentProvider();
  const plan = plans.find((p) => p.id === provider.plan)!;
  return (
    <>
      <PageHeader title="Ustawienia" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="plan">
          <h2 id="plan" className="text-xl font-semibold">Plan</h2>
          <p className="mt-2 text-ink-soft">
            Aktualny plan: <strong className="text-ink">{plan.name}</strong> — {plan.price} zł / miesiąc
          </p>
          <ul className="mt-3 list-inside list-disc text-[15px] text-ink-soft">
            {plan.features.slice(0, 4).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/cennik">Zmień plan</Link>
          </Button>
          <p className="mt-3 text-sm text-muted">Płatności Stripe zostaną włączone w kolejnej wersji. Obecnie zmiana planu jest symulowana.</p>
        </section>
        <section className="card p-6" aria-labelledby="powiadomienia">
          <h2 id="powiadomienia" className="text-xl font-semibold">Powiadomienia</h2>
          <ul className="mt-4 divide-y divide-line">
            {notifications.map(([label, channel, on]) => (
              <li key={label} className="flex items-center justify-between gap-4 py-3">
                <label htmlFor={label} className="text-[15px]">
                  {label}
                  <span className="block text-sm text-muted">{channel}</span>
                </label>
                <input id={label} type="checkbox" defaultChecked={on} className="size-5 accent-[var(--color-brand-700)]" />
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6" aria-labelledby="konto">
          <h2 id="konto" className="text-xl font-semibold">Konto</h2>
          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted">E-mail</dt><dd>{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Rola</dt><dd>{user.role === "admin" ? "Administrator" : "Specjalista"}</dd></div>
          </dl>
          <form action="/api/auth/logout" method="post" className="mt-5">
            <Button type="submit" variant="secondary">Wyloguj się</Button>
          </form>
        </section>
      </div>
    </>
  );
}
