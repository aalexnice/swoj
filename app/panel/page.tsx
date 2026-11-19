import Link from "next/link";
import { ArrowUpRight, CircleCheck, CircleDashed } from "lucide-react";
import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { BookingStatusBadge, PageHeader, RequestStatusBadge, StatCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { isoDayFromToday } from "@/utils/dates";
import { countLabel, formatPrice, formatRating, formatShortDate } from "@/utils/format";

export default async function PanelDashboard() {
  const { provider } = await getCurrentProvider();
  const repo = getRepository();
  const [requests, bookings, cities] = await Promise.all([
    repo.listRequests({ categorySlugs: [provider.primaryCategory, ...provider.secondaryCategories] }),
    repo.listBookings({ providerId: provider.id }),
    repo.listCities(),
  ]);
  const today = isoDayFromToday();
  const upcoming = bookings.filter((b) => b.date >= today && (b.status === "pending" || b.status === "confirmed"));
  const newRequests = requests.filter((r) => r.status === "open" || r.status === "offers");
  const monthAgo = isoDayFromToday(-30);
  const revenue = bookings.filter((b) => b.status === "completed" && b.date >= monthAgo).reduce((s, b) => s + b.total, 0);
  const serviceName = (id: string) => provider.services.find((s) => s.id === id)?.name ?? "Usługa";
  const cityName = (slug: string) => cities.find((c) => c.slug === slug)?.name ?? slug;

  const checklist = [
    { done: true, label: "Zdjęcie i opis profilu" },
    { done: provider.services.length >= 3, label: "Co najmniej 3 usługi w cenniku" },
    { done: provider.portfolio.length >= 4, label: "4 realizacje w portfolio" },
    { done: provider.verified, label: "Weryfikacja tożsamości" },
    { done: provider.certificates.length > 0, label: "Certyfikaty i uprawnienia" },
  ];
  const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <>
      <PageHeader
        title={`Dzień dobry, ${provider.firstName}`}
        description={`Masz ${countLabel(upcoming.length, ["nadchodzącą rezerwację", "nadchodzące rezerwacje", "nadchodzących rezerwacji"])} i ${countLabel(newRequests.length, ["nowe zapytanie", "nowe zapytania", "nowych zapytań"])}.`}
        action={
          <Button asChild variant="secondary">
            <Link href={`/specjalista/${provider.slug}`}>
              Zobacz swój profil <ArrowUpRight />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Nowe zapytania" value={String(newRequests.length)} hint="w Twoich kategoriach" accent />
        <StatCard label="Nadchodzące rezerwacje" value={String(upcoming.length)} hint={`${upcoming.filter((b) => b.status === "pending").length} do potwierdzenia`} />
        <StatCard label="Ocena" value={formatRating(provider.ratingAvg)} hint={countLabel(provider.reviewCount, ["opinia", "opinie", "opinii"])} />
        <StatCard label="Liczba usług" value={String(provider.completedJobs)} hint="zrealizowanych przez SWOJ" />
        <StatCard label="Przychód" value={formatPrice(revenue)} hint="ostatnie 30 dni" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="nadchodzace">
          <div className="flex items-center justify-between">
            <h2 id="nadchodzace" className="text-xl font-semibold">Nadchodzące rezerwacje</h2>
            <Link href="/panel/rezerwacje" className="text-sm font-medium text-brand-700 hover:underline">Wszystkie</Link>
          </div>
          {upcoming.length ? (
            <ul className="mt-4 divide-y divide-line">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-semibold first-letter:uppercase">{formatShortDate(b.date)}</p>
                    <p className="text-sm text-muted">{b.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{serviceName(b.serviceId)}</p>
                    <p className="truncate text-sm text-muted">{b.clientName}, {b.address}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-ink-soft">Brak nadchodzących wizyt. Uzupełnij dostępność, żeby klienci mogli rezerwować terminy.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="zapytania">
          <div className="flex items-center justify-between">
            <h2 id="zapytania" className="text-xl font-semibold">Nowe zapytania</h2>
            <Link href="/panel/zlecenia" className="text-sm font-medium text-brand-700 hover:underline">Wszystkie</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {newRequests.slice(0, 4).map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{r.title}</p>
                  <RequestStatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {cityName(r.citySlug)}{r.budget ? `, budżet ${formatPrice(r.budget)}` : ""}, termin: {r.preferredDate}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="kompletnosc">
          <h2 id="kompletnosc" className="text-xl font-semibold">Profil uzupełniony w {completeness}%</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${completeness}%` }} />
          </div>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5">
                {c.done ? <CircleCheck className="size-5 text-brand-600" aria-hidden /> : <CircleDashed className="size-5 text-muted" aria-hidden />}
                <span className={c.done ? "text-ink-soft line-through decoration-line-strong" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl bg-brand-50 p-5 sm:p-6" aria-labelledby="plan">
          <h2 id="plan" className="text-xl font-semibold">Twój plan: {provider.plan === "free" ? "Free" : provider.plan === "pro" ? "PRO" : "PRO+"}</h2>
          <p className="mt-2 text-ink-soft">
            {provider.plan === "pro_plus"
              ? "Masz wyróżnienie w wynikach w swoim mieście i nielimitowane odpowiedzi na zapytania."
              : "Z planem PRO+ Twój profil pojawi się wyżej w wynikach w Twoim mieście, a odpowiedzi na zapytania będą nielimitowane."}
          </p>
          <Button asChild variant={provider.plan === "pro_plus" ? "secondary" : "primary"} className="mt-5">
            <Link href={provider.plan === "pro_plus" ? "/panel/ustawienia" : "/cennik"}>{provider.plan === "pro_plus" ? "Zarządzaj planem" : "Porównaj plany"}</Link>
          </Button>
        </section>
      </div>
    </>
  );
}
