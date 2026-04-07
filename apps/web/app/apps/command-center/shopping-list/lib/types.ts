export type ItemCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "bakery"
  | "frozen"
  | "pantry"
  | "beverages"
  | "household"
  | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity?: string | null;
  checked: boolean;
  added_by?: string | null;
  created_at: string;
}
