import type {
  Booking,
  Category,
  City,
  PortfolioItem,
  ProviderSummary,
  Review,
  SearchParams,
  SearchResult,
  ServiceRequest,
} from "@/types";
import type { BookingInput, RequestInput } from "@/validation/schemas";

export interface ProviderProfile extends ProviderSummary {
  portfolio: PortfolioItem[];
  reviews: Review[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CityCategoryStat {
  category: Category;
  providerCount: number;
}

export interface PlatformStats {
  users: number;
  providers: number;
  verifiedProviders: number;
  services: number;
  bookings: number;
  openRequests: number;
  reviews: number;
  gmv: number;
}

/**
 * Data access contract. Pages and route handlers depend only on this interface,
 * so the demo (in-memory) and Supabase implementations are interchangeable.
 */
export interface DataRepository {
  listCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | null>;
  listCities(): Promise<City[]>;
  getCity(slug: string): Promise<City | null>;

  searchProviders(params: SearchParams): Promise<SearchResult>;
  getFeaturedProviders(options?: { citySlug?: string; limit?: number }): Promise<ProviderSummary[]>;
  getProviderProfile(slug: string): Promise<ProviderProfile | null>;
  listProviderSlugs(): Promise<string[]>;
  getCityCategoryStats(citySlug: string): Promise<CityCategoryStat[]>;
  countProvidersByCity(): Promise<Record<string, number>>;

  listBookings(filter?: { providerId?: string }): Promise<Booking[]>;
  listRequests(filter?: { categorySlugs?: string[] }): Promise<ServiceRequest[]>;
  listReviews(filter?: { providerId?: string }): Promise<Review[]>;
  getPlatformStats(): Promise<PlatformStats>;

  createBooking(input: BookingInput): Promise<{ id: string }>;
  createRequest(input: RequestInput): Promise<{ id: string; matchedProviders: number }>;
}
