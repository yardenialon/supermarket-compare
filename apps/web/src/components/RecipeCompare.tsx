"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { chainByName } from "@/lib/chains";
import type { ResolvedIngredient } from "@/lib/recipes";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

interface ChainResult {
  chainName: string;
  subchainName?: string | null;
  storeName: string;
  city: string;
  total: number;
  availableCount: number;
  missingCount: number;
  promoSavings?: number;
  promoTotal?: number;
  promoClubTotal?: number;
  breakdown: { productId: number; price: number; qty: number; subtotal: number }[];
}

// pantry memory shared across all recipes: keys the user marked "אין לי בבית"
const PANTRY_LS = "savy-pantry-need";

function loadPantryNeeds(): Set<string> {
  try {
    const raw = localStorage.getItem(PANTRY_LS);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function savePantryNeeds(s: Set<string>) {
  try { localStorage.setItem(PANTRY_LS, JSON.stringify([...s])); } catch {}
}

export default function RecipeCompare({ resolved, servings, recipeTitle }: {
  resolved: ResolvedIngredient[];
  servings: number;
  recipeTitle: string;
}) {
  const buyable = useMemo(() => resolved.filter((r) => r.product), [resolved]);
  const mains = buyable.filter((r) => !r.pantry);
  const pantry = buyable.filter((r) => r.pantry);
  const unresolved = resolved.filter((r) => !r.product);

  // checked = "לקנות" (in the basket). mains default on, pantry default off
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const r of buyable) init[r.key] = !r.pantry;
    return init;
  });
  const [includeClub, setIncludeClub] = useState(false);
  const [chains, setChains] = useState<ChainResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // restore pantry memory + club preference after mount (SSR-safe)
  useEffect(() => {
    try { setIncludeClub(localStorage.getItem("savy_club_promos") === "1"); } catch {}
    const needs = loadPantryNeeds();
    if (needs.size) {
      setChecked((prev) => {
        const next = { ...prev };
        for (const r of pantry) if (needs.has(r.key)) next[r.key] = true;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (r: ResolvedIngredient) => {
    setChecked((prev) => {
      const nowChecked = !prev[r.key];
      if (r.pantry) {
        const needs = loadPantryNeeds();
        if (nowChecked) needs.add(r.key); else needs.delete(r.key);
        savePantryNeeds(needs);
      }
      return { ...prev, [r.key]: nowChecked };
    });
  };

  const selected = buyable.filter((r) => checked[r.key]);

  // live chain comparison, debounced on selection changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!selected.length) { setChains([]); setLoading(false); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/list/by-chain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: selected.map((r) => ({ productId: r.product!.id, qty: r.units })) }),
        });
        const data = await res.json();
        setChains(data.chains ?? []);
      } catch { setChains(null); }
      setLoading(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected.map((r) => r.key + ":" + r.units))]);

  const effectiveTotal = (c: ChainResult) =>
    includeClub ? (c.promoClubTotal ?? c.promoTotal ?? c.total) : (c.promoTotal ?? c.total);

  const ranked = useMemo(() => {
    if (!chains) return null;
    return [...chains]
      .filter((c) => c.availableCount > 0)
      .sort((a, b) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : effectiveTotal(a) - effectiveTotal(b))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chains, includeClub]);

  const best = ranked?.[0];
  const complete = ranked?.filter((c) => c.missingCount === ranked[0].missingCount) ?? [];
  const spread = complete.length >= 2
    ? effectiveTotal(complete[complete.length - 1]) - effectiveTotal(complete[0])
    : 0;
  const perServing = best && servings > 0 ? effectiveTotal(best) / servings : null;

  const chainHe = (c: ChainResult) => {
    if (c.subchainName) return c.subchainName;
    return chainByName(c.chainName)?.he ?? c.chainName;
  };

  const addAllToList = () => {
    if (!selected.length) return;
    try {
      const raw = localStorage.getItem("savy-list");
      const list: { product: any; qty: number }[] = raw ? JSON.parse(raw) : [];
      for (const r of selected) {
        const ex = list.find((i) => i.product?.id === r.product!.id);
        if (ex) ex.qty += r.units;
        else list.push({ product: r.product, qty: r.units });
      }
      localStorage.setItem("savy-list", JSON.stringify(list));
      setToast(`${selected.length} מצרכים נוספו לסל ✓`);
      setTimeout(() => { window.location.href = "/?tab=list"; }, 900);
    } catch {
      setToast("שגיאה בהוספה לסל");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const shareWhatsApp = () => {
    const lines = [`🍳 כמה עולה להכין ${recipeTitle}?`];
    if (best) {
      lines.push(`הכי זול: ₪${effectiveTotal(best).toFixed(0)} ב${chainHe(best)}`);
      if (spread > 1) lines.push(`ההפרש בין הרשתות: ₪${spread.toFixed(0)} על אותו סל! 😳`);
    }
    lines.push("", `המתכון המלא + השוואת מחירים חיה:`, `https://savy.co.il/recipes/${window.location.pathname.split("/").pop()}`);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  const IngredientRow = ({ r }: { r: ResolvedIngredient }) => (
    <label className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition border ${checked[r.key] ? "bg-white border-emerald-200 shadow-sm" : "bg-stone-50 border-transparent opacity-70"}`}>
      <input type="checkbox" checked={!!checked[r.key]} onChange={() => toggle(r)}
        className="w-5 h-5 accent-emerald-600 shrink-0" />
      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
        {r.product?.imageUrl
          ? <img src={r.product.imageUrl} alt={r.he} loading="lazy" className="max-w-full max-h-full object-contain p-0.5" />
          : <span className="text-xl">{r.emoji}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-stone-800">
          {r.he} <span className="font-normal text-stone-400">· {r.amount}</span>
        </div>
        <div className="text-[11px] text-stone-400 truncate">
          {r.product!.name}{r.units > 1 ? ` ×${r.units}` : ""}
        </div>
      </div>
      <div className="text-left shrink-0">
        <div className="font-mono font-bold text-sm text-stone-700">₪{(Number(r.product!.minPrice) * r.units).toFixed(2)}</div>
        <a href={`/product/${r.product!.id}`} onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-emerald-600 hover:underline">השוואה ←</a>
      </div>
    </label>
  );

  return (
    <div>
      {/* ─── Ingredients with checkboxes ─── */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-black text-lg text-stone-800">🛒 מה צריך לקנות</h2>
          <span className="text-[11px] text-stone-400">סמנו רק מה שחסר לכם — המחיר מתעדכן מיד</span>
        </div>
        <div className="space-y-1.5">
          {mains.map((r) => <IngredientRow key={r.key} r={r} />)}
        </div>

        {pantry.length > 0 && (
          <>
            <h3 className="font-bold text-sm text-stone-500 mt-5 mb-2">
              🏠 מצרכי מזווה <span className="font-normal text-stone-400">— כנראה כבר יש לכם בבית. אין? סמנו ונוסיף לחשבון</span>
            </h3>
            <div className="space-y-1.5">
              {pantry.map((r) => <IngredientRow key={r.key} r={r} />)}
            </div>
          </>
        )}

        {unresolved.length > 0 && (
          <div className="mt-4 text-xs text-stone-400 bg-stone-50 rounded-xl p-3">
            לא נכללו בחישוב (לא נמצאו במאגר המחירים): {unresolved.map((r) => `${r.emoji} ${r.he}`).join(", ")}
          </div>
        )}
      </section>

      {/* ─── Live chain comparison ─── */}
      <section className="mb-6">
        <h2 className="font-black text-lg text-stone-800 mb-1">⚖️ איפה הסל של המתכון הכי זול?</h2>
        <p className="text-[11px] text-stone-400 mb-3">
          השוואה חיה על {selected.length} המצרכים שסימנתם · הסניף המשתלם בכל רשת · כולל מבצעים שהסל עומד בתנאיהם
        </p>

        <label className="flex items-center gap-2 mb-3 text-xs text-stone-500 cursor-pointer">
          <input type="checkbox" checked={includeClub}
            onChange={(e) => { setIncludeClub(e.target.checked); try { localStorage.setItem("savy_club_promos", e.target.checked ? "1" : "0"); } catch {} }}
            className="w-4 h-4 accent-emerald-600" />
          כללו גם מבצעי מועדון (חינם להצטרפות ברוב הרשתות)
        </label>

        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && (!ranked || !ranked.length) && (
          <div className="text-sm text-stone-400 bg-stone-50 rounded-2xl p-4 text-center">
            {selected.length ? "לא הצלחנו לטעון את ההשוואה — נסו לרענן" : "סמנו לפחות מצרך אחד כדי להשוות"}
          </div>
        )}

        {!loading && ranked && ranked.length > 0 && (
          <>
            {spread > 1 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-3 text-sm text-emerald-800">
                💸 <strong>ההפרש בין הרשתות על הסל הזה: ₪{spread.toFixed(0)}</strong> — אותם מוצרים בדיוק.
              </div>
            )}
            <div className="space-y-2">
              {ranked.map((c, i) => {
                const eff = effectiveTotal(c);
                const diff = eff - effectiveTotal(ranked[0]);
                const hasPromo = eff < c.total - 0.01;
                return (
                  <div key={c.chainName + c.storeName}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 ${i === 0 ? "bg-white border-emerald-300 shadow-md" : "bg-white border-stone-100 shadow-sm"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-400"}`}>
                      {i === 0 ? "🏆" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-stone-800">{chainHe(c)}</div>
                      <div className="text-[11px] text-stone-400 truncate">{c.storeName}{c.city ? ` · ${c.city}` : ""}</div>
                      {c.missingCount > 0 && (
                        <div className="text-[10px] text-amber-500">חסרים {c.missingCount} מצרכים ברשת זו</div>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <div className={`font-mono font-black text-lg ${i === 0 ? "text-emerald-600" : "text-stone-700"}`}>₪{eff.toFixed(2)}</div>
                      {hasPromo && <div className="text-[10px] text-rose-500 line-through font-mono">₪{c.total.toFixed(2)}</div>}
                      {i > 0 && diff > 0.01 && <div className="text-[10px] text-stone-400">+₪{diff.toFixed(0)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {perServing != null && (
              <div className="text-center text-sm text-stone-500 mt-3">
                יוצא <strong className="text-stone-700">₪{perServing.toFixed(2)} למנה</strong> במחיר הזול ביותר 👨‍🍳
              </div>
            )}
          </>
        )}
      </section>

      {/* ─── Actions ─── */}
      <section className="flex gap-2 mb-2">
        <button onClick={addAllToList} disabled={!selected.length}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-2xl py-3.5 text-sm transition shadow-sm">
          ➕ הוסיפו {selected.length} מצרכים לסל שלי
        </button>
        <button onClick={shareWhatsApp}
          className="bg-[#25D366] hover:brightness-95 text-white font-bold rounded-2xl px-4 text-sm transition shadow-sm"
          aria-label="שיתוף בוואטסאפ">
          וואטסאפ 💬
        </button>
      </section>
      <p className="text-[10px] text-stone-300 text-center mb-6">הסל ייפתח בהשוואת הסניפים המלאה — כולל לפי מיקום</p>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-sm rounded-full px-5 py-2.5 shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
