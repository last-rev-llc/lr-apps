export type PourRating = "generous" | "standard" | "stingy" | "criminal";
export type WallPostType = "glory" | "shame";

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  wine_list_rating: number;
  pour_rating: PourRating;
  avg_glass_price: number;
  notes: string;
  website?: string;
  accolades?: string;
}

export interface WinePour {
  id: string;
  restaurant_name: string;
  wine_name: string;
  pour_rating: PourRating;
  price_paid: number | null;
  notes: string | null;
  user_name: string;
  created_at: string;
}

export interface WallPost {
  id: string;
  user_name: string;
  pour_type: WallPostType;
  content: string;
  upvotes: number;
  created_at: string;
}
