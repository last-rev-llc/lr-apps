export type RecipeType = "App" | "Automation" | "Skill" | "Rule";

export interface Recipe {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  type?: RecipeType | string | null;
  prompt?: string | null;
  icon?: string | null;
  tags?: string[] | null;
  integrations?: string[] | null;
  skills?: string[] | null;
  createdAt?: string | null;
}

export type ViewMode = "grid" | "list";
