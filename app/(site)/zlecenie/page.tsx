import { getRepository } from "@/services/data";
import { buildMetadata } from "@/lib/seo";
import { RequestForm } from "@/features/request/request-form";

export const metadata = buildMetadata({
  title: "Dodaj zlecenie — otrzymaj oferty od specjalistów",
  description: "Opisz nietypowe zadanie, dodaj zdjęcia i budżet. Specjaliści z Twojej okolicy wyślą propozycje z ceną i terminem.",
  path: "/zlecenie",
});

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function RequestPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const repo = getRepository();
  const [categories, cities] = await Promise.all([repo.listCategories(), repo.listCities()]);
  const providerSlug = one(sp.specjalista);
  const provider = providerSlug ? await repo.getProviderProfile(providerSlug) : null;
  const categorySlug = one(sp.kategoria);
  const citySlug = one(sp.miasto);

  return (
    <div className="container-page pb-16 pt-8 sm:pt-12">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.05] sm:text-[44px]">Czego potrzebujesz?</h1>
          <p className="mb-8 mt-3 max-w-xl text-lg text-ink-soft">
            Opisz zadanie, którego nie da się zarezerwować jednym kliknięciem. Specjaliści z okolicy odpowiedzą z wyceną i terminem.
          </p>
          <RequestForm
            categories={categories}
            cities={cities}
            defaults={{
              categorySlug: categories.some((c) => c.slug === categorySlug) ? categorySlug : undefined,
              citySlug: cities.some((c) => c.slug === citySlug) ? citySlug : provider?.citySlug,
            }}
            targetProvider={provider ? { name: `${provider.firstName} ${provider.lastName}`, slug: provider.slug } : null}
          />
        </div>
        <aside className="lg:pt-24">
          <div className="rounded-3xl bg-brand-50 p-6">
            <h2 className="font-sans text-lg font-semibold tracking-normal">Co dalej?</h2>
            <ol className="mt-4 space-y-4 text-[15px]">
              {[
                ["Wysyłasz opis", "Bez rejestracji, wystarczy e-mail."],
                ["Specjaliści odpowiadają", "Zwykle w ciągu kilku godzin, z ceną i terminem."],
                ["Wybierasz najlepszą ofertę", "Porównujesz profile, opinie i ceny."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-medium">{t}</span>
                    <span className="text-ink-soft">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
