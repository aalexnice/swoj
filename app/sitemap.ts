import type { MetadataRoute } from "next";
import { getRepository } from "@/services/data";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getRepository();
  const [categories, cities, slugs] = await Promise.all([repo.listCategories(), repo.listCities(), repo.listProviderSlugs()]);
  const now = new Date();
  const staticPages = ["/", "/uslugi", "/specjalisci", "/jak-to-dziala", "/dla-wykonawcow", "/cennik", "/zlecenie", "/zaloz-profil"];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/kategoria/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...cities.map((c) => ({ url: absoluteUrl(`/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...cities.flatMap((city) =>
      categories.map((cat) => ({ url: absoluteUrl(`/${city.slug}/${cat.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ),
    ...slugs.map((s) => ({ url: absoluteUrl(`/specjalista/${s}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
