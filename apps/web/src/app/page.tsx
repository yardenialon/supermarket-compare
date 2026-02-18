"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  unitQty: string;
  unitMeasure: string;
  matchScore: number;
  minPrice: number | null;
  maxPrice: number | null;
  storeCount: number;
}

interface Price {
  price: number;
  isPromo: boolean;
  storeId: number;
  storeName: string;
  city: string;
  chainName: string;
  distanceKm: number | null;
}

interface ListItem {
  product: Product;
  qty: number;
}

interface StoreResult {
  storeId: number;
  storeName: string;
  chainName: string;
  city: string;
  total: number;
  availableCount: number;
  missingCount: number;
  breakdown: { productId: number; price: number; qty: number; subtotal: number }[];
}

const CHAIN_COLORS: Record<string, string> = {
  'Shufersal': '#e11d48',
  'Rami Levy': '#2563eb',
  'Victory': '#f59e0b',
  'Mega': '#16a34a',
  'Osher Ad': '#8b5cf6',
  'Tiv Taam': '#ec4899',
  'Yochananof': '#0891b2',
  'Hazi Hinam': '#ea580c',
  'Keshet Taamim': '#059669',
  'Freshmarket': '#6366f1',
};

const QUICK_SEARCHES = [
  { emoji: '🥛', label: 'חלב', q: 'חלב' },
  { emoji: '🍞', label: 'לחם', q: 'לחם' },
  { emoji: '🥚', label: 'ביצים', q: 'ביצים' },
  { emoji: '🧀', label: 'גבינה', q: 'גבינה צהובה' },
  { emoji: '🍌', label: 'בננה', q: 'בננה' },
  { emoji: '🍫', label: 'במבה', q: 'במבה' },
  { emoji: '☕', label: 'קפה', q: 'קפה' },
  { emoji: '🧴', label: 'שמפו', q: 'שמפו' },
];

export default function Home() {
  const [tab, setTab] = useState<'search' | 'list'>('search');
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [sel, setSel] = useState<Product | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [pLoading, setPLoading] = useState(false);
  const db = useRef<any>(null);

  // Shopping list state
  const [list, setList] = useState<ListItem[]>([]);
  const [listResults, setListResults] = useState<StoreResult[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [showAddToast, setShowAddToast] = useState("");

  const search = useCallback((v: string) => {
    if (v.trim() === "") { setResults([]); return; }
    setLoading(true);
    api.search(v).then((d: any) => setResults(d.results || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onInput = (v: string) => {
    setQ(v);
    clearTimeout(db.current);
    db.current = setTimeout(() => search(v), 300);
  };

  const quickSearch = (qs: typeof QUICK_SEARCHES[0]) => {
    setQ(qs.q);
    search(qs.q);
  };

  const pick = (p: Product) => {
    setSel(p);
    setPLoading(true);
    api.prices(p.id).then((d: any) => setPrices(d.prices || [])).catch(() => {}).finally(() => setPLoading(false));
  };

  const addToList = (p: Product) => {
    setList(prev => {
      const exists = prev.find(i => i.product.id === p.id);
      if (exists) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
    setShowAddToast(p.name);
    setTimeout(() => setShowAddToast(""), 2000);
  };

  const removeFromList = (id: number) => {
    setList(prev => prev.filter(i => i.product.id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { removeFromList(id); return; }
    setList(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  };

  const findCheapest = async () => {
    if (list.length === 0) return;
    setListLoading(true);
    try {
      const items = list.map(i => ({ productId: i.product.id, qty: i.qty }));
      const data = await api.list(items);
      setListResults(data.bestStoreCandidates || []);
    } catch (e) {
      console.error(e);
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (list.length > 0) findCheapest();
    else setListResults([]);
  }, [list]);

  const cheap = prices.length ? Math.min(...prices.map((p: Price) => p.price)) : 0;
  const expensive = prices.length ? Math.max(...prices.map((p: Price) => p.price)) : 0;

  return (
    <div className="pb-20">
      {/* Toast */}
      {showAddToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium animate-bounce">
          ✓ {showAddToast} נוסף לרשימה
        </div>
      )}

      {/* Hero */}
      <section className="text-center pt-6 pb-2">
        <h2 className="font-black text-4xl bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent leading-tight pb-1">
          כמה אתם באמת משלמים?
        </h2>
        <p className="text-stone-400 text-sm mt-2">בודקים מחירים ב-18 רשתות שיווק. בזמן אמת. בחינם.</p>
      </section>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mt-4 mb-6">
        <button
          onClick={() => setTab('search')}
          className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all " +
            (tab === 'search' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}
        >
          🔍 חיפוש מוצר
        </button>
        <button
          onClick={() => setTab('list')}
          className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all relative " +
            (tab === 'list' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}
        >
          🛒 רשימת קניות
          {list.length > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {list.length}
            </span>
          )}
        </button>
      </div>

      {/* ====== SEARCH TAB ====== */}
      {tab === 'search' && (
        <div>
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                value={q}
                onChange={e => onInput(e.target.value)}
                placeholder="מה מחפשים? חלב, במבה, קפה..."
                className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-stone-200 bg-white shadow-sm text-base focus:outline-none focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-100 transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
            </div>

            {/* Quick search chips */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {QUICK_SEARCHES.map(qs => (
                <button
                  key={qs.q}
                  onClick={() => quickSearch(qs)}
                  className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                >
                  {qs.emoji} {qs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <div className="text-stone-400 mt-3">מחפש...</div>
                </div>
              )}

              {results.length > 0 && results.map((p: Product) => (
                <div key={p.id} className={"rounded-2xl border-2 transition-all bg-white " + (sel && sel.id === p.id ? "border-emerald-500 shadow-lg shadow-emerald-100" : "border-transparent shadow hover:shadow-md")}>
                  <button
                    onClick={() => pick(p)}
                    className="w-full text-right p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="font-bold text-stone-800 truncate">{p.name}</div>
                        <div className="text-xs text-stone-400 mt-1">{p.brand} {p.unitQty && p.unitQty !== '0' ? `· ${p.unitQty} ${p.unitMeasure}` : ''}</div>
                      </div>
                      <div className="text-left shrink-0 mr-4">
                        {p.minPrice && (
                          <div className="font-mono font-black text-xl text-emerald-600">₪{Number(p.minPrice).toFixed(2)}</div>
                        )}
                        <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex gap-2">
                    <button
                      onClick={() => addToList(p)}
                      className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition"
                    >
                      + הוסף לרשימה
                    </button>
                  </div>
                </div>
              ))}

              {loading === false && q.trim() === "" && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🛒</div>
                  <div className="text-stone-300 text-lg">התחילו לכתוב שם מוצר</div>
                  <div className="text-stone-300 text-sm mt-1">אנחנו נעשה את השאר</div>
                </div>
              )}

              {loading === false && q.trim() !== "" && results.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">😅</div>
                  <div className="text-stone-400">לא מצאנו את זה</div>
                  <div className="text-stone-300 text-sm mt-1">נסו שם אחר או ברקוד</div>
                </div>
              )}
            </div>

            {/* Price panel */}
            <div>
              {sel ? (
                <div className="rounded-2xl border-2 border-stone-100 bg-white overflow-hidden sticky top-16 shadow-lg">
                  <div className="p-5 bg-gradient-to-l from-emerald-50 via-white to-white border-b">
                    <div className="font-black text-xl text-stone-800">{sel.name}</div>
                    <div className="text-sm text-stone-400 mt-1">{sel.brand}</div>
                    {prices.length > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                          🏷️ הכי זול: ₪{cheap.toFixed(2)}
                        </div>
                        {expensive > cheap && (
                          <div className="text-xs text-stone-400">
                            עד ₪{expensive.toFixed(2)} (+{((expensive - cheap) / cheap * 100).toFixed(0)}%)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price bar */}
                  {prices.length > 1 && (
                    <div className="px-5 py-3 bg-stone-50 border-b">
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <span>₪{cheap.toFixed(2)}</span>
                        <div className="flex-1 h-2 rounded-full bg-gradient-to-l from-red-300 via-yellow-200 to-emerald-300"></div>
                        <span>₪{expensive.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[55vh] overflow-y-auto">
                    {pLoading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      prices.map((p: Price, i: number) => {
                        const chainColor = CHAIN_COLORS[p.chainName] || '#6b7280';
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                        return (
                          <div key={i} className={"p-4 border-b border-stone-50 flex justify-between items-center hover:bg-stone-50 transition " + (i === 0 ? "bg-emerald-50/50" : "")}>
                            <div className="flex items-center gap-3">
                              {medal && <span className="text-lg">{medal}</span>}
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chainColor }}></div>
                                  <span className="font-bold text-sm">{p.chainName}</span>
                                  <span className="text-stone-400 text-sm">{p.storeName}</span>
                                </div>
                                <div className="text-xs text-stone-400 mt-0.5">{p.city}</div>
                              </div>
                            </div>
                            <div className={"font-mono text-lg font-black " + (p.price === cheap ? "text-emerald-600" : p.price === expensive ? "text-red-400" : "text-stone-700")}>
                              ₪{Number(p.price).toFixed(2)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📊</div>
                  <div className="text-stone-300 text-lg">בחרו מוצר לראות מחירים</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== LIST TAB ====== */}
      {tab === 'list' && (
        <div>
          {/* Add items prompt */}
          {list.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-bold text-stone-700">הרשימה ריקה</div>
              <div className="text-stone-400 mt-2">חפשו מוצרים בלשונית חיפוש והוסיפו אותם לרשימה</div>
              <button onClick={() => setTab('search')} className="mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">
                🔍 חיפוש מוצרים
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* List items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-xl text-stone-800">🛒 הרשימה שלי ({list.length} מוצרים)</h3>
                  <button onClick={() => setTab('search')} className="text-sm px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition">
                    + הוסף מוצר
                  </button>
                </div>

                <div className="space-y-2">
                  {list.map(item => (
                    <div key={item.product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-stone-800 truncate">{item.product.name}</div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {item.product.minPrice && <>מ-₪{Number(item.product.minPrice).toFixed(2)}</>}
                          {item.product.brand && <> · {item.product.brand}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mr-3">
                        <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-200 transition">-</button>
                        <span className="w-8 text-center font-bold text-lg">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 hover:bg-emerald-200 transition">+</button>
                        <button onClick={() => removeFromList(item.product.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition mr-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best stores */}
              <div>
                <h3 className="font-black text-xl text-stone-800 mb-4">🏆 הסל הכי משתלם</h3>

                {listLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="text-stone-400 mt-3">מחשב...</div>
                  </div>
                ) : listResults.length === 0 ? (
                  <div className="text-center py-12 text-stone-300">
                    <div className="text-4xl mb-3">🔍</div>
                    <div>לא נמצאו חנויות עם כל המוצרים</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listResults.map((store: StoreResult, i: number) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                      const chainColor = CHAIN_COLORS[store.chainName] || '#6b7280';
                      const savings = i > 0 ? (listResults[i].total - listResults[0].total).toFixed(2) : null;

                      return (
                        <div key={store.storeId} className={"rounded-2xl border-2 p-5 transition bg-white " + (i === 0 ? "border-emerald-500 shadow-lg shadow-emerald-100" : "border-stone-100 shadow-sm")}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {medal && <span className="text-2xl">{medal}</span>}
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chainColor }}></div>
                                  <span className="font-black text-lg">{store.chainName}</span>
                                </div>
                                <div className="text-xs text-stone-400 mt-0.5">{store.storeName} · {store.city}</div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className={"font-mono font-black text-2xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>
                                ₪{store.total.toFixed(2)}
                              </div>
                              {savings && (
                                <div className="text-xs text-red-400 font-medium">+₪{savings} יותר יקר</div>
                              )}
                            </div>
                          </div>

                          {/* Available / Missing */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              ✓ {store.availableCount} מוצרים נמצאו
                            </div>
                            {store.missingCount > 0 && (
                              <div className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-500 font-medium">
                                ✕ {store.missingCount} חסרים
                              </div>
                            )}
                          </div>

                          {/* Price breakdown */}
                          {i === 0 && store.breakdown && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                              <div className="text-xs font-bold text-stone-500 mb-2">פירוט:</div>
                              {store.breakdown.map((b: any) => {
                                const prod = list.find(l => l.product.id === b.productId);
                                return (
                                  <div key={b.productId} className="flex justify-between text-xs text-stone-500 py-0.5">
                                    <span>{prod ? prod.product.name : `מוצר #${b.productId}`} ×{b.qty}</span>
                                    <span className="font-mono">₪{b.subtotal.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {i === 0 && (
                            <div className="mt-3 text-center">
                              <div className="text-sm font-bold text-emerald-600">
                                💰 {listResults.length > 1 ? `חוסכים ₪${(listResults[listResults.length - 1].total - store.total).toFixed(2)} לעומת הכי יקר` : 'המחיר הטוב ביותר'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
