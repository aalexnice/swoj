import { useSupabaseData } from "@/lib/env";
import { MockRepository } from "./mock-repository";
import type { DataRepository } from "./repository";
import { SupabaseRepository } from "./supabase-repository";

export type { DataRepository, ProviderProfile, CityCategoryStat, PlatformStats } from "./repository";

let instance: DataRepository | null = null;

/**
 * Single entry point for data access.
 * NEXT_PUBLIC_DATA_SOURCE=supabase (with Supabase keys) → SupabaseRepository, otherwise demo data.
 */
export function getRepository(): DataRepository {
  instance ??= useSupabaseData ? new SupabaseRepository() : new MockRepository();
  return instance;
}
