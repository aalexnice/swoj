import type { Metadata } from "next";
import { getRepository } from "@/services/data";
import { parseSearchParams, type RawSearchParams } from "@/features/search/search-params";
import { SearchResultsView } from "@/components/search/search-results-view";

export const metadata: Metadata = {
  title: "Specjaliści na Śląsku",
  description: "Zweryfikowani specjaliści z województwa śląskiego — profile, doświadczenie, opinie i ceny.",
  alternates: { canonical: "/specjalisci" },
};

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseSearchParams(await searchParams);
  const repo = getRepository();
  const [result, categories, cities] = await Promise.all([repo.searchProviders(params), repo.listCategories(), repo.listCities()]);
  return <SearchResultsView title="Specjaliści na Śląsku" params={params} result={result} categories={categories} cities={cities} />;
}
