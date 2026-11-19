import { notFound } from "next/navigation";
import { getRepository } from "@/services/data";
import { categories } from "@/data/categories";
import { cities } from "@/data/cities";
import { buildMetadata } from "@/lib/seo";
import { CategoryLanding } from "@/components/seo/landing";

export const dynamicParams = false;

export function generateStaticParams() {
  return cities.flatMap((city) => categories.map((category) => ({ city: city.slug, category: category.slug })));
}

type Params = Promise<{ city: string; category: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { city: citySlug, category: categorySlug } = await params;
  const repo = getRepository();
  const [city, category] = await Promise.all([repo.getCity(citySlug), repo.getCategory(categorySlug)]);
  if (!city || !category) return {};
  return buildMetadata({
    title: `${category.seoPlural} ${city.locative} — opinie, ceny, terminy`,
    description: `${category.seoPlural} ${city.locative}: sprawdzone profile, prawdziwe opinie, ceny „od” i wolne terminy. Zarezerwuj online lub wyślij zapytanie.`,
    path: `/${city.slug}/${category.slug}`,
  });
}

export default async function CityCategoryPage({ params }: { params: Params }) {
  const { city: citySlug, category: categorySlug } = await params;
  const repo = getRepository();
  const [city, category] = await Promise.all([repo.getCity(citySlug), repo.getCategory(categorySlug)]);
  if (!city || !category) notFound();
  const [result, allCities, allCategories] = await Promise.all([
    repo.searchProviders({ category: category.slug, city: city.slug }),
    repo.listCities(),
    repo.listCategories(),
  ]);
  const nearby = allCities
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ c, d: Math.hypot(c.lat - city.lat, (c.lng - city.lng) * 0.64) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);
  return (
    <CategoryLanding
      category={category}
      city={city}
      providers={result.providers.slice(0, 9)}
      total={result.total}
      breadcrumbs={[
        { href: "/", label: "SWOJ" },
        { href: `/${city.slug}`, label: city.name },
        { href: `/${city.slug}/${category.slug}`, label: category.name },
      ]}
      relatedTitle="Zobacz także"
      relatedLinks={[
        ...nearby.map(({ c }) => ({ href: `/${c.slug}/${category.slug}`, label: `${category.name} ${c.name}` })),
        ...allCategories.filter((c) => c.slug !== category.slug).slice(0, 6).map((c) => ({ href: `/${city.slug}/${c.slug}`, label: `${c.name} ${city.name}` })),
      ]}
    />
  );
}
