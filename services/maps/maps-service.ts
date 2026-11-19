import type { City } from "@/types";
import { cities } from "@/data/cities";
import { haversineKm } from "@/utils/geo";

/**
 * Maps abstraction. Mock implementation geocodes against the local city list
 * (name or postal code prefix) and draws a static schematic map.
 * Integration point: implement with Mapbox (NEXT_PUBLIC_MAPBOX_TOKEN) or Google Maps Geocoding.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapsService {
  geocode(query: string): Promise<(GeoPoint & { citySlug: string | null; label: string }) | null>;
  distanceKm(a: GeoPoint, b: GeoPoint): number;
  staticMapUrl(center: GeoPoint, radiusKm: number): string | null;
}

export function resolveCity(query: string): City | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (/^\d{2}-?\d{0,3}$/.test(q)) {
    const normalized = q.length > 2 && !q.includes("-") ? `${q.slice(0, 2)}-${q.slice(2)}` : q;
    return cities.find((c) => c.postalPrefixes.some((p) => normalized.startsWith(p))) ?? null;
  }
  return (
    cities.find((c) => c.name.toLowerCase() === q || c.slug === q) ??
    cities.find((c) => c.name.toLowerCase().startsWith(q)) ??
    null
  );
}

class MockMapsService implements MapsService {
  async geocode(query: string) {
    const city = resolveCity(query);
    return city ? { lat: city.lat, lng: city.lng, citySlug: city.slug, label: city.name } : null;
  }
  distanceKm(a: GeoPoint, b: GeoPoint) {
    return haversineKm(a, b);
  }
  staticMapUrl() {
    return null;
  }
}

let instance: MapsService | null = null;
export function getMapsService(): MapsService {
  instance ??= new MockMapsService();
  return instance;
}
