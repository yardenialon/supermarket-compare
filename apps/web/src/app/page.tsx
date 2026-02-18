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
  'Shufersal': '#e11d48', 'Rami Levy': '#2563eb', 'Victory': '#f59e0b',
  'Mega': '#16a34a', 'Osher Ad': '#8b5cf6', 'Tiv Taam': '#ec4899',
  'Yochananof': '#0891b2', 'Hazi Hinam': '#ea580c', 'Keshet Taamim': '#059669',
  'Freshmarket': '#6366f1', 'Yayno Bitan': '#dc2626', 'Dor Alon': '#0d9488',
  'Bareket': '#a855f7', 'Yellow': '#eab308', 'King Store': '#3b82f6',
  'Mahsani Ashuk': '#f97316', 'Zol Vebegadol': '#22c55e', 'Polizer': '#14b8a6',
};

const CATEGORIES = [
  { emoji: '🥛', label: 'חלב ומוצריו', terms: ['חלב', 'יוגורט', 'שמנת', 'גבינה', 'קוטג', 'לבן', 'שוקו'] },
  { emoji: '🍞', label: 'לחם ומאפים', terms: ['לחם', 'פיתה', 'לחמניה', 'חלה', 'באגט', 'טוסט'] },
  { emoji: '🥩', label: 'בשר ועוף', terms: ['עוף', 'חזה', 'שניצל', 'בקר', 'כבש', 'טחון', 'נקניק', 'נקניקיה'] },
  { emoji: '🥬', label: 'ירקות ופירות', terms: ['עגבניה', 'מלפפון', 'תפוח', 'בננה', 'גזר', 'בצל', 'תפוז', 'אבוקדו'] },
  { emoji: '🥫', label: 'שימורים ורטבים', terms: ['טונה', 'תירס', 'רסק', 'קטשופ', 'מיונז', 'חומוס', 'טחינה'] },
  { emoji: '🧃', label: 'משקאות', terms: ['מים', 'מיץ', 'קולה', 'בירה', 'יין', 'סודה', 'אנרגיה'] },
  { emoji: '🍫', label: 'חטיפים ומתוקים', terms: ['במבה', 'ביסלי', 'שוקולד', 'עוגיות', 'וופל', 'סוכריה', 'גלידה'] },
  { emoji: '☕', label: 'קפה ותה', terms: ['קפה', 'נס', 'אספרסו', 'תה', 'קפסולות'] },
  { emoji: '🧹', label: 'ניקיון', terms: ['אקונומיקה', 'סבון', 'נוזל כלים', 'מרכך', 'אבקת כביסה', 'מגבונים'] },
  { emoji: '🧴', label: 'טיפוח', terms: ['שמפו', 'מרכך', 'סבון', 'דאודורנט', 'משחת שיניים', 'קרם'] },
  { emoji: '👶', label: 'תינוקות', terms: ['חיתול', 'מטרנה', 'סימילאק', 'מגבונים לחים', 'מוצץ'] },
  { emoji: '🐕', label: 'חיות מחמד', terms: ['מזון כלבים', 'מזון חתולים', 'חטיף כלב'] },
];

const QUICK_SEARCHES = [
  { emoji: '🥛', label: 'חלב', q: 'חלב' },
  { emoji: '🍞', label: 'לחם', q: 'לחם' },
  { emoji: '🥚', label: 'ביצים', q: 'ביצים' },
  { emoji: '🧀', label: 'גבינה צהובה', q: 'גבינה צהובה' },
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
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'stores' | 'name'>('price');
  const db = useRef<any>(null);

  // Shopping list
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
    setSelectedCategory(null);
    clearTimeout(db.current);
    db.current = setTimeout(() => search(v), 300);
  };

  const quickSearch = (term: string) => {
    setQ(term);
    search(term);
  };

  const pickCategory = (cat: typeof CATEGORIES[0]) => {
    setSelectedCategory(cat.label);
    setShowCategories(false);
    setQ(cat.terms[0]);
    search(cat.terms[0]);
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

  const removeFromList = (id: number) => setList(prev => prev.filter(i => i.product.id !== id));

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
    } catch (e) { console.error(e); }
    setListLoading(false);
  };

  useEffect(() => {
    if (list.length > 0) findCheapest();
    else setListResults([]);
  }, [list]);

  // Filtered & sorted prices
  const filteredPrices = prices
    .filter((p: Price) => chainFilter === null || p.chainName === chainFilter)
    .sort((a: Price, b: Price) => a.price - b.price);

  const uniqueChains = [...new Set(prices.map((p: Price) => p.chainName))].sort();

  // Sorted results
  const sortedResults = [...results].sort((a: Product, b: Product) => {
    if (sortBy === 'price') return (a.minPrice || 999) - (b.minPrice || 999);
    if (sortBy === 'stores') return (b.storeCount || 0) - (a.storeCount || 0);
    return a.name.localeCompare(b.name, 'he');
  });

  const cheap = filteredPrices.length ? Math.min(...filteredPrices.map((p: Price) => p.price)) : 0;
  const expensive = filteredPrices.length ? Math.max(...filteredPrices.map((p: Price) => p.price)) : 0;

  return (
    <div className="pb-20">
      {/* Toast */}
      {showAddToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium" style={{animation: 'fadeInUp 0.3s ease'}}>
          ✓ {showAddToast} נוסף לרשימה
        </div>
      )}

      {/* Hero */}
      <section className="text-center pt-6 pb-2">
        <h2 className="font-black text-4xl bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent leading-tight pb-1">
          כמה אתם באמת משלמים?
        </h2>
        <p className="text-stone-400 text-sm mt-2">משווים מחירים ברשתות השיווק בישראל. בזמן אמת. בחינם.</p>
      </section>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mt-4 mb-5">
        <button onClick={() => setTab('search')}
          className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all " + (tab === 'search' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}>
          🔍 חיפוש מוצר
        </button>
        <button onClick={() => setTab('list')}
          className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all relative " + (tab === 'list' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}>
          🛒 רשימת קניות
          {list.length > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{list.length}</span>
          )}
        </button>
      </div>

      {/* ====== SEARCH TAB ====== */}
      {tab === 'search' && (
        <div>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input value={q} onChange={e => onInput(e.target.value)}
                placeholder="חיפוש לפי שם מוצר, מותג או ברקוד..."
                className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-stone-200 bg-white shadow-sm text-base focus:outline-none focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-100 transition-all" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
            </div>

            {/* Category button + Quick searches */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center items-center">
              <button onClick={() => setShowCategories(prev => (prev === false))}
                className={"px-4 py-1.5 rounded-full text-sm font-bold transition-all border-2 " + (showCategories ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300")}>
                📂 קטגוריות
              </button>
              {selectedCategory && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium flex items-center gap-1">
                  {selectedCategory}
                  <button onClick={() => { setSelectedCategory(null); setQ(''); setResults([]); }} className="mr-1 hover:text-emerald-900">✕</button>
                </span>
              )}
              {QUICK_SEARCHES.map(qs => (
                <button key={qs.q} onClick={() => quickSearch(qs.q)}
                  className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                  {qs.emoji} {qs.label}
                </button>
              ))}
            </div>

            {/* Category Grid */}
            {showCategories && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.label} onClick={() => pickCategory(cat)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border-2 border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium text-stone-600">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort bar */}
          {results.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4 flex items-center gap-2 text-sm">
              <span className="text-stone-400 text-xs">מיון:</span>
              {[
                { key: 'price' as const, label: '💰 מחיר' },
                { key: 'stores' as const, label: '🏪 חנויות' },
                { key: 'name' as const, label: 'א-ב שם' },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={"px-3 py-1 rounded-full text-xs font-medium transition " + (sortBy === s.key ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}>
                  {s.label}
                </button>
              ))}
              <span className="text-stone-300 text-xs mr-auto">{results.length} תוצאות</span>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <div className="text-stone-400 mt-3">מחפש...</div>
                </div>
              )}

              {sortedResults.length > 0 && sortedResults.map((p: Product) => (
                <div key={p.id} className={"rounded-2xl border-2 transition-all bg-white " + (sel && sel.id === p.id ? "border-emerald-500 shadow-lg shadow-emerald-100" : "border-transparent shadow hover:shadow-md")}>
                  <button onClick={() => pick(p)} className="w-full text-right p-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="font-bold text-stone-800 truncate">{p.name}</div>
                        <div className="text-xs text-stone-400 mt-1">
                          {p.brand && <span>{p.brand}</span>}
                          {p.unitQty && p.unitQty !== '0' && <span> · {p.unitQty} {p.unitMeasure}</span>}
                          {p.barcode && <span className="text-stone-300"> · {p.barcode}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0 mr-4">
                        {p.minPrice && <div className="font-mono font-black text-xl text-emerald-600">₪{Number(p.minPrice).toFixed(2)}</div>}
                        {p.maxPrice && p.minPrice && p.maxPrice > p.minPrice && (
                          <div className="text-[10px] text-stone-400">עד ₪{Number(p.maxPrice).toFixed(2)}</div>
                        )}
                        <div className="text-[10px] text-stone-400 mt-0.5">{p.storeCount} חנויות</div>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-3">
                    <button onClick={() => addToList(p)}
                      className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition">
                      + הוסף לרשימה
                    </button>
                  </div>
                </div>
              ))}

              {loading === false && q.trim() === "" && selectedCategory === null && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🛒</div>
                  <div className="text-stone-400 text-lg font-medium">חפשו מוצר או בחרו קטגוריה</div>
                  <div className="text-stone-300 text-sm mt-1">נשווה מחירים ונמצא את המקום הכי זול</div>
                </div>
              )}

              {loading === false && q.trim() !== "" && results.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">😅</div>
                  <div className="text-stone-400">לא מצאנו תוצאות</div>
                  <div className="text-stone-300 text-sm mt-1">נסו שם אחר, מותג, או ברקוד</div>
                </div>
              )}
            </div>

            {/* Price Panel */}
            <div>
              {sel ? (
                <div className="rounded-2xl border-2 border-stone-100 bg-white overflow-hidden sticky top-16 shadow-lg">
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-l from-emerald-50 via-white to-white border-b">
                    <div className="font-black text-xl text-stone-800">{sel.name}</div>
                    <div className="text-sm text-stone-400 mt-1">{sel.brand} {sel.barcode && <span className="text-stone-300">· ברקוד: {sel.barcode}</span>}</div>
                    {filteredPrices.length > 0 && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                          🏷️ הכי זול: ₪{cheap.toFixed(2)}
                        </div>
                        {expensive > cheap && (
                          <div className="text-xs text-stone-400">
                            עד ₪{expensive.toFixed(2)} · הפרש {((expensive - cheap) / cheap * 100).toFixed(0)}%
                          </div>
                        )}
                        <div className="text-xs text-stone-400">
                          {filteredPrices.length} מחירים
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chain filter */}
                  {uniqueChains.length > 1 && (
                    <div className="px-5 py-3 bg-stone-50 border-b flex flex-wrap gap-1.5">
                      <button onClick={() => setChainFilter(null)}
                        className={"px-2.5 py-1 rounded-full text-[11px] font-medium transition " + (chainFilter === null ? "bg-emerald-600 text-white" : "bg-white text-stone-500 hover:bg-stone-100")}>
                        הכל ({prices.length})
                      </button>
                      {uniqueChains.map((chain: string) => {
                        const count = prices.filter((p: Price) => p.chainName === chain).length;
                        const color = CHAIN_COLORS[chain] || '#6b7280';
                        return (
                          <button key={chain} onClick={() => setChainFilter(chainFilter === chain ? null : chain)}
                            className={"px-2.5 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1 " + (chainFilter === chain ? "text-white" : "bg-white text-stone-500 hover:bg-stone-100")}
                            style={chainFilter === chain ? { backgroundColor: color } : {}}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                            {chain} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Price bar */}
                  {filteredPrices.length > 1 && (
                    <div className="px-5 py-2 border-b">
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <span>₪{cheap.toFixed(2)}</span>
                        <div className="flex-1 h-2 rounded-full bg-gradient-to-l from-red-300 via-yellow-200 to-emerald-300"></div>
                        <span>₪{expensive.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Price list */}
                  <div className="max-h-[50vh] overflow-y-auto">
                    {pLoading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      </div>
                    ) : filteredPrices.length === 0 ? (
                      <div className="p-8 text-center text-stone-300">אין מחירים לרשת זו</div>
                    ) : (
                      filteredPrices.map((p: Price, i: number) => {
                        const chainColor = CHAIN_COLORS[p.chainName] || '#6b7280';
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                        const pctFromCheap = cheap > 0 ? ((p.price - cheap) / cheap * 100) : 0;
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
                                <div className="text-xs text-stone-400 mt-0.5">
                                  {p.city}
                                  {pctFromCheap > 0 && <span className="text-red-400 mr-2">+{pctFromCheap.toFixed(0)}%</span>}
                                </div>
                              </div>
                            </div>
                            <div className={"font-mono text-lg font-black " + (i === 0 ? "text-emerald-600" : p.price === expensive ? "text-red-400" : "text-stone-700")}>
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
                  <div className="text-stone-300 text-lg">בחרו מוצר לראות השוואת מחירים</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== LIST TAB ====== */}
      {tab === 'list' && (
        <div>
          {list.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-bold text-stone-700">הרשימה ריקה</div>
              <div className="text-stone-400 mt-2">חפשו מוצרים והוסיפו אותם לרשימה</div>
              <button onClick={() => setTab('search')} className="mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">
                🔍 חיפוש מוצרים
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-xl text-stone-800">🛒 הרשימה שלי ({list.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setTab('search')} className="text-sm px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition">
                      + הוסף
                    </button>
                    <button onClick={() => { setList([]); setListResults([]); }} className="text-sm px-4 py-2 rounded-full bg-red-50 text-red-500 font-medium hover:bg-red-100 transition">
                      🗑️ נקה
                    </button>
                  </div>
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

              {/* Results */}
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
                    <div>לא נמצאו חנויות</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listResults.map((store: StoreResult, i: number) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                      const chainColor = CHAIN_COLORS[store.chainName] || '#6b7280';
                      const savings = i > 0 ? (store.total - listResults[0].total).toFixed(2) : null;
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
                              <div className={"font-mono font-black text-2xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                              {savings && <div className="text-xs text-red-400 font-medium">+₪{savings} יותר</div>}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">✓ {store.availableCount} נמצאו</div>
                            {store.missingCount > 0 && <div className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-500 font-medium">✕ {store.missingCount} חסרים</div>}
                          </div>
                          {i === 0 && store.breakdown && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                              <div className="text-xs font-bold text-stone-500 mb-2">פירוט:</div>
                              {store.breakdown.map((b: any) => {
                                const prod = list.find(l => l.product.id === b.productId);
                                return (
                                  <div key={b.productId} className="flex justify-between text-xs text-stone-500 py-0.5">
                                    <span>{prod ? prod.product.name : `#${b.productId}`} ×{b.qty}</span>
                                    <span className="font-mono">₪{b.subtotal.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {i === 0 && listResults.length > 1 && (
                            <div className="mt-3 text-center text-sm font-bold text-emerald-600">
                              💰 חוסכים ₪{(listResults[listResults.length - 1].total - store.total).toFixed(2)} לעומת הכי יקר
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

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
