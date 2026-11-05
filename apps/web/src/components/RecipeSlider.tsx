"use client";
import { RECIPES, recipeImg, type Recipe } from "@/lib/recipes";

// Homepage recipe showcase: a swipeable strip on mobile, a clean 3×2 grid
// on desktop (a horizontal slider in a ~470px column never breathed well).
// Pure static content — costs the homepage nothing.

// hand-picked variety of occasions for the 6 desktop slots
const SHOWCASE_SLUGS = [
  "shakshuka", "schnitzel-u-pure", "pizza-beitit",
  "pasta-shamenet-pitriyot", "ugat-gvina-afuya", "marak-katom",
];
const showcase = SHOWCASE_SLUGS
  .map((s) => RECIPES.find((r) => r.slug === s))
  .filter(Boolean) as Recipe[];

function Card({ r, compact }: { r: Recipe; compact?: boolean }) {
  return (
    <a
      href={`/recipes/${r.slug}`}
      className={`bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md transition ${compact ? "" : "snap-start shrink-0 w-[150px]"}`}
    >
      <div className={`relative w-full bg-stone-50 overflow-hidden aspect-square`}>
        {/* emoji sits behind the photo as a graceful fallback */}
        <span className="absolute inset-0 flex items-center justify-center text-5xl">{r.emoji}</span>
        <img
          src={recipeImg(r.slug)}
          alt={`מתכון ${r.title}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <span className="absolute top-2 right-2 text-[9px] font-bold text-white bg-black/45 backdrop-blur-sm rounded-full px-2 py-0.5">
          {r.occasion}
        </span>
      </div>
      <div className="p-2.5">
        <div className="font-bold text-xs text-stone-800 leading-snug line-clamp-2 min-h-[2rem]">{r.title}</div>
        <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-between">
          <span>⏱ {r.prepMinutes + r.cookMinutes} דק׳</span>
          <span className="text-emerald-600 font-bold">כמה עולה? ←</span>
        </div>
      </div>
    </a>
  );
}

export default function RecipeSlider() {
  return (
    <section dir="rtl" className="max-w-6xl mx-auto px-4 pt-8 pb-2 text-right">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="font-black text-lg text-stone-800 leading-tight">🍳 כמה עולה להכין?</h2>
          <p className="text-[11px] text-stone-400 mt-0.5">מתכונים עם השוואת מחיר חיה בין הרשתות</p>
        </div>
        <a href="/recipes" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap shrink-0">
          כל המתכונים ←
        </a>
      </div>

      {/* mobile: swipeable strip over all recipes */}
      <div
        className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {RECIPES.map((r) => <Card key={r.slug} r={r} />)}
        <a
          href="/recipes"
          className="snap-start shrink-0 w-[150px] rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-center p-4 hover:bg-emerald-50 transition"
        >
          <span className="text-3xl">🛒</span>
          <span className="text-xs font-bold text-emerald-700 leading-snug">לכל המתכונים החסכוניים</span>
        </a>
      </div>

      {/* desktop: one full-width row of a curated six */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {showcase.map((r) => <Card key={r.slug} r={r} compact />)}
      </div>
      <a href="/recipes" className="hidden sm:flex mt-3 items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-xl py-2.5 transition">
        🛒 לכל {RECIPES.length} המתכונים החסכוניים ←
      </a>
    </section>
  );
}
