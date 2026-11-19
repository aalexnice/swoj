import type { Metadata } from "next";
import { getRepository } from "@/services/data";
import { parseSearchParams, type RawSearchParams } from "@/features/search/search-params";
import { SearchResultsView } from "@/components/search/search-results-view";

export const metadata: Metadata = {
  title: "Znajdź specjalistę na Śląsku",
  description: "Porównaj specjalistów z Twojej okolicy: opinie, ceny „od” i wolne terminy. Elektrycy, hydraulicy, sprzątanie, montaż mebli i więcej.",
  alternates: { canonical: "/uslugi" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseSearchParams(await searchParams);
  const repo = getRepository();
  const [result, categories, cities] = await Promise.all([repo.searchProviders(params), repo.listCategories(), repo.listCities()]);
  const category = categories.find((c) => c.slug === (params.category ?? result.interpretedQuery?.categorySlug));
  const city = cities.find((c) => c.slug === (params.city ?? result.interpretedQuery?.citySlug));
  const title = category
    ? `${category.seoPlural}${city ? ` ${city.locative}` : " na Śląsku"}`
    : params.q
      ? `Wyniki dla „${params.q}”`
      : `Specjaliści${city ? ` ${city.locative}` : " na Śląsku"}`;
  return <SearchResultsView title={title} params={params} result={result} categories={categories} cities={cities} />;
}
