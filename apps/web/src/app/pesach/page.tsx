"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API || 'https://supermarket-compare-production.up.railway.app';

const PESACH_PRODUCTS = [
  { productId: 448,   name: 'כיף כף',                    qty: 2, emoji: '🧴' },
  { productId: 5951,  name: "סנו ז'וואל תרסיס ניקוי",    qty: 1, emoji: '🧹' },
  { productId: 2603,  name: "פרסיל ג'ל ירוק 2.5 ל",      qty: 1, emoji: '👕' },
  { productId: 681,   name: 'אוקסיגן מרסס מסיר כתמים',   qty: 1, emoji: '✨' },
  { productId: 674,   name: 'מנקה אסלות סנו 1 ליטר',     qty: 2, emoji: '🚽' },
  { productId: 683,   name: 'אנטי קאלק מסיר אבנית',      qty: 1, emoji: '🔧' },
  { productId: 4360,  name: 'בדין אקסטרה פלוס',          qty: 1, emoji: '🫧' },
  { productId: 3674,  name: 'ריצפז פרש הום',              qty: 1, emoji: '🏠' },
  { productId: 6172,  name: 'מרכך כביסה מקסימה',         qty: 1, emoji: '🌸' },
  { productId: 13905, name: "אקונומיקה ז'אוול 4 ל",      qty: 1, emoji: '🧼' },
  { productId: 679,   name: 'סנוקליר תרסיס לניקוי',      qty: 1, emoji: '💨' },
  { productId: 7146,  name: 'תרסיס להסרת כתמים קלין',    qty: 1, emoji: '🎯' },
  { productId: 6743,  name: 'מגבות נייר ניקול שישיה',    qty: 2, emoji: '🗒️' },
  { productId: 7147,  name: 'נוזל הברקה למדיח פיניש',    qty: 1, emoji: '✨' },
  { productId: 5039,  name: 'נוזל כלים פלמוליב',         qty: 2, emoji: '🍽️' },
  { productId: 8100,  name: 'שלישיית מטליות קסם',        qty: 1, emoji: '🧽' },
  { productId: 2587,  name: 'מטליות לחות לניקוי כללי',   qty: 1, emoji: '🫧' },
  { productId: 1230,  name: 'גל כביסה אריאל 1.75 ל',     qty: 1, emoji: '🌊' },
];

const SUBCHAINS: Record<string, { he: string; logo: string }> = {
  'שופרסל שלי':    { he: 'שופרסל שלי',    logo: '/logos/subchains/shufersal-sheli.png' },
  'שופרסל דיל':    { he: 'שופרסל דיל',    logo: '/logos/subchains/shufersal-deal.png' },
  'שופרסל אקספרס': { he: 'שופרסל אקספרס', logo: '/logos/subchains/shufersal-express.png' },
  'AM-PM':         { he: 'AM-PM',          logo: '/logos/ampm.png' },
  'אלונית':        { he: 'אלונית',         logo: '/logos/alunit.png' },
  'דוכן':          { he: 'דוכן',           logo: '/logos/dohan.png' },
};

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  'Shufersal':          { he: 'שופרסל',       color: '#e11d48', logo: '/logos/shufersal.png' },
  'Rami Levy':          { he: 'רמי לוי',      color: '#2563eb', logo: '/logos/rami-levy.png' },
  'Victory':            { he: 'ויקטורי',      color: '#f59e0b', logo: '/logos/victory.png' },
  'Osher Ad':           { he: 'אושר עד',      color: '#8b5cf6', logo: '/logos/osher-ad.png' },
  'Tiv Taam':           { he: 'טיב טעם',      color: '#ec4899', logo: '/logos/tiv-taam.png' },
  'Yochananof':         { he: 'יוחננוף',      color: '#0891b2', logo: '/logos/yochananof.png' },
  'Hazi Hinam':         { he: 'חצי חינם',     color: '#ea580c', logo: '/logos/hazi-hinam.png' },
  'Bareket':            { he: 'סופר ברקת',    color: '#a855f7', logo: '/logos/bareket.png' },
  'Mahsani Ashuk':      { he: 'מחסני השוק',   color: '#f97316', logo: '/logos/mahsani-ashuk.png' },
  'City Market':        { he: 'סיטי מרקט',    color: '#6b7280', logo: '/logos/city-market.png' },
  'Dor Alon':           { he: 'דור אלון',     color: '#0d9488', logo: '/logos/alunit.png' },
  'Het Cohen':          { he: 'חט כהן',       color: '#7c3aed', logo: '/logos/Het-Cohen.png' },
  'Good Pharm':         { he: 'גוד פארם',     color: '#10b981', logo: '/logos/Good-Pharm.png' },
  'Keshet Taamim':      { he: 'קשת טעמים',    color: '#059669', logo: '/logos/keshet-taamim.png' },
  'Freshmarket':        { he: 'פרש מרקט',     color: '#0ea5e9', logo: '/logos/freshmarket.png' },
  'King Store':         { he: 'קינג סטור',    color: '#dc2626', logo: '/logos/king-store.png' },
  'Maayan 2000':        { he: 'מעיין 2000',   color: '#7c3aed', logo: '/logos/maian2000.png' },
  'Netiv Hased':        { he: 'נתיב חסד',     color: '#15803d', logo: '/logos/Netiv-Hased.png' },
  'Shefa Barcart Ashem':{ he: 'שפע',          color: '#b45309', logo: '/logos/Shefa-Barcart-Ashem.png' },
  'Stop Market':        { he: 'סטופ מרקט',    color: '#475569', logo: '/logos/stopmarket.png' },
  'Carrefour':          { he: 'קארפור',       color: '#1d4ed8', logo: '/logos/Carrefour.png' },
  'Zol Vebegadol':      { he: 'זול ובגדול',   color: '#b91c1c', logo: '/logos/zol-vebegadol.png' },
  'Super Sapir':        { he: 'סופר ספיר',    color: '#16a34a', logo: '/logos/Super-Sapir.png' },
  'Super Yuda':         { he: 'סופר יהודה',   color: '#ea580c', logo: '/logos/super-yuda.png' },
  'Shuk Ahir':          { he: 'שוק העיר',     color: '#0891b2', logo: '/logos/shuk-haeir.png' },
  'Polizer':            { he: 'פוליצר',       color: '#7c3aed', logo: '/logos/polizer.png' },
  'Salach Dabach':      { he: 'סלאח דבאח',    color: '#b45309', logo: '/logos/salach-dabach.png' },
  'AM-PM':              { he: 'AM-PM',        color: '#e67e00', logo: '/logos/ampm.png' },
  'אלונית':             { he: 'אלונית',       color: '#0d9488', logo: '/logos/alunit.png' },
  'דוכן':               { he: 'דוכן',         color: '#5b6b7c', logo: '/logos/dohan.png' },
};

function CLogo({ name, subchain, size = 40 }: { name: string; subchain?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const sub = subchain ? SUBCHAINS[subchain] : null;
  const logo = sub?.logo || CHAINS[name]?.logo || '';
  const he = sub?.he || CHAINS[name]?.he || name;
  const color = CHAINS[name]?.color || '#6b7280';

  if (logo && !err) {
    return <img src={logo} alt={he} width={size} height={size} onError={() => setErr(true)} className="object-contain rounded-lg" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ width: size, height: size, background: color }}>
      {he.charAt(0)}
    </div>
  );
}

interface StoreResult {
  storeId: number; storeName: string; chainName: string; subchainName?: string;
  city: string; total: number; availableCount: number; missingCount: number; dist?: number;
  breakdown: { productId: number; price: number; qty: number; subtotal: number }[];
}

export default function PesachBasket() {
  const [items, setItems] = useState(PESACH_PRODUCTS);
  const [results, setResults] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locMode, setLocMode] = useState<'cheap' | 'nearby'>('cheap');
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savy-location');
    if (saved) { try { setUserLoc(JSON.parse(saved)); } catch {} }
  }, []);

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(loc);
      localStorage.setItem('savy-location', JSON.stringify(loc));
      setLocMode('nearby');
    });
  };

  const compare = useCallback(async () => {
    setLoading(true);
    setCompared(true);
    try {
      const useLoc = locMode === 'nearby' && userLoc;
      const res = await fetch(`${API}/api/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, qty: i.qty })),
          lat: useLoc ? userLoc!.lat : undefined,
          lng: useLoc ? userLoc!.lng : undefined,
        }),
      });
      const data = await res.json();
      setResults(data.bestStoreCandidates || []);
    } catch {}
    setLoading(false);
  }, [items, locMode, userLoc]);

  const importToApp = () => {
    const list = items.map(i => ({ product: { id: i.productId, name: i.name, barcode: '', brand: '', minPrice: null, unitQty: '', unitMeasure: '', matchScore: 0, maxPrice: null, storeCount: 0 }, qty: i.qty }));
    localStorage.setItem('savy-list', JSON.stringify(list));
    window.location.href = '/';
  };

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const cheapest = results[0];
  const priceDiff = results.length > 1 ? results[results.length - 1].total - results[0].total : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-stone-50 pb-24" dir="rtl">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-bl from-amber-400 via-yellow-300 to-amber-200 px-4 pt-10 pb-14">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d97706 0%, transparent 50%)' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-3">🧹✨🏠</div>
          <h1 className="text-3xl font-black text-amber-900 leading-tight mb-2">
            סל קניות לניקיון
            <br />וסדר פסח
          </h1>
          <p className="text-amber-800 text-sm font-medium mb-6">
            {totalItems} מוצרי הניקיון הנמכרים ביותר — השוואת מחירים בכל הרשתות
          </p>

          {/* Mode selector */}
          <div className="inline-flex bg-white/50 rounded-2xl p-1 gap-1 mb-4">
            <button onClick={() => setLocMode('cheap')} className={"px-4 py-2 rounded-xl text-sm font-bold transition-all " + (locMode === 'cheap' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-700')}>
              💰 הכי זול
            </button>
            <button onClick={() => { setLocMode('nearby'); if (!userLoc) getLocation(); }} className={"px-4 py-2 rounded-xl text-sm font-bold transition-all " + (locMode === 'nearby' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-700')}>
              📍 הכי קרוב
            </button>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={compare} disabled={loading} className="px-8 py-3.5 rounded-2xl bg-amber-900 text-white font-black text-base shadow-lg hover:bg-amber-800 transition-all active:scale-95 disabled:opacity-60">
              {loading ? '⏳ משווה...' : '🔍 השווה מחירים'}
            </button>
            <button onClick={importToApp} className="px-5 py-3.5 rounded-2xl bg-white/70 text-amber-900 font-bold text-sm hover:bg-white transition-all">
              ➕ הוסף לרשימה
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">

        {/* Savings banner */}
        {priceDiff > 10 && (
          <div className="bg-emerald-500 text-white rounded-2xl px-5 py-4 mb-5 flex items-center justify-between shadow-lg">
            <div>
              <div className="font-black text-lg">חסכון אפשרי: ₪{priceDiff.toFixed(0)}</div>
              <div className="text-emerald-100 text-xs">בין הרשת הזולה ליקרה ביותר</div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        )}

        {/* Results */}
        {compared && (
          <div className="mb-6">
            <h2 className="font-black text-stone-800 text-lg mb-3">השוואת רשתות</h2>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full" /></div>
            ) : results.length === 0 ? (
              <div className="text-center py-10 text-stone-400">לא נמצאו תוצאות</div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 8).map((store, idx) => {
                  const isOpen = expanded === store.storeId;
                  const isCheapest = idx === 0;
                  return (
                    <div key={store.storeId} className={"rounded-2xl border-2 overflow-hidden transition-all " + (isCheapest ? 'border-emerald-400 shadow-md' : 'border-stone-100 bg-white')}>
                      <button onClick={() => setExpanded(isOpen ? null : store.storeId)} className="w-full px-4 py-3.5 flex items-center gap-3 text-right">
                        {isCheapest && <span className="absolute mr-1 -mt-8 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">הכי זול 🏆</span>}
                        <CLogo name={store.chainName} subchain={store.subchainName} size={44} />
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-stone-800 text-sm">
                            {store.subchainName ? (SUBCHAINS[store.subchainName]?.he || store.subchainName) : (CHAINS[store.chainName]?.he || store.chainName)}
                          </div>
                          <div className="text-xs text-stone-400 truncate">{store.storeName} · {store.city}</div>
                          {store.missingCount > 0 && <div className="text-xs text-orange-500">{store.missingCount} מוצרים חסרים</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className={"text-xl font-black " + (isCheapest ? 'text-emerald-600' : 'text-stone-800')}>
                            ₪{store.total.toFixed(0)}
                          </div>
                          {idx > 0 && <div className="text-xs text-red-400">+₪{(store.total - cheapest.total).toFixed(0)}</div>}
                        </div>
                        <span className="text-stone-300 text-lg">{isOpen ? '▲' : '▼'}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/50">
                          {store.breakdown.map((b, bi) => {
                            const prod = items.find(i => i.productId === b.productId);
                            return (
                              <div key={b.productId} className={"flex items-center justify-between py-2 text-xs " + (bi < store.breakdown.length - 1 ? 'border-b border-stone-100' : '')}>
                                <span className="text-stone-600 flex items-center gap-1.5">
                                  <span>{prod?.emoji}</span>
                                  <span>{prod?.name || `מוצר #${b.productId}`}</span>
                                  {b.qty > 1 && <span className="text-stone-400">×{b.qty}</span>}
                                </span>
                                <span className="font-bold text-stone-700">₪{b.subtotal.toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between pt-2 font-black text-sm text-stone-800 border-t border-stone-200 mt-1">
                            <span>סה"כ</span>
                            <span>₪{store.total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Product list */}
        <div>
          <h2 className="font-black text-stone-800 text-lg mb-3">🛒 מוצרי הסל ({items.length} מוצרים)</h2>
          <div className="grid grid-cols-1 gap-2">
            {items.map(item => (
              <div key={item.productId} className="bg-white rounded-xl px-4 py-3 border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <div className="font-bold text-sm text-stone-800">{item.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setItems(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-lg">−</button>
                  <span className="w-5 text-center font-black text-sm">{item.qty}</span>
                  <button onClick={() => setItems(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i))} className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-stone-100 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={importToApp} className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-bold text-sm">
            ➕ הוסף לרשימה שלי
          </button>
          <button onClick={compare} disabled={loading} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-black text-sm disabled:opacity-60">
            {loading ? '⏳' : '🔍 השווה'}
          </button>
        </div>
      </div>
    </div>
  );
}
