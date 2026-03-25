import { createClient } from "@repo/db/server";
import type { TravelProperty, SortField } from "./types";

export interface PropertyFilters {
  search?: string;
  category?: string;
  region?: string;
  type?: string;
  sort?: SortField;
}

export async function getProperties(
  filters: PropertyFilters = {},
): Promise<TravelProperty[]> {
  const supabase = await createClient();
  const { search, category, region, type, sort = "name" } = filters;

  let query = supabase.from("travel_properties").select("*");

  if (category) query = query.eq("category", category);
  if (region) query = query.eq("region", region);
  if (type) query = query.eq("type", type);
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  const validSorts: SortField[] = ["name", "region", "category", "type"];
  const orderCol = validSorts.includes(sort) ? sort : "name";
  query = query.order(orderCol, { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("travel_properties fetch error:", error.message);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase row
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    location: r.location ?? "",
    region: r.region ?? "",
    category: r.category ?? "",
    type: r.type ?? "",
    description: r.description ?? null,
    website: r.website ?? null,
    pricing: r.pricing ?? null,
    photos: r.photos ?? null,
    amenities: r.amenities ?? null,
    highlights: r.highlights ?? null,
    tags: r.tags ?? null,
    rating: r.rating ?? null,
    researched: r.researched ?? false,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })) as TravelProperty[];
}
