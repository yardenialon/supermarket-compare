"use client";
import { useState, useRef, useCallback } from "react";
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
  'Shuk Ahir':    { he: 'שוק העיר',    color: '#dc2626', logo: '/logos/shuk-haeir.png' },
  'Wolt':         { he: 'וולט',        color: '#00c2e8', logo: '/logos/wolt.png' },
};
const chainHe = (n: string) => CHAINS[n]?.he || n;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center mb-2">
          <p className="text-stone-600 font-medium text-base">השוו מחירי סל קניות בין כל חנויות האונליין הגדולות —</p>
          <p className="text-stone-400 text-sm">הוסיפו מוצרים לסל וגלו איפה הכי משתלם להזמין עד הבית 🏠</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {['Shufersal','Rami Levy','Hazi Hinam','Victory','Mahsani Ashuk','Dor Alon','Carrefour','Shuk Ahir','Wolt'].map(chain => (
            <div key={chain} className="flex items-center justify-center bg-white rounded-2xl p-2 shadow-sm border border-stone-100">
              <CLogo name={chain} size={56} />
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center bg-white rounded-2xl shadow-md border border-stone-200 px-4 py-3 gap-3">
            <span className="text-xl">🔍</span>
            <input
              value={query}
              onChange={e => search(e.target.value)}
              placeholder="חפש מוצר להוסיף לסל..."
              className="flex-1 outline-none text-stone-800 placeholder-stone-400 text-base bg-transparent"
              autoComplete="off"
            />
            {loading && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 z-30 overflow-hidden">
              {suggestions.map(p => (
                <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-right border-b border-stone-50 last:border-0">
                  <ProductImg name={p.name} size={40} imageUrl={p.imageUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 text-sm truncate">{p.name}</div>
                    {p.minPrice && <div className="text-xs text-emerald-600 font-semibold">מ-₪{p.minPrice.toFixed(2)}</div>}
                  </div>
                  <span className="text-emerald-500 text-lg">+</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {list.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="font-bold text-stone-700">הסל שלי</span>
              <span className="text-sm text-stone-400">{totalItems} פריטים</span>
            </div>
            {list.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
                <ProductImg name={item.product.name} size={44} imageUrl={item.product.imageUrl} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 text-sm truncate">{item.product.name}</div>
                  {item.product.minPrice && <div className="text-xs text-stone-400">מ-₪{item.product.minPrice.toFixed(2)}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold transition-colors">−</button>
                  <span className="w-5 text-center font-bold text-stone-700">{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold transition-colors">+</button>
                  <button onClick={() => removeItem(item.product.id)} className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors mr-1">✕</button>
                </div>
              </div>
            ))}
            <div className="px-4 py-3">
              <button
                onClick={compare}
                disabled={comparing}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all shadow-md"
                style={{ background: comparing ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {comparing ? '⏳ מחשב...' : '🚀 השווה מחירים אונליין'}
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

        {results && results.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-black text-stone-700 text-lg px-1">תוצאות השוואה 🏆</h2>
            {results.map((store, idx) => {
              const isFirst = idx === 0;
              const savings = isFirst ? 0 : +(store.total - results[0].total).toFixed(2);
              const isExpanded = expandedStore === store.storeId;
              const foundIds = new Set(store.breakdown.map(b => b.productId));
              const missingItems = list.filter(i => !foundIds.has(i.product.id));
              return (
                <div key={store.storeId} className={`bg-white rounded-2xl shadow-md border overflow-hidden transition-all ${isFirst ? 'border-emerald-300 ring-2 ring-emerald-200' : 'border-stone-100'}`}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-right" onClick={() => setExpandedStore(isExpanded ? null : store.storeId)}>
                    <div className="relative">
                      <CLogo name={store.chainName} size={48} />
                      {isFirst && <span className="absolute -top-1 -right-1 text-base">🥇</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-800">{chainHe(store.chainName)}</div>
                      <div className="text-xs text-stone-400 truncate">{store.storeName}</div>
                      {store.missingCount > 0 && (
                        <div className="text-xs text-amber-500 font-medium">⚠️ חסרים {store.missingCount} מוצרים — לחץ לפירוט</div>
                      )}
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <div className={`font-black text-xl ${isFirst ? 'text-emerald-600' : 'text-stone-700'}`}>₪{store.total.toFixed(2)}</div>
                      {!isFirst && savings > 0 && <div className="text-xs text-red-400">+₪{savings.toFixed(2)}</div>}
                      {isFirst && <div className="text-xs text-emerald-500 font-medium">הכי זול! ✨</div>}
                      <span className="text-stone-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-stone-100 px-4 py-3 space-y-2">
                      {store.breakdown.map(b => {
                        const item = list.find(i => i.product.id === b.productId);
                        return (
                          <div key={b.productId} className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span className="flex-1 text-stone-700 truncate">{item?.product.name || b.productId}</span>
                            <span className="text-stone-500 font-medium">₪{b.price.toFixed(2)}</span>
                            {b.qty > 1 && <span className="text-stone-400 text-xs">×{b.qty}</span>}
                          </div>
                        );
                      })}
                      {missingItems.map(item => (
                        <div key={item.product.id} className="flex items-center gap-2 text-sm">
                          <span className="text-red-400">✗</span>
                          <span className="flex-1 text-stone-400 truncate line-through">{item.product.name}</span>
                          <span className="text-red-300 text-xs">לא נמצא</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {list.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="font-medium text-stone-500 text-lg">הוסף מוצרים לסל</p>
            <p className="text-sm mt-1">נמצא לך את ההזמנה הכי משתלמת לביתך</p>
          </div>
        )}
      </main>
    </div>
  );
}
