/**
 * Domain types. They mirror the PostgreSQL schema in supabase/migrations
 * (camelCase here, snake_case in the database — see services/data/supabase-repository.ts).
 */

export type UserRole = "client" | "provider" | "admin";

export type ProviderType = "private" | "freelancer" | "sole_trader" | "company";

export type AvailabilityStatus = "today" | "tomorrow" | "this_week" | "busy";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type RequestStatus = "open" | "offers" | "assigned" | "closed";

export type PlanId = "free" | "pro" | "pro_plus";

export interface City {
  slug: string;
  name: string;
  /** Locative form used in copy: „w Katowicach” */
  locative: string;
  lat: number;
  lng: number;
  postalPrefixes: string[];
  population: number;
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface Category {
  slug: string;
  name: string;
  /** Plural used in SEO headings: „Elektrycy w Katowicach” */
  seoPlural: string;
  /** Singular noun for a person in this trade: „elektryk” */
  personNoun: string;
  icon: string;
  description: string;
  keywords: string[];
  faq: CategoryFaq[];
  avgPriceFrom: number;
}

export interface Service {
  id: string;
  providerId: string;
  categorySlug: string;
  name: string;
  description: string;
  priceFrom: number;
  priceUnit: "usługa" | "godz." | "m²" | "szt.";
  durationMin: number;
  durationMax: number;
  options: ServiceOption[];
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

export interface PortfolioItem {
  id: string;
  providerId: string;
  title: string;
  description: string;
  /** Seed for the generated placeholder artwork */
  hue: number;
  pattern: "grid" | "waves" | "blocks" | "rings";
}

export interface Experience {
  role: string;
  company: string;
  from: number;
  to: number | null;
  description: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  year: number;
}

export interface WeeklyHours {
  /** 0 = Monday … 6 = Sunday */
  day: number;
  from: string;
  to: string;
}

export interface Provider {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  gender: "f" | "m";
  headline: string;
  primaryCategory: string;
  secondaryCategories: string[];
  citySlug: string;
  district: string | null;
  serviceRadiusKm: number;
  bio: string;
  yearsExperience: number;
  skills: string[];
  languages: string[];
  experience: Experience[];
  certificates: Certificate[];
  providerType: ProviderType;
  companyName: string | null;
  verified: boolean;
  ratingAvg: number;
  reviewCount: number;
  completedJobs: number;
  responseTimeHours: number;
  availability: AvailabilityStatus;
  weeklyHours: WeeklyHours[];
  memberSince: number;
  plan: PlanId;
  featured: boolean;
  avatarHue: number;
}

export interface Review {
  id: string;
  providerId: string;
  serviceName: string;
  authorName: string;
  authorCity: string;
  rating: number;
  text: string;
  date: string;
  verifiedBooking: boolean;
  reply: string | null;
}

export interface Booking {
  id: string;
  providerId: string;
  serviceId: string;
  clientName: string;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
  total: number;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  categorySlug: string;
  title: string;
  description: string;
  citySlug: string;
  preferredDate: string;
  budget: number | null;
  status: RequestStatus;
  clientName: string;
  createdAt: string;
  offersCount: number;
}

/** Provider enriched with what cards and profiles need */
export interface ProviderSummary extends Provider {
  city: City;
  category: Category;
  services: Service[];
  priceFrom: number;
  distanceKm: number | null;
}

export type SortOption = "rating" | "distance" | "price" | "availability";

export interface SearchParams {
  q?: string;
  category?: string;
  city?: string;
  maxDistanceKm?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: AvailabilityStatus | "any";
  verifiedOnly?: boolean;
  providerType?: ProviderType | "any";
  sort?: SortOption;
  page?: number;
}

export interface SearchResult {
  providers: ProviderSummary[];
  total: number;
  page: number;
  pageSize: number;
  interpretedQuery: InterpretedQuery | null;
}

export interface InterpretedQuery {
  categorySlug: string | null;
  citySlug: string | null;
  urgency: "low" | "normal" | "high";
  preferredDate: string | null;
  summary: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  providerSlug?: string;
}
