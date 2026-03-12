'use client';
import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProduceItem {
  id: string;
  emoji: string;
  name: string;
  nameEn: string;
  unit: 'kg' | 'unit';
  defaultQty: number;
  category: 'vegetables' | 'fruits' | 'herbs';
}

interface BasketItem extends ProduceItem {
  qty: number;
}

interface StoreResult {
  store_id: number;
  store_name: string;
  chain_name: string;
  city: string;
  total_price: number;
  found_items: number;
  total_items: number;
  items: { name: string; price: number; unit_price: number }[];
}

// ── Produce catalog ────────────────────────────────────────────────────────────
const PRODUCE_CATALOG: ProduceItem[] = [
  // ירקות
  { id: 'tomato',      emoji: '🍅', name: 'עגבניות',       nameEn: 'tomatoes',    unit: 'kg',   defaultQty: 1,   category: 'vegetables' },
  { id: 'cucumber',    emoji: '🥒', name: 'מלפפון',        nameEn: 'cucumber',    unit: 'kg',   defaultQty: 1,   category: 'vegetables' },
  { id: 'pepper_red',  emoji: '🫑', name: 'פלפל אדום',     nameEn: 'red pepper',  unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'pepper_grn',  emoji: '🥬', name: 'פלפל ירוק',     nameEn: 'green pepper',unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'onion',       emoji: '🧅', name: 'בצל',           nameEn: 'onion',       unit: 'kg',   defaultQty: 1,   category: 'vegetables' },
  { id: 'potato',      emoji: '🥔', name: 'תפוח אדמה',    nameEn: 'potato',      unit: 'kg',   defaultQty: 1,   category: 'vegetables' },
  { id: 'carrot',      emoji: '🥕', name: 'גזר',           nameEn: 'carrot',      unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'zucchini',    emoji: '🥦', name: 'קישוא',         nameEn: 'zucchini',    unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'eggplant',    emoji: '🍆', name: 'חציל',          nameEn: 'eggplant',    unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'lettuce',     emoji: '🥗', name: 'חסה',           nameEn: 'lettuce',     unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'broccoli',    emoji: '🥦', name: 'ברוקולי',       nameEn: 'broccoli',    unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'cauliflower', emoji: '🤍', name: 'כרובית',        nameEn: 'cauliflower', unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'cabbage',     emoji: '🥬', name: 'כרוב',          nameEn: 'cabbage',     unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'corn',        emoji: '🌽', name: 'תירס',          nameEn: 'corn',        unit: 'unit', defaultQty: 2,   category: 'vegetables' },
  { id: 'garlic',      emoji: '🧄', name: 'שום',           nameEn: 'garlic',      unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'sweet_potato',emoji: '🍠', name: 'בטטה',          nameEn: 'sweet potato',unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'spinach',     emoji: '🥬', name: 'תרד',           nameEn: 'spinach',     unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'pumpkin',     emoji: '🎃', name: 'דלעת',          nameEn: 'pumpkin',     unit: 'kg',   defaultQty: 0.5, category: 'vegetables' },
  { id: 'celery',      emoji: '🌿', name: 'סלרי',          nameEn: 'celery',      unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  { id: 'radish',      emoji: '🌱', name: 'צנונית',        nameEn: 'radish',      unit: 'unit', defaultQty: 1,   category: 'vegetables' },
  // פירות
  { id: 'apple',       emoji: '🍎', name: 'תפוח',          nameEn: 'apple',       unit: 'kg',   defaultQty: 1,   category: 'fruits' },
  { id: 'banana',      emoji: '🍌', name: 'בננה',          nameEn: 'banana',      unit: 'kg',   defaultQty: 1,   category: 'fruits' },
  { id: 'orange',      emoji: '🍊', name: 'תפוז',          nameEn: 'orange',      unit: 'kg',   defaultQty: 1,   category: 'fruits' },
  { id: 'lemon',       emoji: '🍋', name: 'לימון',         nameEn: 'lemon',       unit: 'kg',   defaultQty: 0.5, category: 'fruits' },
  { id: 'watermelon',  emoji: '🍉', name: 'אבטיח',         nameEn: 'watermelon',  unit: 'kg',   defaultQty: 2,   category: 'fruits' },
  { id: 'melon',       emoji: '🍈', name: 'מלון',          nameEn: 'melon',       unit: 'unit', defaultQty: 1,   category: 'fruits' },
  { id: 'grapes',      emoji: '🍇', name: 'ענבים',         nameEn: 'grapes',      unit: 'kg',   defaultQty: 0.5, category: 'fruits' },
  { id: 'mango',       emoji: '🥭', name: 'מנגו',          nameEn: 'mango',       unit: 'unit', defaultQty: 2,   category: 'fruits' },
  { id: 'strawberry',  emoji: '🍓', name: 'תות שדה',       nameEn: 'strawberry',  unit: 'unit', defaultQty: 1,   category: 'fruits' },
  { id: 'peach',       emoji: '🍑', name: 'אפרסק',         nameEn: 'peach',       unit: 'kg',   defaultQty: 0.5, category: 'fruits' },
  { id: 'plum',        emoji: '🫐', name: 'שזיף',          nameEn: 'plum',        unit: 'kg',   defaultQty: 0.5, category: 'fruits' },
  { id: 'pear',        emoji: '🍐', name: 'אגס',           nameEn: 'pear',        unit: 'kg',   defaultQty: 0.5, category: 'fruits' },
  { id: 'pomegranate', emoji: '🔴', name: 'רימון',         nameEn: 'pomegranate', unit: 'unit', defaultQty: 2,   category: 'fruits' },
  { id: 'kiwi',        emoji: '🥝', name: 'קיווי',         nameEn: 'kiwi',        unit: 'unit', defaultQty: 3,   category: 'fruits' },
  { id: 'avocado',     emoji: '🥑', name: 'אבוקדו',        nameEn: 'avocado',     unit: 'unit', defaultQty: 2,   category: 'fruits' },
  { id: 'clementine',  emoji: '🍊', name: 'קלמנטינה',      nameEn: 'clementine',  unit: 'kg',   defaultQty: 1,   category: 'fruits' },
  { id: 'grapefruit',  emoji: '🍊', name: 'אשכולית',       nameEn: 'grapefruit',  unit: 'unit', defaultQty: 2,   category: 'fruits' },
  { id: 'cherry',      emoji: '🍒', name: 'דובדבן',        nameEn: 'cherry',      unit: 'unit', defaultQty: 1,   category: 'fruits' },
  { id: 'fig',         emoji: '🫐', name: 'תאנה',          nameEn: 'fig',         unit: 'unit', defaultQty: 1,   category: 'fruits' },
  { id: 'date',        emoji: '🌴', name: 'תמר',           nameEn: 'date',        unit: 'unit', defaultQty: 1,   category: 'fruits' },
  // עשבי תיבול
  { id: 'parsley',     emoji: '🌿', name: 'פטרוזיליה',     nameEn: 'parsley',     unit: 'unit', defaultQty: 1,   category: 'herbs' },
  { id: 'coriander',   emoji: '🌿', name: 'כוסברה',        nameEn: 'coriander',   unit: 'unit', defaultQty: 1,   category: 'herbs' },
  { id: 'mint',        emoji: '🌱', name: 'נענע',          nameEn: 'mint',        unit: 'unit', defaultQty: 1,   category: 'herbs' },
  { id: 'dill',        emoji: '🌿', name: 'שמיר',          nameEn: 'dill',        unit: 'unit', defaultQty: 1,   category: 'herbs' },
  { id: 'basil',       emoji: '🌿', name: 'בזיליקום',      nameEn: 'basil',       unit: 'unit', defaultQty: 1,   category: 'herbs' },
];

const CATEGORY_LABELS: Record<string, string> = {
  vegetables: '🥦 ירקות',
  fruits:     '🍎 פירות',
  herbs:      '🌿 עשבי תיבול',
};

const CHAIN_COLORS: Record<string, string> = {
  'שופרסל':   '#e53e3e',
  'רמי לוי':  '#3182ce',
  'ויקטורי':  '#d69e2e',
  'מגה':      '#805ad5',
  'אושר עד':  '#38a169',
  'טיב טעם':  '#dd6b20',
  'יינות ביתן': '#2b6cb0',
  'חצי חינם': '#c05621',
};

function getChainColor(chain: string): string {
  for (const [key, color] of Object.entries(CHAIN_COLORS)) {
    if (chain.includes(key)) return color;
  }
  return '#10b981';
}

// ── Qty stepper ────────────────────────────────────────────────────────────────
function QtyControl({ qty, unit, onChange }: { qty: number; unit: 'kg' | 'unit'; onChange: (q: number) => void }) {
  const step = unit === 'kg' ? 0.5 : 1;
  const min = unit === 'kg' ? 0.5 : 1;
  const label = unit === 'kg' ? `${qty} ק"ג` : `${qty} יח׳`;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, qty - step))}
        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors active:scale-90"
      >−</button>
      <span className="text-xs font-semibold text-gray-700 w-12 text-center tabular-nums">{label}</span>
      <button
        onClick={() => onChange(qty + step)}
        className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm transition-colors active:scale-90"
      >+</button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ProducePage() {
  const [basket, setBasket] = useState<Map<string, BasketItem>>(() => {
    // default basket — סל בסיסי
    const defaults = ['tomato','cucumber','pepper_red','onion','potato','carrot','apple','banana','orange'];
    const map = new Map<string, BasketItem>();
    defaults.forEach(id => {
      const item = PRODUCE_CATALOG.find(p => p.id === id)!;
      map.set(id, { ...item, qty: item.defaultQty });
    });
    return map;
  });

  const [activeCategory, setActiveCategory] = useState<'vegetables' | 'fruits' | 'herbs' | 'basket'>('basket');
  const [results, setResults] = useState<StoreResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const basketCount = basket.size;
  const basketItems = Array.from(basket.values());

  const toggleItem = useCallback((item: ProduceItem) => {
    setBasket(prev => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, { ...item, qty: item.defaultQty });
      }
      return next;
    });
    setResults(null);
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setBasket(prev => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(id);
      } else {
        const item = next.get(id);
        if (item) next.set(id, { ...item, qty });
      }
      return next;
    });
    setResults(null);
  }, []);

  const compare = async () => {
    if (basket.size === 0) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const payload = {
        items: basketItems.map(item => ({
          name: item.nameEn,
          name_he: item.name,
          quantity: item.qty,
          unit: item.unit,
        })),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/produce/compare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(typeof window !== 'undefined' && localStorage.getItem('session_token')
              ? { 'x-session-token': localStorage.getItem('session_token')! }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(`שגיאת שרת: ${res.status}`);
      const data = await res.json();
      setResults(data.stores || data.results || data || []);
    } catch (e: any) {
      setError(e.message || 'שגיאה בהשוואה');
    } finally {
      setLoading(false);
    }
  };

  const [expandedStore, setExpandedStore] = useState<number | null>(null);

  const savings = results && results.length >= 2
    ? results[results.length - 1].total_price - results[0].total_price
    : 0;

  const categories = ['vegetables', 'fruits', 'herbs'] as const;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 200px)' }} dir="rtl">

      {/* ── Hero ── */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            🥦
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">סל ירקות ופירות</h1>
            <p className="text-xs text-gray-500">בחרו מוצרים · השוו מחירים בין הרשתות</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar: basket / categories ── */}
      <div className="px-4 mb-3">
        <div className="flex gap-1.5 p-1 rounded-2xl bg-white shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveCategory('basket')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === 'basket'
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeCategory === 'basket'
              ? { background: 'linear-gradient(135deg,#10b981,#059669)' }
              : {}}
          >
            🛒 הסל שלי
            {basketCount > 0 && (
              <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                activeCategory === 'basket' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>{basketCount}</span>
            )}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Basket view ── */}
      {activeCategory === 'basket' && (
        <div className="px-4">
          {basket.size === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-400 text-sm font-medium">הסל ריק</p>
              <p className="text-gray-300 text-xs mt-1">עברו לטאב ירקות / פירות להוסיף מוצרים</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {basketItems.map(item => (
                <div key={item.id}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="flex-1 font-semibold text-sm text-gray-800">{item.name}</span>
                  <QtyControl qty={item.qty} unit={item.unit} onChange={q => updateQty(item.id, q)} />
                  <button onClick={() => toggleItem(item)}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors text-xs active:scale-90">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Compare CTA */}
          {basket.size > 0 && (
            <button
              onClick={compare}
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  משווה מחירים...
                </span>
              ) : (
                `השווה מחירים ל-${basket.size} מוצרים 🔍`
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div className="mt-5">
              {/* Savings banner */}
              {savings > 2 && (
                <div className="mb-4 p-4 rounded-2xl text-white text-center"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  <div className="text-2xl font-black">חיסכון של ₪{savings.toFixed(2)}</div>
                  <div className="text-sm text-white/80 mt-0.5">בין הרשת הזולה ביותר ליקרה</div>
                </div>
              )}

              <h2 className="font-bold text-gray-800 text-sm mb-3 px-1">
                תוצאות — {results.length} סניפים
              </h2>

              <div className="space-y-3">
                {results.map((store, i) => {
                  const isCheapest = i === 0;
                  const accentColor = getChainColor(store.chain_name);
                  const isExpanded = expandedStore === store.store_id;

                  return (
                    <div key={store.store_id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                        isCheapest ? 'border-emerald-200 shadow-emerald-50' : 'border-gray-100'
                      }`}>
                      {isCheapest && (
                        <div className="px-4 py-1.5 text-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                          🏆 הכי זול!
                        </div>
                      )}

                      {/* ── Store header row — לחיץ לפתיחה ── */}
                      <button
                        className="w-full px-4 py-3 flex items-center gap-3 text-right"
                        onClick={() => setExpandedStore(isExpanded ? null : store.store_id)}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                          style={{ background: accentColor }}>
                          {store.chain_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm truncate">{store.store_name}</div>
                          <div className="text-xs text-gray-400">{store.chain_name} · {store.city}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            נמצאו {store.found_items}/{store.total_items} מוצרים
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                          <div className={`text-xl font-black ${isCheapest ? 'text-emerald-600' : 'text-gray-800'}`}>
                            ₪{store.total_price.toFixed(2)}
                          </div>
                          {i > 0 && results[0] && (
                            <div className="text-xs text-red-400 font-semibold">
                              +₪{(store.total_price - results[0].total_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                        {/* chevron */}
                        <svg
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round"
                          className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* ── Expandable items breakdown ── */}
                      {isExpanded && store.item_details && store.item_details.length > 0 && (
                        <div className="px-4 pb-3 border-t border-gray-50">
                          <div className="pt-2 space-y-1.5">
                            {store.item_details.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-400">
                                    ₪{item.unit_price.toFixed(2)} ליח׳
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800 w-14 text-left">
                                    ₪{item.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {/* מוצרים שלא נמצאו */}
                            {store.found_items < store.total_items && (
                              <div className="pt-1 border-t border-gray-50 text-xs text-gray-400 text-center">
                                {store.total_items - store.found_items} מוצרים לא נמצאו בסניף זה
                              </div>
                            )}
                            {/* סה"כ */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-sm font-bold text-gray-700">סה״כ</span>
                              <span className={`text-base font-black ${isCheapest ? 'text-emerald-600' : 'text-gray-800'}`}>
                                ₪{store.total_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searched && !loading && results && results.length === 0 && (
            <div className="mt-5 text-center py-8">
              <div className="text-4xl mb-2">😕</div>
              <p className="text-gray-500 text-sm">לא נמצאו תוצאות להשוואה</p>
            </div>
          )}
        </div>
      )}

      {/* ── Category view ── */}
      {activeCategory !== 'basket' && (
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2">
            {PRODUCE_CATALOG.filter(p => p.category === activeCategory).map(item => {
              const inBasket = basket.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border-2 text-right transition-all active:scale-95 ${
                    inBasket
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${inBasket ? 'text-emerald-800' : 'text-gray-700'}`}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {item.unit === 'kg' ? `לפי ק"ג` : 'ליחידה'}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    inBasket
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-300'
                  }`}>
                    {inBasket ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold leading-none">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floating basket indicator */}
          {basket.size > 0 && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
              <button
                onClick={() => setActiveCategory('basket')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-xl active:scale-95 transition-all"
                style={{
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.45)',
                }}
              >
                🛒 לסל ({basket.size} מוצרים)
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
