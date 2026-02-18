"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

interface Product { id: number; barcode: string; name: string; brand: string; unitQty: string; unitMeasure: string; matchScore: number; minPrice: number | null; maxPrice: number | null; storeCount: number; }
interface Price { price: number; isPromo: boolean; storeId: number; storeName: string; city: string; chainName: string; }
interface ListItem { product: Product; qty: number; }
interface StoreResult { storeId: number; storeName: string; chainName: string; city: string; total: number; availableCount: number; missingCount: number; breakdown: { productId: number; price: number; qty: number; subtotal: number }[]; }

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

/* ---- Logo component with fallback initial ---- */
function CLogo({ name, size = 40 }: { name: string; size?: number }) {
  const logo = chainLogo(name);
  const color = chainClr(name);
  const he = chainHe(name);
  if (logo) return <img src={logo} alt={he} width={size} height={size} className="object-contain" style={{ width: size, height: size, borderRadius: size > 40 ? 16 : 10 }} />;
  return <span className="flex items-center justify-center text-white font-black" style={{ backgroundColor: color, width: size, height: size, borderRadius: size > 40 ? 16 : 10, fontSize: size * 0.42 }}>{he.charAt(0)}</span>;
}

/* ---- Animated logo marquee ---- */
const LOGO_LIST = Object.entries(CHAINS).filter(([_, v]) => v.logo).map(([k, v]) => ({ key: k, ...v }));
function LogoMarquee() {
  const items = [...LOGO_LIST, ...LOGO_LIST, ...LOGO_LIST];
  return (
    <div className="relative w-full overflow-hidden py-5 -mt-2" style={{ maskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div className="flex gap-8 items-center marquee-track">
        {items.map((c, i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-1.5 group cursor-default">
            <div className="rounded-2xl bg-white shadow-md border border-stone-100 p-2.5 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <img src={c.logo} alt={c.he} width={64} height={64} className="object-contain" style={{ width: 64, height: 64 }} />
            </div>
            <span className="text-[10px] text-stone-400 group-hover:text-stone-600 font-semibold transition-colors">{c.he}</span>
          </div>
        ))}
      </div>
      <style>{`
        .marquee-track { display:flex; width:max-content; animation: marquee 45s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
      `}</style>
    </div>
  );
}

const CATS = [
  { emoji: '🥛', label: 'חלב', q: 'חלב' }, { emoji: '🍞', label: 'לחם', q: 'לחם' },
  { emoji: '🥩', label: 'בשר', q: 'עוף' }, { emoji: '🥬', label: 'ירקות', q: 'עגבניה' },
  { emoji: '🥫', label: 'שימורים', q: 'טונה' }, { emoji: '🧃', label: 'משקאות', q: 'מים מינרליים' },
  { emoji: '🍫', label: 'חטיפים', q: 'במבה' }, { emoji: '☕', label: 'קפה', q: 'קפה' },
  { emoji: '🧹', label: 'ניקיון', q: 'אקונומיקה' }, { emoji: '🧴', label: 'טיפוח', q: 'שמפו' },
  { emoji: '👶', label: 'תינוקות', q: 'חיתול' }, { emoji: '🐕', label: 'חיות', q: 'מזון כלבים' },
];

export default function Home() {
  const [tab, setTab] = useState<'search' | 'list'>('search');
  const [q, setQ] = useState(""); const [results, setResults] = useState<Product[]>([]); const [sel, setSel] = useState<Product | null>(null);
  const [prices, setPrices] = useState<Price[]>([]); const [loading, setLoading] = useState(false); const [pLoading, setPLoading] = useState(false);
  const [showCats, setShowCats] = useState(false); const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'stores' | 'name'>('price'); const db = useRef<any>(null);
  const [list, setList] = useState<ListItem[]>([]); const [listResults, setListResults] = useState<StoreResult[]>([]);
  const [listLoading, setListLoading] = useState(false); const [toast, setToast] = useState(""); const [expandedStore, setExpandedStore] = useState<number | null>(null);

  const search = useCallback((v: string) => { if (!v.trim()) { setResults([]); return; } setLoading(true); api.search(v).then((d: any) => setResults(d.results || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  const onInput = (v: string) => { setQ(v); clearTimeout(db.current); db.current = setTimeout(() => search(v), 300); };
  const pick = (p: Product) => { setSel(p); setPLoading(true); setChainFilter(null); api.prices(p.id).then((d: any) => setPrices(d.prices || [])).catch(() => {}).finally(() => setPLoading(false)); };
  const addToList = (p: Product) => { setList(prev => { const ex = prev.find(i => i.product.id === p.id); if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { product: p, qty: 1 }]; }); setToast(p.name); setTimeout(() => setToast(""), 2000); };
  const removeFromList = (id: number) => setList(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => { if (qty <= 0) { removeFromList(id); return; } setList(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i)); };

  useEffect(() => { if (!list.length) { setListResults([]); return; } setListLoading(true); api.list(list.map(i => ({ productId: i.product.id, qty: i.qty }))).then((d: any) => setListResults(d.bestStoreCandidates || [])).catch(() => {}).finally(() => setListLoading(false)); }, [list]);

  const fp = prices.filter((p: Price) => !chainFilter || p.chainName === chainFilter).sort((a, b) => a.price - b.price);
  const uChains = [...new Set(prices.map((p: Price) => p.chainName))].sort();
  const sorted = [...results].sort((a, b) => sortBy === 'price' ? (a.minPrice || 999) - (b.minPrice || 999) : sortBy === 'stores' ? (b.storeCount || 0) - (a.storeCount || 0) : a.name.localeCompare(b.name, 'he'));
  const cheap = fp.length ? Math.min(...fp.map(p => p.price)) : 0;
  const exp = fp.length ? Math.max(...fp.map(p => p.price)) : 0;

  return (
    <div className="pb-24">
      {/* Toast */}
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50"><div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</span>{toast} נוסף לרשימה</div></div>}

      {/* Hero */}
      <section className="text-center pt-8 pb-1">
        <h2 className="font-black text-3xl sm:text-4xl tracking-tight text-stone-800 leading-tight">כמה אתם <span className="bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent">באמת</span> משלמים?</h2>
        <p className="text-stone-400 text-sm mt-2 font-medium">משווים מחירים מכל רשתות השיווק בישראל</p>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-6">
        <button onClick={() => setTab('search')} className={"px-7 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 " + (tab === 'search' ? "bg-stone-900 text-white shadow-lg" : "bg-white text-stone-500 shadow-sm border border-stone-200 hover:border-stone-300")}>🔍 חיפוש מוצר</button>
        <button onClick={() => setTab('list')} className={"px-7 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative " + (tab === 'list' ? "bg-stone-900 text-white shadow-lg" : "bg-white text-stone-500 shadow-sm border border-stone-200 hover:border-stone-300")}>
          🛒 רשימת קניות
          {list.length > 0 && <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">{list.length}</span>}
        </button>
      </div>

      {/* ==================== SEARCH TAB ==================== */}
      {tab === 'search' && (<div>
        <div className="max-w-2xl mx-auto">
          <div className="relative"><input value={q} onChange={e => onInput(e.target.value)} placeholder="חלב, במבה, שמפו, או ברקוד..." className="w-full px-5 py-4 pr-12 rounded-xl bg-white border border-stone-200 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-stone-300" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-xl">🔍</span></div>
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            <button onClick={() => setShowCats(p => !p)} className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition border " + (showCats ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300")}>📂 קטגוריות</button>
            {[{e:'🥛',l:'חלב',q:'חלב'},{e:'🍞',l:'לחם',q:'לחם'},{e:'🥚',l:'ביצים',q:'ביצים'},{e:'🍫',l:'במבה',q:'במבה'},{e:'☕',l:'קפה',q:'קפה'},{e:'🧴',l:'שמפו',q:'שמפו'}].map(qs => (
              <button key={qs.q} onClick={() => { setQ(qs.q); search(qs.q); }} className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs hover:border-emerald-400 hover:bg-emerald-50 transition">{qs.e} {qs.l}</button>
            ))}
          </div>
          {showCats && <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-1.5">{CATS.map(c => (<button key={c.label} onClick={() => { setQ(c.q); search(c.q); setShowCats(false); }} className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white border border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition"><span className="text-xl">{c.emoji}</span><span className="text-[10px] font-semibold text-stone-500">{c.label}</span></button>))}</div>}
        </div>

        {results.length > 0 && <div className="max-w-2xl mx-auto mt-4 flex items-center gap-1.5">
          <span className="text-stone-300 text-[11px]">מיון:</span>
          {([['price','מחיר'],['stores','חנויות'],['name','א-ב']] as const).map(([k,l]) => (<button key={k} onClick={() => setSortBy(k)} className={"px-2.5 py-1 rounded-lg text-[11px] font-semibold transition " + (sortBy === k ? "bg-stone-900 text-white" : "bg-white text-stone-400 border border-stone-200")}>{l}</button>))}
          <span className="text-stone-300 text-[11px] mr-auto">{results.length} תוצאות</span>
        </div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
          {/* Results */}
          <div className="space-y-1.5">
            {loading && <div className="text-center py-16"><div className="inline-block w-7 h-7 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin"></div></div>}
            {sorted.map((p: Product) => (
              <div key={p.id} className={"group rounded-xl transition-all bg-white border " + (sel?.id === p.id ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20" : "border-stone-100 hover:border-stone-200 hover:shadow-sm")}>
                <button onClick={() => pick(p)} className="w-full text-right p-3.5">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 ml-3"><div className="font-bold text-stone-800 text-sm truncate">{p.name}</div><div className="text-[11px] text-stone-400 mt-0.5">{p.brand}{p.unitQty && p.unitQty !== '0' ? ` · ${p.unitQty} ${p.unitMeasure}` : ''}</div></div>
                    <div className="text-left shrink-0 flex items-center gap-3">
                      <div>{p.minPrice && <div className="font-mono font-black text-lg text-emerald-600 leading-none">₪{Number(p.minPrice).toFixed(2)}</div>}{p.storeCount > 0 && <div className="text-[10px] text-stone-300 mt-0.5">{p.storeCount} חנויות</div>}</div>
                      <span className="text-stone-200 group-hover:text-stone-400 transition">‹</span>
                    </div>
                  </div>
                </button>
                <div className="px-3.5 pb-2.5 -mt-1"><button onClick={() => addToList(p)} className="text-[11px] px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition">+ לרשימה</button></div>
              </div>
            ))}
            {!loading && !q.trim() && <div className="text-center py-20"><div className="text-4xl mb-3 opacity-30">🔍</div><div className="text-stone-300 text-sm">התחילו לחפש מוצר</div></div>}
            {!loading && q.trim() && !results.length && <div className="text-center py-16"><div className="text-3xl mb-2 opacity-30">🤷</div><div className="text-stone-300 text-sm">לא מצאנו</div></div>}
          </div>

          {/* Price panel */}
          <div>{sel ? (<div className="rounded-xl bg-white border border-stone-100 shadow-sm overflow-hidden sticky top-16">
            <div className="p-4 border-b border-stone-100">
              <div className="font-black text-lg text-stone-800 leading-snug">{sel.name}</div>
              <div className="text-xs text-stone-400 mt-1">{sel.brand}{sel.barcode && ` · ${sel.barcode}`}</div>
              {fp.length > 0 && <div className="mt-3 flex items-baseline gap-2"><span className="font-mono font-black text-2xl text-emerald-600">₪{cheap.toFixed(2)}</span>{exp > cheap && <span className="text-xs text-stone-400">— ₪{exp.toFixed(2)} ({((exp - cheap) / cheap * 100).toFixed(0)}% הפרש)</span>}</div>}
            </div>
            {uChains.length > 1 && <div className="px-4 py-2.5 bg-stone-50/80 border-b flex flex-wrap gap-1">
              <button onClick={() => setChainFilter(null)} className={"px-2 py-0.5 rounded text-[10px] font-semibold transition " + (!chainFilter ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600")}>הכל</button>
              {uChains.map((ch: string) => (<button key={ch} onClick={() => setChainFilter(chainFilter === ch ? null : ch)} className={"px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 " + (chainFilter === ch ? "text-white" : "text-stone-400 hover:text-stone-600")} style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}>
                <CLogo name={ch} size={14} />{chainHe(ch)}
              </button>))}
            </div>}
            <div className="max-h-[52vh] overflow-y-auto divide-y divide-stone-50">
              {pLoading ? <div className="p-10 text-center"><div className="inline-block w-6 h-6 border-2 border-stone-200 border-t-stone-700 rounded-full animate-spin"></div></div> :
              !fp.length ? <div className="p-10 text-center text-stone-300 text-xs">אין מחירים</div> :
              fp.map((p: Price, i: number) => (
                <div key={i} className={"flex items-center justify-between px-4 py-3 transition hover:bg-stone-50 " + (i === 0 ? "bg-emerald-50/40" : "")}>
                  <div className="flex items-center gap-3">
                    <CLogo name={p.chainName} size={34} />
                    <div>
                      <div className="font-bold text-sm text-stone-700">{chainHe(p.chainName)}</div>
                      <div className="text-[11px] text-stone-400">{p.storeName}{p.city && ` · ${p.city}`}{cheap > 0 && p.price > cheap && <span className="text-red-400 mr-1"> +{((p.price - cheap) / cheap * 100).toFixed(0)}%</span>}</div>
                    </div>
                  </div>
                  <div className={"font-mono font-black text-base " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{Number(p.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>) : <div className="text-center py-24"><div className="text-3xl mb-2 opacity-20">📊</div><div className="text-stone-300 text-sm">בחרו מוצר</div></div>}</div>
        </div>
      </div>)}

      {/* ==================== LIST TAB ==================== */}
      {tab === 'list' && (<div>
        {!list.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-3xl mb-4">📋</div>
            <div className="text-lg font-bold text-stone-700">הרשימה ריקה</div>
            <div className="text-sm text-stone-400 mt-1">חפשו מוצרים והוסיפו לרשימה</div>
            <button onClick={() => setTab('search')} className="mt-5 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition shadow-lg">🔍 חיפוש מוצרים</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* My list - 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg text-stone-800">הרשימה שלי <span className="text-stone-300 font-medium text-sm">({list.length})</span></h3>
                <div className="flex gap-1.5">
                  <button onClick={() => setTab('search')} className="text-[11px] px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800 transition">+ הוסף</button>
                  <button onClick={() => { setList([]); setListResults([]); }} className="text-[11px] px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-400 font-bold hover:text-red-500 hover:border-red-200 transition">נקה</button>
                </div>
              </div>
              <div className="space-y-1.5">
                {list.map(item => (
                  <div key={item.product.id} className="bg-white rounded-xl p-3 border border-stone-100 flex items-center justify-between">
                    <div className="min-w-0"><div className="font-bold text-sm text-stone-800 truncate">{item.product.name}</div><div className="text-[11px] text-stone-400">{item.product.minPrice ? `מ-₪${Number(item.product.minPrice).toFixed(2)}` : ''}{item.product.brand && ` · ${item.product.brand}`}</div></div>
                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-sm hover:bg-stone-200 transition">−</button>
                      <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm hover:bg-emerald-200 transition">+</button>
                      <button onClick={() => removeFromList(item.product.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition mr-0.5 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store comparison - 3 cols */}
            <div className="lg:col-span-3">
              <h3 className="font-black text-lg text-stone-800 mb-3">השוואת סלים</h3>
              {listLoading ? <div className="text-center py-16"><div className="inline-block w-7 h-7 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin"></div></div> :
              !listResults.length ? <div className="text-center py-16 text-stone-300 text-sm">לא נמצאו חנויות</div> :
              <div className="space-y-3">
                {listResults.map((store: StoreResult, i: number) => {
                  const sav = i > 0 ? (store.total - listResults[0].total) : 0;
                  const foundIds = new Set(store.breakdown?.map((b: any) => b.productId) || []);
                  const missing = list.filter(l => !foundIds.has(l.product.id));
                  const isOpen = expandedStore === i;
                  const isWinner = i === 0;
                  return (
                    <div key={store.storeId} className={"rounded-xl border transition-all " + (isWinner ? "border-emerald-200 bg-gradient-to-l from-emerald-50/80 to-white shadow-md" : "border-stone-100 bg-white hover:shadow-sm")}>
                      {/* Header - always visible */}
                      <button onClick={() => setExpandedStore(isOpen ? null : i)} className="w-full p-4 text-right">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <CLogo name={store.chainName} size={48} />
                              {isWinner && <span className="absolute -top-1.5 -right-1.5 text-sm">🏆</span>}
                            </div>
                            <div>
                              <div className="font-black text-base text-stone-800">{chainHe(store.chainName)}</div>
                              <div className="text-[11px] text-stone-400 mt-0.5">{store.storeName}{store.city && ` · ${store.city}`}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">{store.availableCount} נמצאו</span>
                                {store.missingCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-semibold">{store.missingCount} חסרים</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-left flex items-center gap-3">
                            <div>
                              <div className={"font-mono font-black text-xl " + (isWinner ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                              {sav > 0 && <div className="text-[11px] text-red-400 font-semibold">+₪{sav.toFixed(2)}</div>}
                              {isWinner && listResults.length > 1 && <div className="text-[10px] text-emerald-600 font-bold">הכי זול ✓</div>}
                            </div>
                            <span className={"text-stone-300 transition-transform text-lg " + (isOpen ? "rotate-90" : "")} style={{ display: 'inline-block' }}>‹</span>
                          </div>
                        </div>
                      </button>

                      {/* Expandable detail */}
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-stone-100">
                          {/* Found items */}
                          {store.breakdown && store.breakdown.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-bold text-stone-400 mb-2 uppercase tracking-wide">מוצרים בסל</div>
                              <div className="rounded-lg overflow-hidden border border-stone-100">
                                {store.breakdown.map((b: any, bi: number) => {
                                  const prod = list.find(l => l.product.id === b.productId);
                                  return (
                                    <div key={b.productId} className={"flex items-center justify-between px-3 py-2.5 text-xs " + (bi % 2 === 0 ? "bg-white" : "bg-stone-50/50")}>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                                        <span className="text-stone-700 truncate font-medium">{prod ? prod.product.name : `מוצר #${b.productId}`}</span>
                                        {b.qty > 1 && <span className="text-stone-400 shrink-0">×{b.qty}</span>}
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 mr-2">
                                        <span className="text-stone-400">₪{Number(b.price).toFixed(2)}</span>
                                        <span className="font-mono font-bold text-stone-800 w-16 text-left">₪{b.subtotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Total row */}
                                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-100 border-t border-stone-200">
                                  <span className="text-xs font-bold text-stone-600">סה״כ</span>
                                  <span className={"font-mono font-black text-sm w-16 text-left " + (isWinner ? "text-emerald-600" : "text-stone-800")}>₪{store.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Missing items */}
                          {missing.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-bold text-red-400 mb-2 uppercase tracking-wide">לא נמצאו בסניף</div>
                              <div className="rounded-lg border border-red-100 bg-red-50/30 overflow-hidden">
                                {missing.map(item => (
                                  <div key={item.product.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-red-50 last:border-0">
                                    <span className="w-5 h-5 rounded-md bg-red-100 text-red-400 flex items-center justify-center text-[10px] shrink-0 font-bold">✕</span>
                                    <span className="text-red-400">{item.product.name}</span>
                                    {item.qty > 1 && <span className="text-red-300">×{item.qty}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Savings banner */}
                          {isWinner && listResults.length > 1 && (
                            <div className="mt-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                              💰 חיסכון של ₪{(listResults[listResults.length - 1].total - store.total).toFixed(2)} לעומת הכי יקר
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
            </div>
          </div>
        )}
      </div>)}
    </div>
  );
}
