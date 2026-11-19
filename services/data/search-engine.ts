import type {
  AvailabilityStatus,
  Category,
  City,
  Provider,
  ProviderSummary,
  SearchParams,
  SearchResult,
  Service,
} from "@/types";
import { getAIService } from "@/services/ai/ai-service";
import { haversineKm } from "@/utils/geo";
import { normalizeText } from "@/utils/slugify";

/**
 * Search & ranking logic shared by every repository implementation.
 * Works on an in-memory candidate list — fine for a regional MVP (hundreds to a few
 * thousand profiles). For national scale, move filtering into SQL (PostGIS + full-text search).
 */

export const PAGE_SIZE = 12;

export const availabilityRank: Record<AvailabilityStatus, number> = { today: 0, tomorrow: 1, this_week: 2, busy: 3 };

export interface Catalog {
  cities: Map<string, City>;
  categories: Map<string, Category>;
}

export function toSummary(p: Provider, ownServices: Service[], catalog: Catalog, originSlug?: string | null): ProviderSummary {
  const city = catalog.cities.get(p.citySlug)!;
  const category = catalog.categories.get(p.primaryCategory)!;
  const origin = originSlug ? catalog.cities.get(originSlug) : null;
  // "Price from" compares like with like: area-based prices (zł/m²) are not comparable with
  // job prices, so they only count when a provider has nothing else.
  const primary = ownServices.filter((s) => s.categorySlug === p.primaryCategory);
  const pool = primary.length ? primary : ownServices;
  const wholeJob = pool.filter((s) => s.priceUnit !== "m²");
  const prices = (wholeJob.length ? wholeJob : pool).map((s) => s.priceFrom);
  return {
    ...p,
    city,
    category,
    services: ownServices,
    priceFrom: prices.length ? Math.min(...prices) : 0,
    distanceKm: origin ? Math.round(haversineKm(origin, city) * 10) / 10 : null,
  };
}

/** Does the provider work in this city (service radius + 10 km tolerance, or remote-friendly)? */
export function servesCity(p: Provider, providerCity: City, target: City): boolean {
  return haversineKm(providerCity, target) <= p.serviceRadiusKm + 10 || p.primaryCategory === "biznes";
}

function matchesText(p: ProviderSummary, q: string): boolean {
  const hay = normalizeText(
    [p.firstName, p.lastName, p.headline, p.category.name, ...p.skills, ...p.services.map((s) => s.name)].join(" "),
  );
  return normalizeText(q)
    .split(" ")
    .filter((w) => w.length > 2)
    .some((w) => hay.includes(w.length > 5 ? w.slice(0, -2) : w));
}

export async function runSearch(
  candidates: Provider[],
  servicesByProvider: Map<string, Service[]>,
  catalog: Catalog,
  params: SearchParams,
): Promise<SearchResult> {
  let categorySlug = params.category || undefined;
  let citySlug = params.city || undefined;
  let textQuery = params.q?.trim() || undefined;
  let interpretedQuery: SearchResult["interpretedQuery"] = null;

  // Free text: the AI service extracts category, city, urgency and preferred date.
  if (textQuery) {
    const interpreted = await getAIService().interpretQuery(textQuery, { citySlug: citySlug ?? null });
    if (interpreted.categorySlug || interpreted.preferredDate || interpreted.urgency === "high") {
      interpretedQuery = interpreted;
    }
    if (interpreted.categorySlug && !categorySlug) {
      categorySlug = interpreted.categorySlug;
      textQuery = undefined;
    }
    if (interpreted.citySlug && !citySlug) citySlug = interpreted.citySlug;
  }

  const origin = citySlug ? catalog.cities.get(citySlug) : undefined;
  let list = candidates.map((p) => toSummary(p, servicesByProvider.get(p.id) ?? [], catalog, citySlug));

  if (categorySlug) {
    list = list.filter((p) => p.primaryCategory === categorySlug || p.secondaryCategories.includes(categorySlug!));
  }
  if (textQuery) list = list.filter((p) => matchesText(p, textQuery!));
  if (origin) {
    const max = params.maxDistanceKm ?? Infinity;
    list = list.filter((p) => servesCity(p, p.city, origin) && (p.distanceKm ?? 0) <= max);
  }
  if (params.maxPrice) list = list.filter((p) => p.priceFrom <= params.maxPrice!);
  if (params.minRating) list = list.filter((p) => p.ratingAvg >= params.minRating!);
  if (params.verifiedOnly) list = list.filter((p) => p.verified);
  if (params.providerType && params.providerType !== "any") list = list.filter((p) => p.providerType === params.providerType);
  if (params.availability && params.availability !== "any") {
    const limit = availabilityRank[params.availability];
    list = list.filter((p) => availabilityRank[p.availability] <= limit);
  }

  const sort = params.sort ?? (interpretedQuery?.urgency === "high" ? "availability" : "rating");
  const byRating = (a: ProviderSummary, b: ProviderSummary) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount;
  list.sort((a, b) => {
    switch (sort) {
      case "distance":
        return (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || byRating(a, b);
      case "price":
        return a.priceFrom - b.priceFrom || byRating(a, b);
      case "availability":
        return availabilityRank[a.availability] - availabilityRank[b.availability] || byRating(a, b);
      default:
        return Number(b.featured) - Number(a.featured) || byRating(a, b);
    }
  });

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
  return {
    providers: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: list.length,
    page,
    pageSize: PAGE_SIZE,
    interpretedQuery,
  };
}

export function pickFeatured(list: ProviderSummary[], limit: number): ProviderSummary[] {
  const sorted = [...list].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || b.ratingAvg - a.ratingAvg,
  );
  // Prefer variety: one provider per category first, then fill up with the rest.
  const seen = new Set<string>();
  const diverse = sorted.filter((p) => (seen.has(p.primaryCategory) ? false : (seen.add(p.primaryCategory), true)));
  const rest = sorted.filter((p) => !diverse.includes(p));
  return [...diverse, ...rest].slice(0, limit);
}

export function ratingBreakdown(ratingAvg: number, reviewCount: number): Record<1 | 2 | 3 | 4 | 5, number> {
  // Derived from the stored aggregate so the histogram always matches the headline rating.
  const fiveShare = Math.min(0.98, Math.max(0.55, (ratingAvg - 4) * 0.95));
  const five = Math.round(reviewCount * fiveShare);
  const four = Math.round((reviewCount - five) * 0.75);
  const three = Math.round((reviewCount - five - four) * 0.7);
  const two = Math.round((reviewCount - five - four - three) * 0.6);
  return { 5: five, 4: four, 3: three, 2: two, 1: Math.max(0, reviewCount - five - four - three - two) };
}
