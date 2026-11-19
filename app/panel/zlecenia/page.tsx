import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { DemoNote, PageHeader, RequestStatusBadge } from "@/components/dashboard/widgets";
import { DemoComposeSheet } from "@/components/dashboard/demo-actions";
import { formatDate, formatPrice } from "@/utils/format";

export default async function RequestsPage() {
  const { provider } = await getCurrentProvider();
  const repo = getRepository();
  const [requests, cities, categories] = await Promise.all([
    repo.listRequests({ categorySlugs: [provider.primaryCategory, ...provider.secondaryCategories] }),
    repo.listCities(),
    repo.listCategories(),
  ]);
  return (
    <>
      <PageHeader title="Zlecenia" description="Zapytania klientów z Twoich kategorii. Odpowiedz z ceną i terminem." />
      <ul className="grid gap-4">
        {requests.map((r) => (
          <li key={r.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-sans text-lg font-semibold tracking-normal">{r.title}</h2>
                <p className="text-sm text-muted">
                  {categories.find((c) => c.slug === r.categorySlug)?.name}, {cities.find((c) => c.slug === r.citySlug)?.name}, dodane {formatDate(r.createdAt)}
                </p>
              </div>
              <RequestStatusBadge status={r.status} />
            </div>
            <p className="mt-3 max-w-[70ch] text-ink-soft">{r.description}</p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
              <div>
                <dt className="text-sm text-muted">Termin</dt>
                <dd className="font-medium">{r.preferredDate}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Budżet</dt>
                <dd className="font-medium">{r.budget ? formatPrice(r.budget) : "Do ustalenia"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Oferty</dt>
                <dd className="font-medium">{r.offersCount}</dd>
              </div>
            </dl>
            {r.status !== "assigned" && r.status !== "closed" ? (
              <div className="mt-5">
                <DemoComposeSheet
                  trigger="Wyślij ofertę"
                  title={r.title}
                  withPrice
                  placeholder="Dzień dobry, mogę przyjechać… Cena obejmuje…"
                  submitLabel="Wyślij ofertę"
                  doneLabel="Oferta wysłana"
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <DemoNote>Wersja demonstracyjna: oferty są zapisywane w tabeli request_offers po podłączeniu Supabase.</DemoNote>
    </>
  );
}
