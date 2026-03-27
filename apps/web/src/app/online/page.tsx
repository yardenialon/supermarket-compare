"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Product { id: number; barcode: string; name: string; brand: string; unitQty: string; unitMeasure: string; matchScore: number; minPrice: number | null; storeCount: number; imageUrl?: string | null; }
interface ListItem { product: Product; qty: number; }
interface StoreResult { storeId: number; storeName: string; chainName: string; city: string; total: number; availableCount: number; missingCount: number; breakdown: { productId: number; price: number; qty: number; subtotal: number }[]; }

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  'Shufersal':    { he: 'שופרסל',      color: '#e11d48', logo: '/logos/shufersal.png' },
  'Rami Levy':    { he: 'רמי לוי',     color: '#2563eb', logo: '/logos/rami-levy.png' },
  'Victory':      { he: 'ויקטורי',     color: '#f59e0b', logo: '/logos/victory.png' },
  'Hazi Hinam':   { he: 'חצי חינם',    color: '#ea580c', logo: '/logos/hazi-hinam.png' },
  'Mahsani Ashuk':{ he: 'מחסני השוק',  color: '#f97316', logo: '/logos/mahsani-ashuk.png' },
  'Dor Alon':     { he: 'דור אלון',    color: '#0d9488', logo: '/logos/alunit.png' },
  'Carrefour':    { he: 'קרפור',       color: '#004e9f', logo: '/logos/Carrefour.png' },
  'Quik':         { he: 'קוויק',       color: '#84cc16', logo: '/logos/quik.png' },
  'Shuk Ahir':    { he: 'שוק העיר',    color: '#dc2626', logo: '/logos/shuk-haeir.png' },
  'Wolt':         { he: 'וולט',        color: '#00c2e8', logo: '/logos/wolt.png' },
};
const chainHe = (n: string) => CHAINS[n]?.he || n;

const chainUrl = (chainName: string): string | null => {
  const n = (chainName || '').toLowerCase();
  if (n.includes('shufersal')) return 'https://www.shufersal.co.il';
  if (n.includes('rami')) return 'https://www.rami-levy.co.il';
  if (n.includes('victory')) return 'https://www.victoryonline.co.il';
  if (n.includes('yochananof')) return 'https://www.yochananof.co.il';
  if (n.includes('tiv')) return 'https://www.tivtaam.co.il';
  if (n.includes('keshet')) return 'https://www.keshet-teamim.co.il';
  if (n.includes('hazi') || n.includes('half')) return 'https://shop.hazi-hinam.co.il';
  if (n.includes('mahsani')) return 'https://www.mck.co.il';
  if (n.includes('osher')) return 'https://www.osherad.co.il';
  if (n.includes('mega')) return 'https://www.mega.co.il';
  if (n.includes('wolt')) return 'https://wolt.com/he/isr';
  if (n.includes('carrefour')) return 'https://www.carrefour.co.il';
  if (n.includes('quik')) return 'https://www.quik.co.il';
  if (n.includes('shuk') || n.includes('ahir')) return 'https://www.shukcity.co.il';
  return null;
};

const chainClr = (n: string) => CHAINS[n]?.color || '#6b7280';
const chainLogo = (n: string) => CHAINS[n]?.logo || '';

function CLogo({ name, size = 40 }: { name: string; size?: number }) {
  const logo = chainLogo(name);
  const color = chainClr(name);
  const he = chainHe(name);
  if (logo) return <img src={logo} alt={he} width={size} height={size} className="object-contain" style={{ width: size, height: size, borderRadius: size > 40 ? 16 : 10 }} />;
  return <span className="flex items-center justify-center text-white font-black" style={{ backgroundColor: color, width: size, height: size, borderRadius: size > 40 ? 16 : 10, fontSize: size * 0.42 }}>{he.charAt(0)}</span>;
}

function ProductImg({ name, size = 48, imageUrl }: { name: string; size?: number; imageUrl?: string | null }) {
  const [err, setErr] = useState(false);
  const url = imageUrl && !err ? imageUrl : '';
  if (!url) return (
    <div className="rounded-xl bg-stone-100 flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <span className="text-stone-300" style={{ fontSize: size * 0.45 }}>📦</span>
    </div>
  );
  return (
    <div className="rounded-xl bg-stone-50 shrink-0 overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
      <img src={url} alt={name} onError={() => setErr(true)} className="max-w-full max-h-full object-contain" />
    </div>
  );
}

export default function OnlinePage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [list, setList] = useState<ListItem[]>([]);
  const [results, setResults] = useState<StoreResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [expandedStore, setExpandedStore] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState('');
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savy-online-list');
      if (saved) setList(JSON.parse(saved));
    } catch {}
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('savy-online-list', JSON.stringify(list)); } catch {}
  }, [list]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // טעינת רשימה משותפת מ-URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('list');
    if (!listId) return;
    fetch(`${API}/shared-list/${listId}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          const loaded: ListItem[] = data.items.map((i: any) => ({
            product: { id: i.productId, name: i.name, barcode: i.barcode, brand: i.brand || '', unitQty: '', unitMeasure: '', matchScore: 1, minPrice: i.minPrice, storeCount: 0, imageUrl: null },
            qty: i.qty,
          }));
          setList(loaded);
          setToast('✅ רשימה נטענה בהצלחה!');
          setTimeout(() => setToast(''), 3000);
        }
      }).catch(() => {});
  }, []);

  const shareList = async () => {
    if (!list.length) return;
    setSharing(true);
    try {
      const res = await fetch(`${API}/shared-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: list.map(i => ({ productId: i.product.id, name: i.product.name, barcode: i.product.barcode, brand: i.product.brand, qty: i.qty, minPrice: i.product.minPrice })) }),
      });
      const data = await res.json();
      const url = `https://savy.co.il/online?list=${data.id}`;
      const text = `🛒 *רשימת קניות אונליין - סאבי*\n─────────────────────\n${list.map(i => `☐ ${i.product.name}${i.qty > 1 ? ` (x${i.qty})` : ''}`).join('\n')}\n─────────────────────\n👉 ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } finally { setSharing(false); }
  };

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } finally { setLoading(false); }
    }, 300);
  }, []);

  const addProduct = (p: Product) => {
    setList(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
    setQuery('');
    setSuggestions([]);
    setResults(null);
  };

  const updateQty = (id: number, delta: number) => {
    setList(prev => prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0));
    setResults(null);
  };

  const removeItem = (id: number) => {
    setList(prev => prev.filter(i => i.product.id !== id));
    setResults(null);
  };

  const compare = async () => {
    if (!list.length) return;
    setComparing(true);
    setExpandedStore(null);
    try {
      const res = await fetch(`${API}/online-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: list.map(i => ({ productId: i.product.id, qty: i.qty })), topN: 10 }),
      });
      const data = await res.json();
      setResults(data.bestStoreCandidates || []);
    } finally { setComparing(false); }
  };

  const totalItems = list.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50" dir="rtl">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-lg font-medium text-sm animate-bounce">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors text-sm">
            <span>→</span> חזרה לעמוד הראשי
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <h1 className="font-black text-lg text-stone-800 leading-none">קניות אונליין</h1>
              <p className="text-xs text-stone-400">השוואת מחירים למשלוח עד הבית</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6" dir="rtl">

        {/* Layout דו-עמודי בדסקטופ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* עמודה שמאל — חיפוש + רשימה */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* חיפוש */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-2xl border-2 border-gray-100 px-4 py-3.5 gap-3 focus-within:border-emerald-400 transition-all shadow-sm">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2.5"/><path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <input
                  value={query}
                  onChange={e => search(e.target.value)}
                  placeholder="חפשו מוצר — חלב, לחם, שמפו..."
                  className="flex-1 outline-none text-gray-800 placeholder-gray-300 text-base bg-transparent"
                  autoComplete="off"
                />
                {loading && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
                {query && <button onClick={() => { setQuery(''); setSuggestions([]); }} className="text-gray-300 hover:text-gray-500 transition">✕</button>}
              </div>

              {/* תוצאות חיפוש — נשארות פתוחות */}
              {suggestions.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">לחצו על מוצר להוסיף לסל</span>
                    <button onClick={() => setSuggestions([])} className="text-xs text-gray-400 hover:text-gray-600">סגור</button>
                  </div>
                  {suggestions.map(p => (
                    <button key={p.id} onClick={() => { addProduct(p); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-right border-b border-gray-50 last:border-0 active:bg-emerald-100">
                      <ProductImg name={p.name} size={40} imageUrl={p.imageUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm truncate">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.brand && `${p.brand} · `}{p.minPrice ? `מ-₪${p.minPrice.toFixed(2)}` : ''}</div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">+</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* מוצרים מהירים */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">חיפושים פופולריים</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                {[
                  {emoji:'🥛',label:'חלב',q:'חלב תנובה'},{emoji:'🍞',label:'לחם',q:'לחם אחיד'},
                  {emoji:'🥚',label:'ביצים',q:'ביצים L'},{emoji:'🧀',label:'גבינה',q:'גבינה צהובה'},
                  {emoji:'🍫',label:'במבה',q:'במבה'},{emoji:'☕',label:'קפה',q:'קפה טורקי'},
                  {emoji:'🛢️',label:'שמן',q:'שמן זית'},{emoji:'🍚',label:'אורז',q:'אורז פרסי'},
                  {emoji:'🍝',label:'פסטה',q:'פסטה'},{emoji:'🧴',label:'שמפו',q:'שמפו'},
                  {emoji:'🥩',label:'עוף',q:'עוף שלם'},{emoji:'🥤',label:'קולה',q:'קוקה קולה'},
                  {emoji:'🫙',label:'טונה',q:'טונה'},{emoji:'🧼',label:'סבון',q:'סבון כלים'},
                ].map(item => (
                  <button key={item.q} onClick={() => search(item.q)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white border-2 border-gray-100 rounded-2xl px-3.5 py-2.5 hover:border-emerald-400 hover:bg-emerald-50 transition-all active:scale-95">
                    <span className="text-2xl leading-none">{item.emoji}</span>
                    <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* הסל שלי */}
            {list.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">הסל שלי</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{totalItems} פריטים</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={shareList} disabled={sharing} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition" style={{background:sharing?'#9ca3af':'#25D366'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {sharing ? '...' : 'שתף'}
                    </button>
                    <button onClick={() => { setList([]); setResults(null); }} className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-lg hover:bg-red-50">נקה</button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {list.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 px-4 py-3">
                      <ProductImg name={item.product.name} size={40} imageUrl={item.product.imageUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{item.product.name}</div>
                        {item.product.minPrice && <div className="text-xs text-gray-400">מ-₪{item.product.minPrice.toFixed(2)}</div>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition">−</button>
                        <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold transition">+</button>
                        <button onClick={() => removeItem(item.product.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-50">
                  <button onClick={compare} disabled={comparing} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95" style={{background:comparing?'#9ca3af':'linear-gradient(135deg,#10b981,#059669)',boxShadow:comparing?'none':'0 4px 14px rgba(16,185,129,0.3)'}}>
                    {comparing ? '⏳ משווה מחירים...' : '🚀 השווה מחירים בין כל האתרים'}
                  </button>
                </div>
              </div>
            )}

        {results && results.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-3">😕</div>
            <p className="font-medium">לא נמצאו תוצאות לסל זה בחנויות האונליין</p>
          </div>
        )}

          </div>

          <div className="lg:w-96 flex-shrink-0 space-y-3">
            {!results && !comparing && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">🏪</div>
                <p className="font-bold text-gray-700 mb-1">השוואת מחירים</p>
                <p className="text-sm text-gray-400">הוסיפו מוצרים וגלו איפה הכי זול</p>
              </div>
            )}
            {comparing && (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
                <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-3" style={{border:"3px solid #e5e7eb", borderTopColor:"#10b981"}} />
                <p className="font-bold text-gray-700">משווה מחירים...</p>
              </div>
            )}
            {results && results.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
                <div className="text-3xl mb-2">😕</div>
                <p className="font-bold text-gray-700">לא נמצאו תוצאות</p>
              </div>
            )}
            {results && results.length > 0 && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-gray-900 text-sm">תוצאות השוואה 🏆</span>
                  <span className="text-xs text-gray-400">{results.length} אתרים</span>
                </div>
                {results.map((store, idx) => {
                  const isFirst = idx === 0;
                  const savings = isFirst ? 0 : +(store.total - results[0].total).toFixed(2);
                  const isExpanded = expandedStore === store.storeId;
                  const foundIds = new Set(store.breakdown.map(b => b.productId));
                  const missingItems = list.filter(i => !foundIds.has(i.product.id));
                  return (
                    <div key={store.storeId} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${isFirst ? "border-emerald-400" : "border-gray-100"}`}>
                      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-right" onClick={() => setExpandedStore(isExpanded ? null : store.storeId)}>
                        <div className="relative flex-shrink-0">
                          <CLogo name={store.chainName} size={44} />
                          {isFirst && <span className="absolute -top-1.5 -right-1.5 text-sm">🥇</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm">{chainHe(store.chainName)}</div>
                          {store.missingCount > 0
                            ? <div className="text-xs text-amber-500">חסרים {store.missingCount} מוצרים</div>
                            : <div className="text-xs text-emerald-600">כל המוצרים נמצאו</div>
                          }
                        </div>
                        <div className="text-left flex-shrink-0">
                          <div className={`font-black text-lg ${isFirst ? "text-emerald-600" : "text-gray-800"}`}>₪{store.total.toFixed(2)}</div>
                          {isFirst && <div className="text-xs text-emerald-500 font-medium">הכי זול</div>}
                          {!isFirst && savings > 0 && <div className="text-xs text-red-400">+₪{savings.toFixed(2)}</div>}
                        </div>
                        <span className="text-gray-300 text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-50 px-4 py-3 space-y-1.5">
                          {store.breakdown.map(b => {
                            const item = list.find(i => i.product.id === b.productId);
                            return (
                              <div key={b.productId} className="flex items-center gap-2">
                                <span className="text-emerald-500 flex-shrink-0 text-xs">✓</span>
                                <span className="flex-1 text-gray-700 truncate text-xs">{item?.product.name || b.productId}</span>
                                <span className="text-gray-600 font-semibold text-xs">₪{b.price.toFixed(2)}{b.qty > 1 ? ` x${b.qty}` : ""}</span>
                              </div>
                            );
                          })}
                          {missingItems.map(item => (
                            <div key={item.product.id} className="flex items-center gap-2">
                              <span className="text-red-400 flex-shrink-0 text-xs">✗</span>
                              <span className="flex-1 text-gray-400 truncate text-xs line-through">{item.product.name}</span>
                            </div>
                          ))}
                          {chainUrl(store.chainName) && (
                            <a href={chainUrl(store.chainName)!} target="_blank" rel="noopener noreferrer"
                              className={"mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition w-full " + (isFirst ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                              הזמן ב{chainHe(store.chainName)}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
