'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  { label: 'חלב וביצים', emoji: '🥛', q: 'חלב' },
  { label: 'לחם ואפייה', emoji: '🍞', q: 'לחם' },
  { label: 'בשר ועוף', emoji: '🥩', q: 'עוף' },
  { label: 'ירקות', emoji: '🥕', q: 'עגבניות' },
  { label: 'שמן ותבלינים', emoji: '🫒', q: 'שמן' },
  { label: 'אורז ופסטה', emoji: '🍚', q: 'אורז' },
  { label: 'שתייה', emoji: '🥤', q: 'קולה' },
  { label: 'חטיפים', emoji: '🍫', q: 'במבה' },
  { label: 'גבינות', emoji: '🧀', q: 'גבינה' },
  { label: 'קפה ותה', emoji: '☕', q: 'קפה' },
];

interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  minPrice: number | null;
  storeCount: number;
  imageUrl?: string | null;
}

function ProductImg({ name, imageUrl, size = 52 }: { name: string; imageUrl?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return (
    <div className="rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl" style={{ width: size, height: size }}>📦</div>
  );
  return (
    <img src={imageUrl} alt={name} onError={() => setErr(true)}
      className="rounded-xl object-contain bg-gray-50 flex-shrink-0"
      style={{ width: size, height: size }} />
  );
}

export default function QuickAddProducts({ onAdd }: { onAdd: (p: Product) => void }) {
  const [activeCat, setActiveCat] = useState(0);
  const [cache, setCache] = useState<Record<number, Product[]>>({});
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const fetchCategory = useCallback(async (idx: number) => {
    if (cache[idx]) return;
    const cat = CATEGORIES[idx];
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(cat.q)}&limit=20`);
      const d = await res.json();
      const sorted = (d.results || []).sort(
        (a: Product, b: Product) => (b.storeCount || 0) - (a.storeCount || 0)
      );
      setCache(prev => ({ ...prev, [idx]: sorted }));
    } catch {}
  }, [cache]);

  // טוען קטגוריה ראשונה מיד + pre-load שניה
  useEffect(() => {
    fetchCategory(0);
    fetchCategory(1);
  }, []);

  useEffect(() => {
    if (!cache[activeCat]) {
      setLoading(true);
      fetchCategory(activeCat).finally(() => setLoading(false));
    }
    // pre-load הבא
    if (activeCat + 1 < CATEGORIES.length) fetchCategory(activeCat + 1);
    // reset slider position
    if (sliderRef.current) sliderRef.current.scrollLeft = 0;
  }, [activeCat]);

  useEffect(() => {
    if (cache[activeCat]) setLoading(false);
  }, [cache, activeCat]);

  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const handleAdd = (p: Product) => {
    onAdd(p);
    setAdded(prev => new Set([...prev, p.id]));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 2000);
  };

  const products = cache[activeCat] || [];

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <p className="text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">הוסיפו מוצרי בסיס לסל</p>

      {/* קטגוריות */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat, i) => (
          <button key={cat.label} onClick={() => setActiveCat(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              activeCat === i
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100'
                : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'
            }`}>
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* סליידר מוצרים */}
      <div className="relative">
        {/* Fade שמאל */}
        {canScrollLeft && (
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{background: 'linear-gradient(to left, transparent, white)'}} />
        )}
        {/* Fade ימין */}
        {canScrollRight && (
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{background: 'linear-gradient(to right, transparent, white)'}} />
        )}

        {/* חץ שמאל */}
        {canScrollLeft && (
          <button onClick={() => scroll('left')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -mr-2">
            ‹
          </button>
        )}
        {/* חץ ימין */}
        {canScrollRight && (
          <button onClick={() => scroll('right')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -ml-2">
            ›
          </button>
        )}

        {loading && !products.length ? (
          <div className="flex gap-3 overflow-hidden pb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse" style={{width:120,height:170}} />
            ))}
          </div>
        ) : (
          <div ref={sliderRef} onScroll={updateScrollState}
            className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none', scrollBehavior:'smooth'}}>
            {products.map(p => (
              <div key={p.id}
                className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 p-2.5 flex flex-col items-center gap-1.5 hover:border-emerald-200 transition-all"
                style={{width:120}}>
                <ProductImg name={p.name} imageUrl={p.imageUrl} size={52} />
                <p className="text-[11px] font-medium text-gray-800 text-center leading-tight line-clamp-2 w-full flex-1">{p.name}</p>
                {p.minPrice && <p className="text-[10px] text-emerald-600 font-bold">מ-₪{Number(p.minPrice).toFixed(2)}</p>}
                <button onClick={() => handleAdd(p)}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    added.has(p.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'
                  }`}>
                  {added.has(p.id) ? '✓ נוסף' : '+ לסל'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
