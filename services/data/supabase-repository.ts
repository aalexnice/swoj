import { cache } from "react";
import type {
  Booking,
  Category,
  City,
  PortfolioItem,
  Provider,
  Review,
  SearchParams,
  Service,
  ServiceRequest,
} from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingInput, RequestInput } from "@/validation/schemas";
import type { DataRepository, PlatformStats, ProviderProfile } from "./repository";
import { pickFeatured, ratingBreakdown, runSearch, servesCity, toSummary, type Catalog } from "./search-engine";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped explicitly below */

const mapCategory = (r: any): Category => ({
  slug: r.slug,
  name: r.name,
  seoPlural: r.seo_plural,
  personNoun: r.person_noun,
  icon: r.icon,
  description: r.description,
  keywords: r.keywords ?? [],
  faq: r.faq ?? [],
  avgPriceFrom: r.avg_price_from,
});

const mapCity = (r: any): City => ({
  slug: r.slug,
  name: r.name,
  locative: r.locative,
  lat: r.lat,
  lng: r.lng,
  postalPrefixes: r.postal_prefixes ?? [],
  population: r.population ?? 0,
});

const mapProvider = (r: any, hours: any[]): Provider => ({
  id: r.id,
  slug: r.slug,
  firstName: r.first_name,
  lastName: r.last_name,
  gender: r.gender ?? "m",
  headline: r.headline,
  primaryCategory: r.category_slug,
  secondaryCategories: r.secondary_category_slugs ?? [],
  citySlug: r.city_slug,
  district: r.district,
  serviceRadiusKm: r.service_radius_km,
  bio: r.bio,
  yearsExperience: r.years_experience,
  skills: r.skills ?? [],
  languages: r.languages ?? [],
  experience: r.experience ?? [],
  certificates: r.certificates ?? [],
  providerType: r.provider_type,
  companyName: r.company_name,
  verified: r.verified,
  ratingAvg: Number(r.rating_avg),
  reviewCount: r.review_count,
  completedJobs: r.completed_jobs,
  responseTimeHours: r.response_time_hours,
  availability: r.availability,
  weeklyHours: hours
    .filter((h) => h.provider_id === r.id)
    .map((h) => ({ day: h.weekday, from: String(h.start_time).slice(0, 5), to: String(h.end_time).slice(0, 5) })),
  memberSince: r.member_since,
  plan: r.plan,
  featured: r.featured,
  avatarHue: r.avatar_hue,
});

const mapService = (r: any, categoryById: Map<string, string>): Service => ({
  id: r.id,
  providerId: r.provider_id,
  categorySlug: categoryById.get(r.category_id) ?? "",
  name: r.name,
  description: r.description,
  priceFrom: r.price_from,
  priceUnit: r.price_unit,
  durationMin: r.duration_min,
  durationMax: r.duration_max,
  options: (r.service_options ?? []).map((o: any) => ({ id: o.id, name: o.name, price: o.price })),
});

const mapReview = (r: any): Review => ({
  id: r.id,
  providerId: r.provider_id,
  serviceName: r.service_name ?? "",
  authorName: r.author_name,
  authorCity: r.author_city ?? "",
  rating: r.rating,
  text: r.body,
  date: r.created_at,
  verifiedBooking: r.verified_booking,
  reply: r.reply,
});

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data as T;
}

/** Catalogue snapshot, loaded once per request. */
const loadCatalogue = cache(async () => {
  const db = await createSupabaseServerClient();
  const [cats, locs, prov, hours, svc] = await Promise.all([
    db.from("categories").select("*").eq("is_active", true).order("sort_order"),
    db.from("locations").select("*").eq("is_active", true).order("population", { ascending: false }),
    db.from("provider_search").select("*"),
    db.from("availability").select("provider_id, weekday, start_time, end_time"),
    db.from("services").select("*, service_options(*)").eq("is_active", true).order("sort_order"),
  ]);
  const categoryRows = unwrap<any[]>(cats);
  const categoryById = new Map(categoryRows.map((c) => [c.id as string, c.slug as string]));
  const categories = categoryRows.map(mapCategory);
  const cities = unwrap<any[]>(locs).map(mapCity);
  const providers = unwrap<any[]>(prov).map((r) => mapProvider(r, unwrap<any[]>(hours)));
  const services = unwrap<any[]>(svc).map((r) => mapService(r, categoryById));
  const servicesByProvider = services.reduce((m, s) => m.set(s.providerId, [...(m.get(s.providerId) ?? []), s]), new Map<string, Service[]>());
  const catalog: Catalog = {
    cities: new Map(cities.map((c) => [c.slug, c])),
    categories: new Map(categories.map((c) => [c.slug, c])),
  };
  return { categories, cities, providers, servicesByProvider, catalog, categoryRows, locationRows: unwrap<any[]>(locs) };
});

export class SupabaseRepository implements DataRepository {
  async listCategories() {
    return (await loadCatalogue()).categories;
  }
  async getCategory(slug: string) {
    return (await loadCatalogue()).catalog.categories.get(slug) ?? null;
  }
  async listCities() {
    return (await loadCatalogue()).cities;
  }
  async getCity(slug: string) {
    return (await loadCatalogue()).catalog.cities.get(slug) ?? null;
  }

  async searchProviders(params: SearchParams) {
    const { providers, servicesByProvider, catalog } = await loadCatalogue();
    return runSearch(providers, servicesByProvider, catalog, params);
  }

  async getFeaturedProviders(options?: { citySlug?: string; limit?: number }) {
    const { providers, servicesByProvider, catalog } = await loadCatalogue();
    const list = providers.map((p) => toSummary(p, servicesByProvider.get(p.id) ?? [], catalog, options?.citySlug));
    return pickFeatured(list, options?.limit ?? 8);
  }

  async getProviderProfile(slug: string): Promise<ProviderProfile | null> {
    const { providers, servicesByProvider, catalog } = await loadCatalogue();
    const p = providers.find((x) => x.slug === slug);
    if (!p) return null;
    const db = await createSupabaseServerClient();
    const [pf, rv] = await Promise.all([
      db.from("portfolio_items").select("*").eq("provider_id", p.id).order("sort_order"),
      db.from("reviews").select("*").eq("provider_id", p.id).order("created_at", { ascending: false }).limit(20),
    ]);
    const portfolio: PortfolioItem[] = unwrap<any[]>(pf).map((r) => ({
      id: r.id,
      providerId: r.provider_id,
      title: r.title,
      description: r.description,
      hue: r.hue,
      pattern: r.pattern,
    }));
    return {
      ...toSummary(p, servicesByProvider.get(p.id) ?? [], catalog),
      portfolio,
      reviews: unwrap<any[]>(rv).map(mapReview),
      ratingBreakdown: ratingBreakdown(p.ratingAvg, p.reviewCount),
    };
  }

  async listProviderSlugs() {
    return (await loadCatalogue()).providers.map((p) => p.slug);
  }

  async getCityCategoryStats(citySlug: string) {
    const { providers, categories, catalog } = await loadCatalogue();
    const city = catalog.cities.get(citySlug);
    if (!city) return [];
    return categories
      .map((category) => ({
        category,
        providerCount: providers.filter(
          (p) =>
            (p.primaryCategory === category.slug || p.secondaryCategories.includes(category.slug)) &&
            servesCity(p, catalog.cities.get(p.citySlug)!, city),
        ).length,
      }))
      .sort((a, b) => b.providerCount - a.providerCount);
  }

  async countProvidersByCity() {
    const { providers, cities, catalog } = await loadCatalogue();
    return Object.fromEntries(
      cities.map((city) => [city.slug, providers.filter((p) => servesCity(p, catalog.cities.get(p.citySlug)!, city)).length]),
    );
  }

  async listBookings(filter?: { providerId?: string }): Promise<Booking[]> {
    const db = await createSupabaseServerClient();
    let q = db.from("bookings").select("*").order("scheduled_date").order("scheduled_time");
    if (filter?.providerId) q = q.eq("provider_id", filter.providerId);
    return unwrap<any[]>(await q).map((r) => ({
      id: r.id,
      providerId: r.provider_id,
      serviceId: r.service_id,
      clientName: r.contact_name,
      date: r.scheduled_date,
      time: String(r.scheduled_time).slice(0, 5),
      address: `${r.street}, ${r.postal_code} ${r.city}`,
      status: r.status,
      total: r.total,
      createdAt: r.created_at,
    }));
  }

  async listRequests(filter?: { categorySlugs?: string[] }): Promise<ServiceRequest[]> {
    const { categoryRows, locationRows } = await loadCatalogue();
    const catSlug = new Map(categoryRows.map((c) => [c.id, c.slug]));
    const locSlug = new Map(locationRows.map((l) => [l.id, l.slug]));
    const db = await createSupabaseServerClient();
    let q = db.from("requests").select("*, request_offers(count)").order("created_at", { ascending: false });
    if (filter?.categorySlugs) {
      const ids = categoryRows.filter((c) => filter.categorySlugs!.includes(c.slug)).map((c) => c.id);
      q = q.in("category_id", ids);
    }
    return unwrap<any[]>(await q).map((r) => ({
      id: r.id,
      categorySlug: catSlug.get(r.category_id) ?? "",
      title: r.title,
      description: r.description,
      citySlug: locSlug.get(r.location_id) ?? "",
      preferredDate: r.preferred_date ?? "",
      budget: r.budget,
      status: r.status,
      clientName: String(r.contact_email).split("@")[0],
      createdAt: r.created_at,
      offersCount: r.request_offers?.[0]?.count ?? 0,
    }));
  }

  async listReviews(filter?: { providerId?: string }) {
    const db = await createSupabaseServerClient();
    let q = db.from("reviews").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter?.providerId) q = q.eq("provider_id", filter.providerId);
    return unwrap<any[]>(await q).map(mapReview);
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const db = createSupabaseAdminClient();
    const count = async (table: string, apply?: (q: any) => any) => {
      let q: any = db.from(table).select("*", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c, error } = await q;
      if (error) throw new Error(`Supabase: ${error.message}`);
      return c ?? 0;
    };
    const [users, providers, verifiedProviders, services, bookings, openRequests, reviews] = await Promise.all([
      count("profiles"),
      count("providers"),
      count("providers", (q) => q.eq("verified", true)),
      count("services"),
      count("bookings"),
      count("requests", (q) => q.in("status", ["open", "offers"])),
      count("reviews"),
    ]);
    const { data } = await db.from("bookings").select("total").neq("status", "cancelled");
    const gmv = (data ?? []).reduce((s: number, r: any) => s + r.total, 0);
    return { users, providers, verifiedProviders, services, bookings, openRequests, reviews, gmv };
  }

  async createBooking(input: BookingInput) {
    // Guests may book without an account, so the insert runs with the service role
    // after the route handler validated input and applied rate limiting.
    const db = createSupabaseAdminClient();
    const service = unwrap<any>(
      await db.from("services").select("*, service_options(*)").eq("id", input.serviceId).eq("provider_id", input.providerId).single(),
    );
    const options = (service.service_options ?? []).filter((o: any) => input.optionIds.includes(o.id));
    const total = service.price_from + options.reduce((s: number, o: any) => s + o.price, 0);
    const session = await (await createSupabaseServerClient()).auth.getUser();
    const booking = unwrap<any>(
      await db
        .from("bookings")
        .insert({
          provider_id: input.providerId,
          service_id: input.serviceId,
          client_id: session.data.user?.id ?? null,
          scheduled_date: input.date,
          scheduled_time: input.time,
          street: input.address.street,
          postal_code: input.address.postalCode,
          city: input.address.city,
          contact_name: input.address.name,
          contact_phone: input.address.phone,
          notes: input.address.notes || null,
          total,
        })
        .select("id")
        .single(),
    );
    if (options.length) {
      unwrap(
        await db.from("booking_items").insert(
          options.map((o: any) => ({ booking_id: booking.id, service_option_id: o.id, label: o.name, price: o.price })),
        ),
      );
    }
    return { id: booking.id as string };
  }

  async createRequest(input: RequestInput) {
    const { categoryRows, locationRows } = await loadCatalogue();
    const category = categoryRows.find((c) => c.slug === input.categorySlug);
    const location = locationRows.find((l) => l.slug === input.citySlug);
    if (!category || !location) throw new Error("INVALID_REFERENCE");
    const db = createSupabaseAdminClient();
    const session = await (await createSupabaseServerClient()).auth.getUser();
    const row = unwrap<any>(
      await db
        .from("requests")
        .insert({
          client_id: session.data.user?.id ?? null,
          category_id: category.id,
          location_id: location.id,
          title: input.title,
          description: input.description,
          photos: input.photos ?? [],
          preferred_date: input.preferredDate === "date" ? input.exactDate : input.preferredDate,
          budget: typeof input.budget === "number" ? input.budget : null,
          contact_email: input.contactEmail,
        })
        .select("id")
        .single(),
    );
    const { total } = await this.searchProviders({ category: input.categorySlug, city: input.citySlug });
    return { id: row.id as string, matchedProviders: total };
  }
}
