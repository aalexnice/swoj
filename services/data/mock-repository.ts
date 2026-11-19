import type { Booking, SearchParams, ServiceRequest, Service } from "@/types";
import { categories, categoriesBySlug } from "@/data/categories";
import { cities, citiesBySlug } from "@/data/cities";
import { bookings, portfolioItems, providers, reviews, serviceRequests, services } from "@/data/dataset";
import type { BookingInput, RequestInput } from "@/validation/schemas";
import type { DataRepository, PlatformStats, ProviderProfile } from "./repository";
import { pickFeatured, ratingBreakdown, runSearch, servesCity, toSummary, type Catalog } from "./search-engine";

/** Records created during a demo session live in memory and reset on server restart. */
const createdBookings: Booking[] = [];
const createdRequests: ServiceRequest[] = [];

const catalog: Catalog = { cities: citiesBySlug, categories: categoriesBySlug };
const servicesByProvider = services.reduce((map, s) => {
  map.set(s.providerId, [...(map.get(s.providerId) ?? []), s]);
  return map;
}, new Map<string, Service[]>());

/** Demo implementation backed by the generated dataset in src/data. */
export class MockRepository implements DataRepository {
  async listCategories() {
    return categories;
  }
  async getCategory(slug: string) {
    return categoriesBySlug.get(slug) ?? null;
  }
  async listCities() {
    return cities;
  }
  async getCity(slug: string) {
    return citiesBySlug.get(slug) ?? null;
  }

  async searchProviders(params: SearchParams) {
    return runSearch(providers, servicesByProvider, catalog, params);
  }

  async getFeaturedProviders(options?: { citySlug?: string; limit?: number }) {
    const list = providers.map((p) => toSummary(p, servicesByProvider.get(p.id) ?? [], catalog, options?.citySlug));
    return pickFeatured(list, options?.limit ?? 8);
  }

  async getProviderProfile(slug: string): Promise<ProviderProfile | null> {
    const p = providers.find((x) => x.slug === slug);
    if (!p) return null;
    return {
      ...toSummary(p, servicesByProvider.get(p.id) ?? [], catalog),
      portfolio: portfolioItems.filter((i) => i.providerId === p.id),
      reviews: reviews.filter((r) => r.providerId === p.id).sort((a, b) => b.date.localeCompare(a.date)),
      ratingBreakdown: ratingBreakdown(p.ratingAvg, p.reviewCount),
    };
  }

  async listProviderSlugs() {
    return providers.map((p) => p.slug);
  }

  async getCityCategoryStats(citySlug: string) {
    const city = citiesBySlug.get(citySlug);
    if (!city) return [];
    return categories
      .map((category) => ({
        category,
        providerCount: providers.filter(
          (p) =>
            (p.primaryCategory === category.slug || p.secondaryCategories.includes(category.slug)) &&
            servesCity(p, citiesBySlug.get(p.citySlug)!, city),
        ).length,
      }))
      .sort((a, b) => b.providerCount - a.providerCount);
  }

  async countProvidersByCity() {
    return Object.fromEntries(
      cities.map((city) => [city.slug, providers.filter((p) => servesCity(p, citiesBySlug.get(p.citySlug)!, city)).length]),
    );
  }

  async listBookings(filter?: { providerId?: string }) {
    const all = [...createdBookings, ...bookings];
    return (filter?.providerId ? all.filter((b) => b.providerId === filter.providerId) : all).sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time),
    );
  }

  async listRequests(filter?: { categorySlugs?: string[] }) {
    const all = [...createdRequests, ...serviceRequests];
    return filter?.categorySlugs ? all.filter((r) => filter.categorySlugs!.includes(r.categorySlug)) : all;
  }

  async listReviews(filter?: { providerId?: string }) {
    const list = filter?.providerId ? reviews.filter((r) => r.providerId === filter.providerId) : reviews;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const all = await this.listBookings();
    const requests = await this.listRequests();
    return {
      users: 1284,
      providers: providers.length,
      verifiedProviders: providers.filter((p) => p.verified).length,
      services: services.length,
      bookings: all.length,
      openRequests: requests.filter((r) => r.status !== "closed").length,
      reviews: reviews.length,
      gmv: all.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.total, 0),
    };
  }

  async createBooking(input: BookingInput) {
    const service = services.find((s) => s.id === input.serviceId && s.providerId === input.providerId);
    if (!service) throw new Error("SERVICE_NOT_FOUND");
    const optionsTotal = service.options.filter((o) => input.optionIds.includes(o.id)).reduce((s, o) => s + o.price, 0);
    const booking: Booking = {
      id: `bkg_demo_${Date.now().toString(36)}`,
      providerId: input.providerId,
      serviceId: input.serviceId,
      clientName: input.address.name,
      date: input.date,
      time: input.time,
      address: `${input.address.street}, ${input.address.postalCode} ${input.address.city}`,
      status: "pending",
      total: service.priceFrom + optionsTotal,
      createdAt: new Date().toISOString(),
    };
    createdBookings.unshift(booking);
    return { id: booking.id };
  }

  async createRequest(input: RequestInput) {
    const request: ServiceRequest = {
      id: `req_demo_${Date.now().toString(36)}`,
      categorySlug: input.categorySlug,
      title: input.title,
      description: input.description,
      citySlug: input.citySlug,
      preferredDate: input.preferredDate === "date" ? (input.exactDate ?? "") : input.preferredDate,
      budget: typeof input.budget === "number" ? input.budget : null,
      status: "open",
      clientName: input.contactEmail.split("@")[0],
      createdAt: new Date().toISOString(),
      offersCount: 0,
    };
    createdRequests.unshift(request);
    const { total } = await this.searchProviders({ category: input.categorySlug, city: input.citySlug });
    return { id: request.id, matchedProviders: total };
  }
}
