"use client";
import { useEffect, useRef, useState } from "react";
import { RECIPES, recipeImg } from "@/lib/recipes";

// Horizontal snap-scroll recipe strip for the homepage idle state.
// Desktop gets arrow buttons + edge fade + progress dots as scroll
// affordance; mobile keeps native swipe. Pure static content (no fetches).
export default function RecipeSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [progress, setProgress] = useState(0);

  const updateState = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // RTL: evergreen browsers report scrollLeft as 0..-max — use the absolute value
    const pos = Math.min(Math.abs(el.scrollLeft), max);
    setCanPrev(pos > 4);
    setCanNext(pos < max - 4);
    setProgress(max > 0 ? pos / max : 1);
  };

  useEffect(() => {
    updateState();
    const onResize = () => updateState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // dir=1 → further into the list (visually left in RTL)
  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: -dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  const Arrow = ({ dir, enabled, label }: { dir: 1 | -1; enabled: boolean; label: string }) => (
    <button
      onClick={() => scrollByCards(dir)}
      aria-label={label}
      disabled={!enabled}
      className={`hidden sm:flex absolute top-[72px] ${dir === 1 ? "left-0 -translate-x-1/3" : "right-0 translate-x-1/3"} z-10
        w-9 h-9 rounded-full bg-white border border-stone-200 shadow-md items-center justify-center
        text-stone-500 hover:text-emerald-600 hover:border-emerald-300 transition
        ${enabled ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 1 ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );

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

      <div className="relative">
        <Arrow dir={-1} enabled={canPrev} label="המתכונים הקודמים" />
        <Arrow dir={1} enabled={canNext} label="עוד מתכונים" />

        {/* edge fade hints that the strip continues */}
        {canNext && <div className="hidden sm:block absolute inset-y-0 left-0 w-12 z-[5] pointer-events-none bg-gradient-to-r from-transparent to-transparent"
          style={{ background: "linear-gradient(to left, rgba(250,250,249,0), rgba(250,250,249,0.95))" }} />}
        {canPrev && <div className="hidden sm:block absolute inset-y-0 right-0 w-12 z-[5] pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(250,250,249,0), rgba(250,250,249,0.95))" }} />}

        <div
          ref={trackRef}
          onScroll={updateState}
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {RECIPES.map((r) => (
            <a
              key={r.slug}
              href={`/recipes/${r.slug}`}
              className="snap-start shrink-0 w-[150px] sm:w-[168px] bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md transition"
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
                <div className="font-bold text-xs text-stone-800 leading-snug line-clamp-2 min-h-[2rem]">{r.title}</div>
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
            className="snap-start shrink-0 w-[150px] sm:w-[168px] rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-center p-4 hover:bg-emerald-50 transition"
          >
            <span className="text-3xl">🛒</span>
            <span className="text-xs font-bold text-emerald-700 leading-snug">לכל המתכונים החסכוניים</span>
          </a>
        </div>

        {/* scroll progress bar */}
        <div className="mt-1 mx-auto w-28 h-1 rounded-full bg-stone-100 overflow-hidden" dir="ltr">
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-150"
            style={{ width: `${Math.max(12, Math.round(progress * 100))}%`, marginLeft: "auto" }}
          />
        </div>
      </div>
    </section>
  );
}
