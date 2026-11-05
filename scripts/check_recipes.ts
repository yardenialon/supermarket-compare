// Validates recipe ingredient → product matching against the live API,
// using the exact same resolution code the site runs (resolveRecipe).
// Run: npx tsx scripts/check_recipes.ts
import { RECIPES, resolveRecipe, recipeEstimate } from "../apps/web/src/lib/recipes";

async function main() {
  for (const recipe of RECIPES) {
    const resolved = await resolveRecipe(recipe);
    const est = recipeEstimate(resolved);
    console.log(`\n=== ${recipe.emoji} ${recipe.title} (${recipe.slug}) ===`);
    console.log(est ? `main-ingredients from ₪${est.total.toFixed(2)} (${est.counted} resolved, ${est.missing} missing)` : "NO ESTIMATE (too few resolved)");
    for (const r of resolved) {
      const tag = r.pantry ? "[pantry]" : "[main]  ";
      if (r.product) {
        console.log(`  ${tag} ${r.he} -> [${r.product.id}] ${r.product.name} | ₪${Number(r.product.minPrice).toFixed(2)} x${r.units} | ${r.product.storeCount} stores`);
      } else {
        console.log(`  ${tag} ${r.he} -> ❌ UNRESOLVED (q="${recipe.ingredients.find(i => i.key === r.key)?.q}")`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
