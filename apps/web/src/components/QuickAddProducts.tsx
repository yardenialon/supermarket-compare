'use client';
import { useState, useEffect } from 'react';

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

function ProductImg({ name, imageUrl, size = 48 }: { name: string; imageUrl?: string | null; size?: number }) {
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
  const [activecat, setActiveCat] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cat = CATEGORIES[activecat];
    setLoading(true);
    setProducts([]);

    fetch(`${API}/search?q=${encodeURIComponent(cat.q)}&limit=20`)
      .then(r => r.json())
      .then(d => {
        const sorted = (d.results || []).sort(
          (a: Product, b: Product) => (b.storeCount || 0) - (a.storeCount || 0)
        );
        setProducts(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activecat]);

  const handleAdd = (p: Product) => {
    onAdd(p);
    setAdded(prev => new Set([...prev, p.id]));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      {/* כותרת */}
      <p className="text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">הוסיפו מוצרי בסיס לסל</p>

      {/* קטגוריות */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat, i) => (
          <button key={cat.label} onClick={() => setActiveCat(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              activecat === i
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'
            }`}>
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* מוצרים */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse" style={{width:120,height:160}} />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
          {products.map(p => (
            <div key={p.id} className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 p-2.5 flex flex-col items-center gap-1.5" style={{width:120}}>
              <ProductImg name={p.name} imageUrl={p.imageUrl} size={52} />
              <p className="text-[11px] font-medium text-gray-800 text-center leading-tight line-clamp-2 w-full">{p.name}</p>
              {p.minPrice && <p className="text-[10px] text-emerald-600 font-bold">מ-₪{Number(p.minPrice).toFixed(2)}</p>}
              <button onClick={() => handleAdd(p)}
                className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all mt-auto ${
                  added.has(p.id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white active:scale-95'
                }`}>
                {added.has(p.id) ? '✓ נוסף' : '+ לסל'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
