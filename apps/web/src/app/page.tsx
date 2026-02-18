"use client";
import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export default function Home() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [sel, setSel] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pLoading, setPLoading] = useState(false);
  const db = useRef(null);

  const search = useCallback((v) => {
    if (v.trim() === "") { setResults([]); return; }
    setLoading(true);
    api.search(v).then(d => setResults(d.results)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onInput = (v) => {
    setQ(v);
    clearTimeout(db.current);
    db.current = setTimeout(() => search(v), 300);
  };

  const pick = (p) => {
    setSel(p);
    setPLoading(true);
    api.prices(p.id).then(d => setPrices(d.prices)).catch(() => {}).finally(() => setPLoading(false));
  };

  const cheap = prices.length ? Math.min(...prices.map(p => p.price)) : 0;

  return (
    <div>
      <section className="text-center pt-8 pb-4">
        <h2 className="font-black text-3xl text-stone-900">כמה אתם באמת משלמים?</h2>
        <p className="text-stone-400 text-sm mt-2">בודקים מחירים ב-18 רשתות. בזמן אמת. בחינם.</p>
        <div className="max-w-xl mx-auto mt-5">
          <input
            value={q}
            onChange={e => onInput(e.target.value)}
            placeholder="מה מחפשים? חלב, במבה, קפה..."
            className="w-full px-5 py-3 rounded-xl border shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Results */}
        <div className="space-y-2">
          {loading && <div className="text-center py-8 text-stone-400">🔍 מחפש...</div>}

          {results.length > 0 && results.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className={"w-full text-right p-3 rounded-xl border transition " + (sel && sel.id === p.id ? "ring-2 ring-green-500 bg-green-50" : "bg-white hover:shadow")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{p.brand}</div>
                </div>
                <div className="text-left shrink-0">
                  {p.minPrice && <div className="font-mono font-bold text-green-700">₪{Number(p.minPrice).toFixed(2)}</div>}
                  <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                </div>
              </div>
            </button>
          ))}

          {q.trim() === "" && (
            <div className="text-center py-16 text-stone-300 text-lg">🛒 התחילו לחפש מוצר</div>
          )}

          {q.trim() !== "" && results.length === 0 && loading === false && (
            <div className="text-center py-12 text-stone-300">😅 לא מצאנו. נסו שם אחר</div>
          )}
        </div>

        {/* Prices */}
        <div>
          {sel ? (
            <div className="rounded-xl border bg-white overflow-hidden sticky top-16">
              <div className="p-4 bg-gradient-to-l from-green-50 to-white border-b">
                <div className="font-bold text-lg">{sel.name}</div>
                <div className="text-sm text-stone-400">{sel.brand}</div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {pLoading ? (
                  <div className="p-8 text-center text-stone-400">טוען...</div>
                ) : (
                  prices.map((p, i) => (
                    <div key={i} className="p-3 border-b flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{p.chainName} <span className="text-stone-400">{p.storeName}</span></div>
                        <div className="text-xs text-stone-400">{p.city}</div>
                      </div>
                      <div className={"font-mono text-lg " + (p.price === cheap ? "text-green-600 font-bold" : "text-stone-700")}>
                        ₪{Number(p.price).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-stone-300">📊 בחרו מוצר לראות מחירים</div>
          )}
        </div>
      </div>
    </div>
  );
}
