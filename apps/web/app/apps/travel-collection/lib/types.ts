export interface TravelProperty {
  id: string;
  name: string;
  location: string;
  region: string;
  category: string;
  type: string;
  description: string | null;
  website: string | null;
  pricing: string | null;
  photos: string[] | null;
  amenities: string[] | null;
  highlights: string[] | null;
  tags: string[] | null;
  rating: number | null;
  researched: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SortField = "name" | "region" | "category" | "type";

export const CATEGORIES = [
  "Hotels & Resorts",
  "Private Retreats & Villas",
] as const;

export const REGIONS = [
  "Americas",
  "Europe",
  "Asia & Middle East",
  "South Pacific",
] as const;

export const TYPES = [
  "Hotel",
  "Resort",
  "Villa",
  "Private Island",
  "Estate",
  "Cruise",
] as const;

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "region", label: "Region" },
  { value: "category", label: "Category" },
  { value: "type", label: "Type" },
];
