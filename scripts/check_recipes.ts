// Validates recipe ingredient → product matching against the live API,
// using the exact same resolution code the site runs (resolveRecipe).
// Run: npx tsx scripts/check_recipes.ts
import { RECIPES, resolveRecipe, recipeEstimate } from "../apps/web/src/lib/recipes";

const API = "https://supermarket-compare-production.up.railway.app/api";

// DEBUG_QUERIES="תפוח אדמה,מלפפון" prints the raw top-20 for each query instead
async function debugQueries(qs: string[]) {
  for (const q of qs) {
    console.log(`\n### raw results for "${q}" ###`);
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=20`);
    const data = await res.json();
    for (const p of data.results ?? []) {
      console.log(`  [${p.id}] ${p.name} | cat=${p.category ?? "-"} | ₪${p.minPrice} | ${p.storeCount} stores`);
    }
  }
}

async function main() {
  const dbg = process.env.DEBUG_QUERIES;
  if (dbg) { await debugQueries(dbg.split(",")); return; }
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
