"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

interface Product {
  id: number; barcode: string; name: string; brand: string;
  unitQty: string; unitMeasure: string; matchScore: number;
  minPrice: number | null; maxPrice: number | null; storeCount: number;
}
interface Price {
  price: number; isPromo: boolean; storeId: number;
  storeName: string; city: string; chainName: string;
}
interface ListItem { product: Product; qty: number; }
interface StoreResult {
  storeId: number; storeName: string; chainName: string; city: string;
  total: number; availableCount: number; missingCount: number;
  breakdown: { productId: number; price: number; qty: number; subtotal: number }[];
}

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  'Shufersal':    { he: 'שופרסל',        color: '#e11d48', logo: '/logos/shufersal.png' },
  'Rami Levy':    { he: 'רמי לוי',       color: '#2563eb', logo: '/logos/rami-levy.png' },
  'Victory':      { he: 'ויקטורי',       color: '#f59e0b', logo: '/logos/victory.png' },
  'Mega':         { he: 'מגה',           color: '#16a34a', logo: '/logos/mega.png' },
  'Osher Ad':     { he: 'אושר עד',       color: '#8b5cf6', logo: '/logos/osher-ad.png' },
  'Tiv Taam':     { he: 'טיב טעם',       color: '#ec4899', logo: '/logos/tiv-taam.png' },
  'Yochananof':   { he: 'יוחננוף',       color: '#0891b2', logo: '/logos/yochananof.png' },
  'Hazi Hinam':   { he: 'חצי חינם',      color: '#ea580c', logo: '/logos/hazi-hinam.png' },
  'Keshet Taamim':{ he: 'קשת טעמים',     color: '#059669', logo: '/logos/keshet-taamim.png' },
  'Freshmarket':  { he: 'פרשמרקט',       color: '#6366f1', logo: '/logos/freshmarket.png' },
  'Yayno Bitan':  { he: 'יינות ביתן',    color: '#dc2626', logo: '/logos/yayno-bitan.png' },
  'Dor Alon':     { he: 'דור אלון',      color: '#0d9488', logo: '/logos/dor-alon.png' },
  'Bareket':      { he: 'סופר ברקת',     color: '#a855f7', logo: '/logos/bareket.png' },
  'Yellow':       { he: 'ילו (כרפור)',   color: '#eab308', logo: '/logos/yellow.png' },
  'King Store':   { he: 'קינג סטור',     color: '#3b82f6', logo: '/logos/king-store.png' },
  'Mahsani Ashuk':{ he: 'מחסני השוק',    color: '#f97316', logo: '/logos/mahsani-ashuk.png' },
  'Zol Vebegadol':{ he: 'זול ובגדול',    color: '#22c55e', logo: '/logos/zol-vebegadol.png' },
  'Polizer':      { he: 'פוליצר',        color: '#14b8a6', logo: '/logos/polizer.png' },
  'City Market':  { he: 'סיטי מרקט',     color: '#6b7280', logo: '/logos/city-market.png' },
  'Good Pharm':   { he: 'גוד פארם',      color: '#10b981', logo: '/logos/good-pharm.png' },
  'Het Cohen':    { he: 'חט כהן',        color: '#7c3aed', logo: '' },
  'Maayan 2000':  { he: 'מעיין 2000',    color: '#0ea5e9', logo: '' },
  'Meshmat Yosef':{ he: 'משמת יוסף',     color: '#d97706', logo: '' },
  'Netiv Hased':  { he: 'נתיב החסד',     color: '#be185d', logo: '' },
  'Salach Dabach':{ he: 'סאלח דבאח',     color: '#b45309', logo: '' },
  'Shefa Barcart Ashem': { he: 'שפע ברכת השם', color: '#4f46e5', logo: '' },
  'Shuk Ahir':    { he: 'שוק אחיר',      color: '#0369a1', logo: '' },
  'Stop Market':  { he: 'סטופ מרקט',     color: '#dc2626', logo: '' },
  'Super Sapir':  { he: 'סופר ספיר',     color: '#0284c7', logo: '' },
  'Super Yuda':   { he: 'סופר יודה',     color: '#15803d', logo: '' },
  'Wolt':         { he: 'וולט',          color: '#00c2e8', logo: '' },
  'Super Dosh':   { he: 'סופר דוש',      color: '#7e22ce', logo: '' },
};
const chainHe = (n: string) => CHAINS[n]?.he || n;
const chainClr = (n: string) => CHAINS[n]?.color || '#6b7280';
const chainLogo = (n: string) => CHAINS[n]?.logo || '';

function ChainBadge({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const logo = chainLogo(name);
  const color = chainClr(name);
  const he = chainHe(name);
  const s = size === 'lg' ? 120 : size === 'md' ? 126 : 120;
  const textClass = size === 'lg' ? 'font-black text-lg' : size === 'md' ? 'font-bold text-base' : 'font-bold text-sm';
  return (
    <span className="inline-flex items-center gap-2">
      {logo ? (
        <img src={logo} alt={he} width={s} height={s} className="rounded-lg object-contain shadow-sm" style={{ width: s, height: s }} />
      ) : (
        <span className="rounded-lg flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: color, width: s, height: s, fontSize: s * 0.4 }}>
          {he.charAt(0)}
        </span>
      )}
      <span className={textClass}>{he}</span>
    </span>
  );
}

const LOGO_CHAINS = Object.entries(CHAINS).filter(([_, v]) => v.logo).map(([k, v]) => ({ key: k, ...v }));

function LogoSlider() {
  const doubled = [...LOGO_CHAINS, ...LOGO_CHAINS];
  return (
    <div className="w-full overflow-hidden py-4 mb-2">
      <div className="flex items-center gap-8 animate-scroll" style={{ width: 'max-content' }}>
        {doubled.map((c, i) => (
          <div key={i} className="flex-shrink-0 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <img src={c.logo} alt={c.he} width={36} height={36} className="rounded-lg object-contain" style={{ width: 36, height: 36 }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

const CATEGORIES = [
  { emoji: '🥛', label: 'חלב ומוצריו', q: 'חלב' },
  { emoji: '🍞', label: 'לחם ומאפים', q: 'לחם' },
  { emoji: '🥩', label: 'בשר ועוף', q: 'עוף' },
  { emoji: '🥬', label: 'ירקות ופירות', q: 'עגבניה' },
  { emoji: '🥫', label: 'שימורים', q: 'טונה' },
  { emoji: '🧃', label: 'משקאות', q: 'מים מינרליים' },
  { emoji: '🍫', label: 'חטיפים', q: 'במבה' },
  { emoji: '☕', label: 'קפה ותה', q: 'קפה' },
  { emoji: '🧹', label: 'ניקיון', q: 'אקונומיקה' },
  { emoji: '🧴', label: 'טיפוח', q: 'שמפו' },
  { emoji: '👶', label: 'תינוקות', q: 'חיתול' },
  { emoji: '🐕', label: 'חיות מחמד', q: 'מזון כלבים' },
];

const QUICK = [
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
  const [showCats, setShowCats] = useState(false);
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'stores' | 'name'>('price');
  const db = useRef<any>(null);
  const [list, setList] = useState<ListItem[]>([]);
  const [listResults, setListResults] = useState<StoreResult[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [toast, setToast] = useState("");

  const search = useCallback((v: string) => {
    if (v.trim() === "") { setResults([]); return; }
    setLoading(true);
    api.search(v).then((d: any) => setResults(d.results || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onInput = (v: string) => { setQ(v); clearTimeout(db.current); db.current = setTimeout(() => search(v), 300); };

  const pick = (p: Product) => {
    setSel(p); setPLoading(true); setChainFilter(null);
    api.prices(p.id).then((d: any) => setPrices(d.prices || [])).catch(() => {}).finally(() => setPLoading(false));
  };

  const addToList = (p: Product) => {
    setList(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
    setToast(p.name); setTimeout(() => setToast(""), 2000);
  };

  const removeFromList = (id: number) => setList(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => { if (qty <= 0) { removeFromList(id); return; } setList(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i)); };

  useEffect(() => {
    if (list.length === 0) { setListResults([]); return; }
    setListLoading(true);
    api.list(list.map(i => ({ productId: i.product.id, qty: i.qty })))
      .then((d: any) => setListResults(d.bestStoreCandidates || []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [list]);

  const fp = prices.filter((p: Price) => chainFilter === null || p.chainName === chainFilter).sort((a, b) => a.price - b.price);
  const uChains = [...new Set(prices.map((p: Price) => p.chainName))].sort();
  const sorted = [...results].sort((a, b) => sortBy === 'price' ? (a.minPrice || 999) - (b.minPrice || 999) : sortBy === 'stores' ? (b.storeCount || 0) - (a.storeCount || 0) : a.name.localeCompare(b.name, 'he'));
  const cheap = fp.length ? Math.min(...fp.map(p => p.price)) : 0;
  const exp = fp.length ? Math.max(...fp.map(p => p.price)) : 0;

  return (
    <div className="pb-20">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium">✓ {toast} נוסף לרשימה</div>}

      <section className="text-center pt-6 pb-2">
        <h2 className="font-black text-4xl bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent leading-tight pb-1">כמה אתם באמת משלמים?</h2>
        <p className="text-stone-400 text-sm mt-2">משווים מחירים ברשתות השיווק בישראל. בזמן אמת. בחינם.</p>
      </section>

      {/* Logo Slider */}
      <LogoSlider />

      {/* Tabs */}
      <div className="flex justify-center gap-2 mt-2 mb-5">
        <button onClick={() => setTab('search')} className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all " + (tab === 'search' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}>🔍 חיפוש מוצר</button>
        <button onClick={() => setTab('list')} className={"px-6 py-2.5 rounded-full text-sm font-bold transition-all relative " + (tab === 'list' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200")}>
          🛒 רשימת קניות
          {list.length > 0 && <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{list.length}</span>}
        </button>
      </div>

      {/* ===== SEARCH TAB ===== */}
      {tab === 'search' && (
        <div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input value={q} onChange={e => onInput(e.target.value)} placeholder="חיפוש לפי שם מוצר, מותג או ברקוד..." className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-stone-200 bg-white shadow-sm text-base focus:outline-none focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-100 transition-all" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <button onClick={() => setShowCats(p => !p)} className={"px-4 py-1.5 rounded-full text-sm font-bold transition-all border-2 " + (showCats ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300")}>📂 קטגוריות</button>
              {QUICK.map(qs => (
                <button key={qs.q} onClick={() => { setQ(qs.q); search(qs.q); }} className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all">{qs.emoji} {qs.label}</button>
              ))}
            </div>
            {showCats && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.label} onClick={() => { setQ(c.q); search(c.q); setShowCats(false); }} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border-2 border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs font-medium text-stone-600">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          {results.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4 flex items-center gap-2 text-sm">
              <span className="text-stone-400 text-xs">מיון:</span>
              {([['price', '💰 מחיר'], ['stores', '🏪 חנויות'], ['name', 'א-ב']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)} className={"px-3 py-1 rounded-full text-xs font-medium transition " + (sortBy === k ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500")}>{l}</button>
              ))}
              <span className="text-stone-300 text-xs mr-auto">{results.length} תוצאות</span>
            </div>
          )}

          {/* Results + Prices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Product list */}
            <div className="space-y-2">
              {loading && <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div><div className="text-stone-400 mt-3">מחפש...</div></div>}

              {sorted.map((p: Product) => (
                <div key={p.id} className={"rounded-2xl border-2 transition-all bg-white " + (sel?.id === p.id ? "border-emerald-500 shadow-lg shadow-emerald-100" : "border-transparent shadow hover:shadow-md")}>
                  <button onClick={() => pick(p)} className="w-full text-right p-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="font-bold text-stone-800 truncate">{p.name}</div>
                        <div className="text-xs text-stone-400 mt-1">{p.brand}{p.unitQty && p.unitQty !== '0' ? ` · ${p.unitQty} ${p.unitMeasure}` : ''}</div>
                      </div>
                      <div className="text-left shrink-0 mr-4">
                        {p.minPrice && <div className="font-mono font-black text-xl text-emerald-600">₪{Number(p.minPrice).toFixed(2)}</div>}
                        {p.maxPrice && p.minPrice && p.maxPrice > p.minPrice && <div className="text-[10px] text-stone-400">עד ₪{Number(p.maxPrice).toFixed(2)}</div>}
                        <div className="text-[10px] text-stone-400 mt-0.5">{p.storeCount} חנויות</div>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-3">
                    <button onClick={() => addToList(p)} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition">+ הוסף לרשימה</button>
                  </div>
                </div>
              ))}

              {!loading && q.trim() === "" && <div className="text-center py-16"><div className="text-5xl mb-4">🛒</div><div className="text-stone-400 text-lg font-medium">חפשו מוצר או בחרו קטגוריה</div></div>}
              {!loading && q.trim() !== "" && results.length === 0 && <div className="text-center py-12"><div className="text-4xl mb-3">😅</div><div className="text-stone-400">לא מצאנו תוצאות</div></div>}
            </div>

            {/* Price panel */}
            <div>
              {sel ? (
                <div className="rounded-2xl border-2 border-stone-100 bg-white overflow-hidden sticky top-16 shadow-lg">
                  <div className="p-5 bg-gradient-to-l from-emerald-50 via-white to-white border-b">
                    <div className="font-black text-xl text-stone-800">{sel.name}</div>
                    <div className="text-sm text-stone-400 mt-1">{sel.brand}{sel.barcode && <span className="text-stone-300"> · {sel.barcode}</span>}</div>
                    {fp.length > 0 && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">🏷️ הכי זול: ₪{cheap.toFixed(2)}</div>
                        {exp > cheap && <div className="text-xs text-stone-400">עד ₪{exp.toFixed(2)} · הפרש {((exp - cheap) / cheap * 100).toFixed(0)}%</div>}
                      </div>
                    )}
                  </div>

                  {/* Chain filter */}
                  {uChains.length > 1 && (
                    <div className="px-5 py-3 bg-stone-50 border-b flex flex-wrap gap-1.5">
                      <button onClick={() => setChainFilter(null)} className={"px-2.5 py-1 rounded-full text-[11px] font-medium transition " + (chainFilter === null ? "bg-emerald-600 text-white" : "bg-white text-stone-500 hover:bg-stone-100")}>הכל ({prices.length})</button>
                      {uChains.map((ch: string) => {
                        const cnt = prices.filter(p => p.chainName === ch).length;
                        const logo = chainLogo(ch);
                        return (
                          <button key={ch} onClick={() => setChainFilter(chainFilter === ch ? null : ch)}
                            className={"px-2.5 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1 " + (chainFilter === ch ? "text-white" : "bg-white text-stone-500 hover:bg-stone-100")}
                            style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}>
                            {logo && <img src={logo} alt="" width={14} height={14} className="rounded-sm" />}
                            {chainHe(ch)} ({cnt})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Price bar */}
                  {fp.length > 1 && (
                    <div className="px-5 py-2 border-b">
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <span>₪{cheap.toFixed(2)}</span>
                        <div className="flex-1 h-2 rounded-full bg-gradient-to-l from-red-300 via-yellow-200 to-emerald-300"></div>
                        <span>₪{exp.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Prices */}
                  <div className="max-h-[50vh] overflow-y-auto">
                    {pLoading ? (
                      <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
                    ) : fp.length === 0 ? (
                      <div className="p-8 text-center text-stone-300">אין מחירים</div>
                    ) : fp.map((p: Price, i: number) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                      const pct = cheap > 0 ? ((p.price - cheap) / cheap * 100) : 0;
                      return (
                        <div key={i} className={"p-4 border-b border-stone-50 flex justify-between items-center hover:bg-stone-50 transition " + (i === 0 ? "bg-emerald-50/50" : "")}>
                          <div className="flex items-center gap-3">
                            {medal && <span className="text-lg">{medal}</span>}
                            <div>
                              <ChainBadge name={p.chainName} size="sm" />
                              <div className="text-xs text-stone-400 mt-0.5">
                                {p.storeName} · {p.city}
                                {pct > 0 && <span className="text-red-400 mr-2"> +{pct.toFixed(0)}%</span>}
                              </div>
                            </div>
                          </div>
                          <div className={"font-mono text-lg font-black " + (i === 0 ? "text-emerald-600" : p.price === exp ? "text-red-400" : "text-stone-700")}>₪{Number(p.price).toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20"><div className="text-5xl mb-4">📊</div><div className="text-stone-300 text-lg">בחרו מוצר לראות השוואת מחירים</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== LIST TAB ===== */}
      {tab === 'list' && (
        <div>
          {list.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-bold text-stone-700">הרשימה ריקה</div>
              <div className="text-stone-400 mt-2">חפשו מוצרים והוסיפו אותם לרשימה</div>
              <button onClick={() => setTab('search')} className="mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">🔍 חיפוש מוצרים</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* List items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-xl text-stone-800">🛒 הרשימה שלי ({list.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setTab('search')} className="text-sm px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition">+ הוסף</button>
                    <button onClick={() => { setList([]); setListResults([]); }} className="text-sm px-4 py-2 rounded-full bg-red-50 text-red-500 font-medium hover:bg-red-100 transition">🗑️ נקה</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {list.map(item => (
                    <div key={item.product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-stone-800 truncate">{item.product.name}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{item.product.minPrice && <>מ-₪{Number(item.product.minPrice).toFixed(2)}</>}{item.product.brand && <> · {item.product.brand}</>}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mr-3">
                        <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-200">-</button>
                        <span className="w-8 text-center font-bold text-lg">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 hover:bg-emerald-200">+</button>
                        <button onClick={() => removeFromList(item.product.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 mr-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best stores */}
              <div>
                <h3 className="font-black text-xl text-stone-800 mb-4">🏆 הסל הכי משתלם</h3>
                {listLoading ? (
                  <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
                ) : listResults.length === 0 ? (
                  <div className="text-center py-12 text-stone-300"><div className="text-4xl mb-3">🔍</div><div>לא נמצאו חנויות</div></div>
                ) : (
                  <div className="space-y-3">
                    {listResults.map((store: StoreResult, i: number) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                      const sav = i > 0 ? (store.total - listResults[0].total).toFixed(2) : null;
                      return (
                        <div key={store.storeId} className={"rounded-2xl border-2 p-5 transition bg-white " + (i === 0 ? "border-emerald-500 shadow-lg shadow-emerald-100" : "border-stone-100 shadow-sm")}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {medal && <span className="text-2xl">{medal}</span>}
                              <div>
                                <ChainBadge name={store.chainName} size="lg" />
                                <div className="text-xs text-stone-400 mt-0.5">{store.storeName} · {store.city}</div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className={"font-mono font-black text-2xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                              {sav && <div className="text-xs text-red-400 font-medium">+₪{sav} יותר</div>}
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
                            <div className="mt-3 text-center text-sm font-bold text-emerald-600">💰 חוסכים ₪{(listResults[listResults.length - 1].total - store.total).toFixed(2)} לעומת הכי יקר</div>
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
