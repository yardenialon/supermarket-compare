'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  { label: 'חלב וביצים', emoji: '🥛', queries: ['חלב תנובה 3%', 'ביצים L', 'גבינה לבנה'] },
  { label: 'לחם ואפייה', emoji: '🍞', queries: ['לחם אחיד', 'לחם שיפון', 'פיתות'] },
  { label: 'בשר ועוף', emoji: '🥩', queries: ['עוף שלם', 'חזה עוף', 'בשר טחון'] },
  { label: 'ירקות ופירות', emoji: '🥕', queries: ['עגבניות', 'מלפפונים', 'בצל'] },
  { label: 'שמן ותבלינים', emoji: '🫒', queries: ['שמן זית', 'שמן קנולה', 'מלח'] },
  { label: 'אורז ופסטה', emoji: '🍚', queries: ['אורז פרסי', 'פסטה ספגטי', 'קוסקוס'] },
  { label: 'שתייה', emoji: '🥤', queries: ['קוקה קולה', 'מים מינרלים', 'מיץ תפוזים'] },
  { label: 'חטיפים', emoji: '🍫', queries: ['במבה', 'ביסלי', 'שוקולד'] },
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

    Promise.all(
      cat.queries.map(q =>
        fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=4`)
          .then(r => r.json())
          .then(d => d.results || [])
          .catch(() => [])
      )
    ).then(results => {
      // מביאים את המוצר עם הכי הרבה סניפים מכל שאילתה
      const top = results.map(group =>
        [...group].sort((a: Product, b: Product) => (b.storeCount || 0) - (a.storeCount || 0))[0]
      ).filter(Boolean);
      setProducts(top);
      setLoading(false);
    });
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
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border-2 border-gray-100 p-2.5 flex flex-col items-center gap-1.5">
              <ProductImg name={p.name} imageUrl={p.imageUrl} size={44} />
              <p className="text-[11px] font-medium text-gray-800 text-center leading-tight line-clamp-2">{p.name}</p>
              {p.minPrice && <p className="text-[10px] text-emerald-600 font-bold">מ-₪{Number(p.minPrice).toFixed(2)}</p>}
              <button onClick={() => handleAdd(p)}
                className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
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
  );
}
