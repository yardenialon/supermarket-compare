"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

interface Product { id: number; barcode: string; name: string; brand: string; unitQty: string; unitMeasure: string; matchScore: number; minPrice: number | null; maxPrice: number | null; storeCount: number; imageUrl?: string | null; }
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
  'Salach Dabach':{ he: 'סאלח דבאח',     color: '#b45309', logo: '/logos/salach-dabach.png' },
  'Shefa Barcart Ashem': { he: 'שפע ברכת השם', color: '#4f46e5', logo: '' },
  'Shuk Ahir':    { he: 'שוק אחיר',      color: '#0369a1', logo: '' },
  'Stop Market':  { he: 'סטופ מרקט',     color: '#dc2626', logo: '' },
  'Super Sapir':  { he: 'סופר ספיר',     color: '#0284c7', logo: '' },
  'Super Yuda':   { he: 'סופר יודה',     color: '#15803d', logo: '/logos/super-yuda.png' },
  'Wolt':         { he: 'וולט',          color: '#00c2e8', logo: '' },
  'Super Dosh':   { he: 'סופר דוש',      color: '#7e22ce', logo: '' },
};
const chainHe = (n: string) => CHAINS[n]?.he || n;
const chainClr = (n: string) => CHAINS[n]?.color || '#6b7280';
const chainLogo = (n: string) => CHAINS[n]?.logo || '';

function CLogo({ name, size = 40 }: { name: string; size?: number }) {
  const logo = chainLogo(name); const color = chainClr(name); const he = chainHe(name);
  if (logo) return <img src={logo} alt={he} width={size} height={size} className="object-contain" style={{ width: size, height: size, borderRadius: size > 40 ? 16 : 10 }} />;
  return <span className="flex items-center justify-center text-white font-black" style={{ backgroundColor: color, width: size, height: size, borderRadius: size > 40 ? 16 : 10, fontSize: size * 0.42 }}>{he.charAt(0)}</span>;
}

/* ---- Product image with lightbox ---- */
function ProductImg({ barcode, name, size = 48, imageUrl, clickable = true }: { barcode: string; name: string; size?: number; imageUrl?: string | null; clickable?: boolean }) {
  const [err, setErr] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const url = imageUrl && !err ? imageUrl : '';
  if (!url) return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center shrink-0 border border-sky-100/50" style={{ width: size, height: size }}>
      <span className="text-sky-300" style={{ fontSize: size * 0.4 }}>📦</span>
    </div>
  );
  return (
    <>
      <div onClick={clickable ? (e) => { e.stopPropagation(); setShowModal(true); } : undefined}
        className={"rounded-2xl bg-white shrink-0 overflow-hidden flex items-center justify-center border border-stone-100 " + (clickable ? "cursor-zoom-in hover:ring-2 hover:ring-sky-400/40 transition-all hover:shadow-md" : "")}
        style={{ width: size, height: size }}>
        <img src={url} alt={name} onError={() => setErr(true)} className="max-w-full max-h-full object-contain p-0.5" />
      </div>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md" onClick={() => setShowModal(false)}>
          <div className="relative max-w-[90vw] max-h-[85vh] animate-scaleIn" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center text-stone-400 hover:text-stone-800 text-lg font-bold z-10 transition hover:scale-110">✕</button>
            <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4">
              <img src={url} alt={name} className="max-w-[80vw] max-h-[60vh] object-contain rounded-2xl" />
              <div className="text-center"><div className="font-bold text-stone-800">{name}</div>{barcode && <div className="text-xs text-stone-400 mt-1">{barcode}</div>}</div>
            </div>
          </div>
          <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn .2s ease-out}`}</style>
        </div>
      )}
    </>
  );
}

/* ---- Animated logo marquee ---- */
const LOGO_LIST = Object.entries(CHAINS).filter(([_, v]) => v.logo).map(([k, v]) => ({ key: k, ...v }));
function LogoMarquee() {
  return (
    <div className="relative w-full overflow-hidden py-4" style={{ maskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div className="flex gap-6 items-center marquee-track">
        {[...LOGO_LIST, ...LOGO_LIST].map((c, i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-1 group cursor-default">
            <div className="rounded-2xl bg-white shadow border border-stone-100/80 p-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <img src={c.logo} alt={c.he} width={52} height={52} className="object-contain" style={{ width: 52, height: 52 }} />
            </div>
            <span className="text-[9px] text-stone-400 group-hover:text-sky-600 font-semibold transition-colors">{c.he}</span>
          </div>
        ))}
      </div>
      <style>{`.marquee-track{display:flex;width:max-content;animation:marquee 40s linear infinite}.marquee-track:hover{animation-play-state:paused}@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
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

const TIPS = [
  "💡 ידעת? ההפרש בין הסופר הזול ליקר יכול להגיע ל-40% על אותו מוצר בדיוק",
  "💡 שווה לבדוק גם ברשתות הקטנות — שם מסתתרים מבצעים שלא מפרסמים",
  "💡 תוסיפו מוצרים לסל ונראה לכם איפה הכי זול לקנות את הכל ביחד",
];

export default function Home() {
  const [tab, setTab] = useState<'search' | 'list'>('search');
  const [q, setQ] = useState(""); const [results, setResults] = useState<Product[]>([]); const [sel, setSel] = useState<Product | null>(null);
  const [prices, setPrices] = useState<Price[]>([]); const [loading, setLoading] = useState(false); const [pLoading, setPLoading] = useState(false);
  const [showCats, setShowCats] = useState(false); const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'stores' | 'name'>('price'); const db = useRef<any>(null);
  const [list, setList] = useState<ListItem[]>([]); const [listResults, setListResults] = useState<StoreResult[]>([]);
  const [listLoading, setListLoading] = useState(false); const [toast, setToast] = useState(""); const [expandedStore, setExpandedStore] = useState<number | null>(null);
  const [selImage, setSelImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<number, string>>({});
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const search = useCallback((v: string) => { if (!v.trim()) { setResults([]); return; } setLoading(true); api.search(v).then((d: any) => setResults(d.results || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  const onInput = (v: string) => { setQ(v); clearTimeout(db.current); db.current = setTimeout(() => search(v), 300); };
  const pick = (p: Product) => {
    setSel(p); setPLoading(true); setChainFilter(null);
    setSelImage(productImages[p.id] || p.imageUrl || null);
    api.prices(p.id).then((d: any) => {
      setPrices(d.prices || []);
      if (d.imageUrl) { setSelImage(d.imageUrl); setProductImages(prev => ({ ...prev, [p.id]: d.imageUrl })); }
      else if (!p.imageUrl) {
        api.image(p.id).then((img: any) => {
          if (img.imageUrl) { setSelImage(img.imageUrl); setProductImages(prev => ({ ...prev, [p.id]: img.imageUrl })); }
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setPLoading(false));
  };
  const addToList = (p: Product) => { setList(prev => { const ex = prev.find(i => i.product.id === p.id); if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { product: p, qty: 1 }]; }); setToast(p.name); setTimeout(() => setToast(""), 2500); };
  const removeFromList = (id: number) => setList(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => { if (qty <= 0) { removeFromList(id); return; } setList(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i)); };

  useEffect(() => { if (!list.length) { setListResults([]); return; } setListLoading(true); api.list(list.map(i => ({ productId: i.product.id, qty: i.qty }))).then((d: any) => setListResults(d.bestStoreCandidates || [])).catch(() => {}).finally(() => setListLoading(false)); }, [list]);

  const fp = prices.filter((p: Price) => !chainFilter || p.chainName === chainFilter).sort((a, b) => a.price - b.price);
  const uChains = [...new Set(prices.map((p: Price) => p.chainName))].sort();
  const sorted = [...results].sort((a, b) => sortBy === 'price' ? (a.minPrice || 999) - (b.minPrice || 999) : sortBy === 'stores' ? (b.storeCount || 0) - (a.storeCount || 0) : a.name.localeCompare(b.name, 'he'));
  const cheap = fp.length ? Math.min(...fp.map(p => p.price)) : 0;
  const exp = fp.length ? Math.max(...fp.map(p => p.price)) : 0;
  const bestStore = listResults.length ? listResults[0] : null;
  const worstStore = listResults.length > 1 ? listResults[listResults.length - 1] : null;
  const totalSavings = bestStore && worstStore ? (worstStore.total - bestStore.total) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-stone-50 pb-28">
      {/* Toast */}
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
        <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm flex items-center gap-2.5 border border-sky-700">
          <span className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-xs font-bold text-white">✓</span>
          <span><b>{toast}</b> בפנים! 🎯</span>
        </div>
      </div>}

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-stone-100/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/savy-logo.png" alt="Savy" className="h-9 object-contain" />
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => setTab('search')} className={"px-4 py-2 rounded-xl text-sm font-bold transition-all " + (tab === 'search' ? "bg-sky-100 text-sky-700" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50")}>
              🔍 חיפוש
            </button>
            <button onClick={() => setTab('list')} className={"px-4 py-2 rounded-xl text-sm font-bold transition-all relative " + (tab === 'list' ? "bg-sky-100 text-sky-700" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50")}>
              🛒 הסל שלי
              {list.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce-sm">{list.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">

      {/* ==================== SEARCH TAB ==================== */}
      {tab === 'search' && (<div>
        {/* Hero */}
        <section className="text-center pt-10 pb-2">
          <h1 className="font-black text-3xl sm:text-4xl tracking-tight text-stone-800 leading-tight">
            למה לשלם יותר? <span className="bg-gradient-to-l from-sky-600 to-cyan-500 bg-clip-text text-transparent">Savy</span> מוצא לך את המחיר הכי נמוך
          </h1>
          <p className="text-stone-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">סורקים מחירים מעשרות רשתות שיווק בכל הארץ — ככה תדעו בדיוק איפה הכי זול לקנות</p>
        </section>

        {/* Logo Marquee */}
        <LogoMarquee />

        {/* Search */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="relative">
            <input value={q} onChange={e => onInput(e.target.value)} placeholder="מה נכנס לסל היום? 🛒" className="w-full px-5 py-4 pr-5 rounded-2xl bg-white border-2 border-sky-100 shadow-lg shadow-sky-100/30 text-base focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 transition-all placeholder:text-stone-300 font-medium" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 text-xl">🔍</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            <button onClick={() => setShowCats(p => !p)} className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition border-2 " + (showCats ? "border-sky-400 bg-sky-50 text-sky-700" : "border-stone-100 bg-white text-stone-400 hover:border-sky-200 hover:text-sky-500")}>📂 קטגוריות</button>
            {[{e:'🥛',l:'חלב',q:'חלב'},{e:'🍞',l:'לחם',q:'לחם'},{e:'🥚',l:'ביצים',q:'ביצים'},{e:'🍫',l:'במבה',q:'במבה'},{e:'☕',l:'קפה',q:'קפה'},{e:'🧴',l:'שמפו',q:'שמפו'}].map(qs => (
              <button key={qs.q} onClick={() => { setQ(qs.q); search(qs.q); }} className="px-3 py-1.5 rounded-xl bg-white border-2 border-stone-100 text-xs font-medium hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 transition">{qs.e} {qs.l}</button>
            ))}
          </div>
          {showCats && <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-1.5">{CATS.map(c => (<button key={c.label} onClick={() => { setQ(c.q); search(c.q); setShowCats(false); }} className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-white border-2 border-stone-50 hover:border-sky-300 hover:bg-sky-50 transition"><span className="text-xl">{c.emoji}</span><span className="text-[10px] font-semibold text-stone-500">{c.label}</span></button>))}</div>}
        </div>

        {/* Sort bar */}
        {results.length > 0 && <div className="max-w-2xl mx-auto mt-5 flex items-center gap-1.5">
          <span className="text-stone-300 text-[11px]">מיון:</span>
          {([['price','💰 מחיר'],['stores','🏪 חנויות'],['name','א-ב']] as const).map(([k,l]) => (<button key={k} onClick={() => setSortBy(k)} className={"px-3 py-1 rounded-xl text-[11px] font-bold transition " + (sortBy === k ? "bg-sky-600 text-white shadow" : "bg-white text-stone-400 border border-stone-100 hover:border-sky-200")}>{l}</button>))}
          <span className="text-sky-500 text-[11px] font-bold mr-auto">מצאנו {results.length} מוצרים</span>
        </div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
          {/* Results */}
          <div className="space-y-2">
            {loading && <div className="text-center py-16"><div className="inline-block w-8 h-8 border-[3px] border-sky-100 border-t-sky-500 rounded-full animate-spin"></div><div className="text-sky-400 text-xs mt-3 font-medium">רגע, בודקים מחירים...</div></div>}
            {sorted.map((p: Product) => (
              <div key={p.id} className={"group rounded-2xl transition-all bg-white border-2 " + (sel?.id === p.id ? "border-sky-400 shadow-lg shadow-sky-100/50 ring-1 ring-sky-400/20" : "border-stone-100 hover:border-sky-200 hover:shadow-md")}>
                <button onClick={() => pick(p)} className="w-full text-right p-3.5">
                  <div className="flex items-center gap-3">
                    <ProductImg barcode={p.barcode} name={p.name} size={56} imageUrl={productImages[p.id] || p.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-stone-800 text-sm truncate">{p.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{p.brand}{p.unitQty && p.unitQty !== '0' ? ` · ${p.unitQty} ${p.unitMeasure}` : ''}</div>
                    </div>
                    <div className="text-left shrink-0 flex items-center gap-3">
                      <div>
                        {p.minPrice && <div className="font-mono font-black text-lg text-sky-600 leading-none">₪{Number(p.minPrice).toFixed(2)}</div>}
                        {p.storeCount > 0 && <div className="text-[10px] text-stone-300 mt-0.5 font-medium">ב-{p.storeCount} חנויות</div>}
                      </div>
                      <span className="text-stone-200 group-hover:text-sky-400 transition text-lg">‹</span>
                    </div>
                  </div>
                </button>
                <div className="px-3.5 pb-3 -mt-1">
                  <button onClick={() => addToList(p)} className="text-[11px] px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-600 font-bold hover:bg-sky-100 transition border border-sky-100">+ הוסף לסל</button>
                </div>
              </div>
            ))}
            {!loading && !q.trim() && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-40">🛍️</div>
                <div className="text-stone-500 text-base font-bold">מה נכנס לסל היום?</div>
                <div className="text-stone-300 text-xs mt-1.5 max-w-xs mx-auto">{tip}</div>
              </div>
            )}
            {!loading && q.trim() && !results.length && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">🤔</div>
                <div className="text-stone-400 text-sm font-bold">לא מצאנו תוצאות 😕</div>
                <div className="text-stone-300 text-xs mt-1">אולי שווה לנסות שם אחר?</div>
              </div>
            )}
          </div>

          {/* Price panel */}
          <div>{sel ? (<div className="rounded-2xl bg-white border-2 border-stone-100 shadow-lg overflow-hidden sticky top-20">
            <div className="p-5 border-b border-stone-100 bg-gradient-to-l from-sky-50/50 to-white">
              <div className="flex items-start gap-4">
                <ProductImg barcode={sel.barcode} name={sel.name} size={72} imageUrl={selImage} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-lg text-stone-800 leading-snug">{sel.name}</div>
                  <div className="text-xs text-stone-400 mt-1">{sel.brand}{sel.barcode && ` · ${sel.barcode}`}</div>
                  {fp.length > 0 && (
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-mono font-black text-2xl text-sky-600">₪{cheap.toFixed(2)}</span>
                      {exp > cheap && <span className="text-xs text-stone-400">עד ₪{exp.toFixed(2)} <span className="text-red-400 font-bold">({((exp - cheap) / cheap * 100).toFixed(0)}% יותר יקר!)</span></span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Chain filter */}
            {uChains.length > 1 && <div className="px-4 py-2.5 bg-stone-50/80 border-b flex flex-wrap gap-1">
              <button onClick={() => setChainFilter(null)} className={"px-2.5 py-1 rounded-lg text-[10px] font-bold transition " + (!chainFilter ? "bg-sky-600 text-white" : "text-stone-400 hover:text-stone-600")}>הכל</button>
              {uChains.map((ch: string) => (<button key={ch} onClick={() => setChainFilter(chainFilter === ch ? null : ch)} className={"px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 " + (chainFilter === ch ? "text-white" : "text-stone-400 hover:text-stone-600")} style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}>
                <CLogo name={ch} size={14} />{chainHe(ch)}
              </button>))}
            </div>}
            <div className="max-h-[52vh] overflow-y-auto divide-y divide-stone-50">
              {pLoading ? <div className="p-10 text-center"><div className="inline-block w-6 h-6 border-2 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div><div className="text-xs text-sky-400 mt-2">שנייה, בודקים...</div></div> :
              !fp.length ? <div className="p-10 text-center text-stone-300 text-xs">אין מחירים כרגע</div> :
              fp.map((p: Price, i: number) => (
                <div key={i} className={"flex items-center justify-between px-4 py-3 transition hover:bg-sky-50/50 " + (i === 0 ? "bg-emerald-50/50" : "")}>
                  <div className="flex items-center gap-3">
                    <CLogo name={p.chainName} size={36} />
                    <div>
                      <div className="font-bold text-sm text-stone-700">{chainHe(p.chainName)}</div>
                      <div className="text-[11px] text-stone-400">
                        {p.storeName}{p.city && ` · ${p.city}`}
                        {i === 0 && <span className="text-emerald-500 font-bold mr-1"> 🏷️ הכי זול!</span>}
                        {cheap > 0 && p.price > cheap && <span className="text-red-400 mr-1 font-semibold"> +{((p.price - cheap) / cheap * 100).toFixed(0)}%</span>}
                      </div>
                    </div>
                  </div>
                  <div className={"font-mono font-black text-base " + (i === 0 ? "text-emerald-600" : "text-stone-600")}>₪{Number(p.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-3 opacity-20">📊</div>
              <div className="text-stone-400 text-sm font-bold">לחצו על מוצר כדי לראות השוואת מחירים</div>
              <div className="text-stone-300 text-xs mt-1">Savy עושה את העבודה בשבילכם 💪</div>
            </div>
          )}</div>
        </div>
      </div>)}

      {/* ==================== LIST TAB ==================== */}
      {tab === 'list' && (<div>
        {!list.length ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-50 border-2 border-sky-100 flex items-center justify-center text-4xl mb-5">🛒</div>
            <div className="text-xl font-black text-stone-700">הסל ריק 🛒</div>
            <div className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">חפשו מוצרים, תוסיפו לסל — ו-Savy ימצא לכם את הסופר הכי זול</div>
            <button onClick={() => setTab('search')} className="mt-6 px-8 py-3 rounded-2xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition shadow-xl shadow-sky-200">🔍 יאללה, נתחיל</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-6">
            {/* My list - 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg text-stone-800">🛒 הסל שלי <span className="text-sky-500 font-bold text-sm">({list.length})</span></h3>
                <button onClick={() => setList([])} className="text-[11px] text-stone-300 hover:text-red-400 transition font-semibold">🗑️ נקה הכל</button>
              </div>
              <div className="space-y-2">
                {list.map(item => (
                  <div key={item.product.id} className="bg-white rounded-2xl p-3 border-2 border-stone-100 flex items-center justify-between hover:border-sky-100 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductImg barcode={item.product.barcode} name={item.product.name} size={44} imageUrl={productImages[item.product.id] || item.product.imageUrl} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-stone-800 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-stone-400">{item.product.minPrice ? `מ-₪${Number(item.product.minPrice).toFixed(2)}` : ''}{item.product.brand && ` · ${item.product.brand}`}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 font-bold hover:bg-stone-200 transition">−</button>
                      <span className="w-7 text-center font-black text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold hover:bg-sky-200 transition">+</button>
                      <button onClick={() => removeFromList(item.product.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition mr-0.5 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store comparison - 3 cols */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg text-stone-800">
                  {totalSavings > 0 ? (
                    <span>💰 מצאנו לך חיסכון של <span className="text-emerald-600">₪{totalSavings.toFixed(2)}</span>!</span>
                  ) : '🏪 השוואת סלים'}
                </h3>
              </div>
              {listLoading ? <div className="text-center py-16"><div className="inline-block w-8 h-8 border-[3px] border-sky-100 border-t-sky-500 rounded-full animate-spin"></div><div className="text-sky-400 text-xs mt-3 font-medium">בודקים מחירים בכל הרשתות...</div></div> :
              !listResults.length ? <div className="text-center py-16 text-stone-300 text-sm">לא נמצאו תוצאות</div> :
              <div className="space-y-2.5">
                {listResults.map((store: StoreResult, i: number) => {
                  const isWinner = i === 0;
                  const isOpen = expandedStore === i;
                  const sav = bestStore ? store.total - bestStore.total : 0;
                  const missing = list.filter(item => !store.breakdown?.some((b: any) => b.productId === item.product.id));
                  return (
                    <div key={store.storeId} className={"rounded-2xl border-2 overflow-hidden transition-all " + (isWinner ? "border-emerald-300 bg-emerald-50/30 shadow-lg shadow-emerald-100/50" : "border-stone-100 bg-white hover:border-sky-100")}>
                      <button onClick={() => setExpandedStore(isOpen ? null : i)} className="w-full p-4 text-right">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <CLogo name={store.chainName} size={48} />
                              {isWinner && <span className="absolute -top-2 -right-2 text-base animate-bounce-sm">🏆</span>}
                            </div>
                            <div>
                              <div className="font-black text-base text-stone-800">{chainHe(store.chainName)}</div>
                              <div className="text-[11px] text-stone-400 mt-0.5">{store.storeName}{store.city && ` · ${store.city}`}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold">{store.availableCount} נמצאו</span>
                                {store.missingCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-50 text-red-500 font-bold">{store.missingCount} חסרים</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-left flex items-center gap-3">
                            <div>
                              <div className={"font-mono font-black text-xl " + (isWinner ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                              {sav > 0 && <div className="text-[11px] text-red-400 font-bold">+₪{sav.toFixed(2)} יותר</div>}
                              {isWinner && listResults.length > 1 && <div className="text-[10px] text-emerald-600 font-black">✓ הכי זול!</div>}
                            </div>
                            <span className={"text-stone-300 transition-transform text-lg " + (isOpen ? "rotate-90" : "")} style={{ display: 'inline-block' }}>‹</span>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-stone-100">
                          {store.breakdown && store.breakdown.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-black text-stone-400 mb-2">🛍️ מוצרים בסל</div>
                              <div className="rounded-xl overflow-hidden border border-stone-100">
                                {store.breakdown.map((b: any, bi: number) => {
                                  const prod = list.find(l => l.product.id === b.productId);
                                  return (
                                    <div key={b.productId} className={"flex items-center justify-between px-3 py-2.5 text-xs " + (bi % 2 === 0 ? "bg-white" : "bg-stone-50/50")}>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <ProductImg barcode={prod?.product.barcode || ''} name={prod?.product.name || ''} size={30} imageUrl={prod ? productImages[prod.product.id] : undefined} clickable={false} />
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
                                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-100 border-t border-stone-200">
                                  <span className="text-xs font-black text-stone-600">סה״כ</span>
                                  <span className={"font-mono font-black text-sm w-16 text-left " + (isWinner ? "text-emerald-600" : "text-stone-800")}>₪{store.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {missing.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-black text-red-400 mb-2">⚠️ לא נמצאו בסניף</div>
                              <div className="rounded-xl border border-red-100 bg-red-50/30 overflow-hidden">
                                {missing.map(item => (
                                  <div key={item.product.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-red-50 last:border-0">
                                    <span className="text-red-400">✕</span>
                                    <span className="text-red-400">{item.product.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {isWinner && totalSavings > 0 && (
                            <div className="mt-3 text-center text-sm font-black text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-200">
                              🎉 פה הכי זול! חוסכים ₪{totalSavings.toFixed(2)} לעומת הסופר הכי יקר
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

      {/* Footer */}
      <footer className="text-center py-8 mt-12">
        <img src="/savy-logo.png" alt="Savy" className="h-7 mx-auto mb-2 opacity-40" />
        <div className="text-[11px] text-stone-300">מוצרים נקיים, חוסכים בריא.</div>
      </footer>

      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}
        .animate-slideDown{animation:slideDown .3s ease-out}
        .animate-bounce-sm{animation:bounce-sm 2s ease-in-out infinite}
        @keyframes bounce-sm{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      `}</style>
    </div>
  );
}
