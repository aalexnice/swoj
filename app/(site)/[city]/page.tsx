import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/services/data";
import { cities } from "@/data/cities";
import { buildMetadata } from "@/lib/seo";
import { countLabel } from "@/utils/format";
import { Breadcrumbs } from "@/components/seo/landing";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ProviderCard } from "@/components/providers/provider-card";
import { HeroSearch } from "@/components/search/hero-search";

export const dynamicParams = false;

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const city = await getRepository().getCity((await params).city);
  if (!city) return {};
  return buildMetadata({
    title: `Usługi ${city.locative} — sprawdzeni specjaliści`,
    description: `Elektrycy, hydraulicy, sprzątanie, montaż mebli i więcej ${city.locative}. Opinie, ceny i wolne terminy specjalistów z okolicy.`,
    path: `/${city.slug}`,
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const repo = getRepository();
  const city = await repo.getCity((await params).city);
  if (!city) notFound();
  const [stats, featured] = await Promise.all([repo.getCityCategoryStats(city.slug), repo.searchProviders({ city: city.slug })]);

  return (
    <div className="container-page pb-10 pt-6 sm:pt-10">
      <Breadcrumbs items={[{ href: "/", label: "SWOJ" }, { href: `/${city.slug}`, label: city.name }]} />
      <h1 className="mt-5 max-w-3xl text-[34px] font-bold leading-[1.05] sm:text-[52px]">Specjaliści {city.locative}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        {countLabel(featured.total, ["osoba", "osoby", "osób"])} z okolicy może przyjechać do Ciebie. Wybierz usługę albo opisz, czego potrzebujesz.
      </p>
      <div className="mt-6 max-w-4xl">
        <HeroSearch defaultCity={city.name} compact />
      </div>

      <section className="mt-12" aria-labelledby="uslugi">
        <h2 id="uslugi" className="text-2xl font-semibold">
          Usługi {city.locative}
        </h2>
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ category, providerCount }) => (
            <li key={category.slug}>
              <Link
                href={`/${city.slug}/${category.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{category.name}</span>
                  <span className="text-sm text-muted">
                    {providerCount ? countLabel(providerCount, ["specjalista", "specjaliści", "specjalistów"]) : "Wyślij zapytanie"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="polecani">
        <h2 id="polecani" className="text-2xl font-semibold">
          Najlepiej oceniani {city.locative} i okolicy
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.providers.slice(0, 6).map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
