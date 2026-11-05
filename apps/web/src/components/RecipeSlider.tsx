"use client";
import { RECIPES, recipeImg } from "@/lib/recipes";

// Horizontal snap-scroll recipe strip for the homepage idle state.
// Pure static content (no fetches) so it costs the homepage nothing.
export default function RecipeSlider() {
  return (
    <section dir="rtl" className="max-w-2xl mx-auto px-4 pt-6 pb-2 text-right">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="font-black text-lg text-stone-800 leading-tight">🍳 כמה עולה להכין?</h2>
          <p className="text-[11px] text-stone-400 mt-0.5">מתכונים עם השוואת מחיר חיה בין הרשתות</p>
        </div>
        <a href="/recipes" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap shrink-0">
          כל המתכונים ←
        </a>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {RECIPES.map((r) => (
          <a
            key={r.slug}
            href={`/recipes/${r.slug}`}
            className="snap-start shrink-0 w-[150px] sm:w-[164px] bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md transition"
          >
            <div className="relative w-full aspect-square bg-stone-50 overflow-hidden">
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
              <div className="font-bold text-xs text-stone-800 leading-snug line-clamp-1">{r.title}</div>
              <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-between">
                <span>⏱ {r.prepMinutes + r.cookMinutes} דק׳</span>
                <span className="text-emerald-600 font-bold">כמה עולה? ←</span>
              </div>
            </div>
          </a>
        ))}

        {/* end card */}
        <a
          href="/recipes"
          className="snap-start shrink-0 w-[150px] sm:w-[164px] rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-center p-4 hover:bg-emerald-50 transition"
        >
          <span className="text-3xl">🛒</span>
          <span className="text-xs font-bold text-emerald-700 leading-snug">לכל המתכונים החסכוניים</span>
        </a>
      </div>
    </section>
  );
}
