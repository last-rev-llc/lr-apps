import { getRecipes } from "./lib/queries";
import { RecipesApp } from "./components/recipes-app";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return <RecipesApp initialRecipes={recipes} />;
}
