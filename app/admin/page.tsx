import { getRepository } from "@/services/data";
import { PageHeader, StatCard } from "@/components/dashboard/widgets";
import { formatPrice } from "@/utils/format";

export default async function AdminDashboard() {
  const repo = getRepository();
  const [stats, cityCounts, cities, active] = await Promise.all([
    repo.getPlatformStats(),
    repo.countProvidersByCity(),
    repo.listCities(),
    repo.searchProviders({}),
  ]);
  const all = active.total;
  const topCities = [...cities].sort((a, b) => (cityCounts[b.slug] ?? 0) - (cityCounts[a.slug] ?? 0)).slice(0, 8);
  const maxCity = Math.max(...topCities.map((c) => cityCounts[c.slug] ?? 0), 1);

  return (
    <>
      <PageHeader title="Statystyki" description="Województwo śląskie — dane demonstracyjne." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Użytkownicy" value={stats.users.toLocaleString("pl-PL")} accent />
        <StatCard label="Specjaliści" value={String(stats.providers)} hint={`${stats.verifiedProviders} zweryfikowanych`} />
        <StatCard label="Usługi w cennikach" value={String(stats.services)} />
        <StatCard label="Rezerwacje" value={String(stats.bookings)} />
        <StatCard label="Otwarte zlecenia" value={String(stats.openRequests)} />
        <StatCard label="Opinie" value={String(stats.reviews)} />
        <StatCard label="Wartość rezerwacji" value={formatPrice(stats.gmv)} />
        <StatCard label="Aktywne profile" value={String(all)} hint="widoczne w wyszukiwarce" />
      </div>
      <section className="card mt-8 p-6" aria-labelledby="miasta">
        <h2 id="miasta" className="text-xl font-semibold">Dostępność specjalistów wg miast</h2>
        <ul className="mt-5 space-y-3">
          {topCities.map((c) => (
            <li key={c.slug} className="grid grid-cols-[140px_1fr_40px] items-center gap-3 text-[15px]">
              <span>{c.name}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-sunken">
                <span className="block h-full rounded-full bg-brand-600" style={{ width: `${((cityCounts[c.slug] ?? 0) / maxCity) * 100}%` }} />
              </span>
              <span className="text-right font-medium">{cityCounts[c.slug] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
