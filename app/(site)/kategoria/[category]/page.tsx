import { notFound } from "next/navigation";
import { getRepository } from "@/services/data";
import { categories } from "@/data/categories";
import { buildMetadata } from "@/lib/seo";
import { CategoryLanding } from "@/components/seo/landing";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const category = await getRepository().getCategory((await params).category);
  if (!category) return {};
  return buildMetadata({
    title: `${category.seoPlural} na Śląsku — opinie i ceny`,
    description: `${category.description} Porównaj specjalistów z województwa śląskiego: opinie, ceny i wolne terminy.`,
    path: `/kategoria/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const repo = getRepository();
  const category = await repo.getCategory((await params).category);
  if (!category) notFound();
  const [result, cities] = await Promise.all([repo.searchProviders({ category: category.slug }), repo.listCities()]);
  return (
    <CategoryLanding
      category={category}
      city={null}
      providers={result.providers.slice(0, 9)}
      total={result.total}
      breadcrumbs={[
        { href: "/", label: "SWOJ" },
        { href: "/uslugi", label: "Usługi" },
        { href: `/kategoria/${category.slug}`, label: category.name },
      ]}
      relatedTitle={`${category.name} w Twoim mieście`}
      relatedLinks={cities.map((c) => ({ href: `/${c.slug}/${category.slug}`, label: `${category.name} ${c.name}` }))}
    />
  );
}
