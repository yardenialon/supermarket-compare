'use client';
import { useEffect, useState } from 'react';
import { dealsApi } from '@/lib/api';
import Link from 'next/link';

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  'Shufersal':    { he: 'שופרסל',      color: '#e11d48', logo: '/logos/shufersal.png' },
  'Rami Levy':    { he: 'רמי לוי',     color: '#2563eb', logo: '/logos/rami-levy.png' },
  'Victory':      { he: 'ויקטורי',     color: '#f59e0b', logo: '/logos/victory.png' },
  'Mega':         { he: 'מגה',         color: '#16a34a', logo: '/logos/mega.png' },
  'Osher Ad':     { he: 'אושר עד',     color: '#8b5cf6', logo: '/logos/osher-ad.png' },
  'Tiv Taam':     { he: 'טיב טעם',     color: '#ec4899', logo: '/logos/tiv-taam.png' },
  'Yochananof':   { he: 'יוחננוף',     color: '#0891b2', logo: '/logos/yochananof.png' },
  'Hazi Hinam':   { he: 'חצי חינם',    color: '#ea580c', logo: '/logos/hazi-hinam.png' },
  'Bareket':      { he: 'סופר ברקת',   color: '#a855f7', logo: '/logos/bareket.png' },
  'Mahsani Ashuk':{ he: 'מחסני השוק',  color: '#f97316', logo: '/logos/mahsani-ashuk.png' },
  'City Market':  { he: 'סיטי מרקט',   color: '#6b7280', logo: '/logos/city-market.png' },
  'Dor Alon':     { he: 'דור אלון',    color: '#0d9488', logo: '/logos/alunit.png' },
  'Het Cohen':    { he: 'חט כהן',      color: '#7c3aed', logo: '/logos/Het-Cohen.png' },
  'Good Pharm':   { he: 'גוד פארם',    color: '#10b981', logo: '/logos/Good-Pharm.png' },
  'Keshet Taamim':{ he: 'קשת טעמים',   color: '#059669', logo: '/logos/keshet-taamim.png' },
};

function ChainLogo({ name, size = 40 }: { name: string; size?: number }) {
  const c = CHAINS[name] || { he: name, color: '#6b7280', logo: '' };
  const [err, setErr] = useState(false);
  if (c.logo && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 10, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={c.logo} alt={c.he} width={size} height={size} onError={() => setErr(true)} className="object-contain p-0.5" />
      </div>
    );
  }
  return (
    <span className="flex items-center justify-center text-white font-black text-sm rounded-xl" style={{ backgroundColor: c.color, width: size, height: size }}>
      {c.he.charAt(0)}
    </span>
  );
}

function daysLeft(endDate: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function DealModal({ deal, onClose, onAddToList }: { deal: any; onClose: () => void; onAddToList: (deal: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const chainHe = CHAINS[deal.chainName]?.he || deal.chainName;
  const days = daysLeft(deal.endDate);

  useEffect(() => {
    dealsApi.items(deal.promotionId).then((d: any) => setItems(d.items || []));
  }, [deal.promotionId]);

  const regularPrice = items[0]?.regularPrice || null;
  const promoPrice = deal.discountedPrice;
  const minQty = deal.minQty || 1;
  const saving = regularPrice && promoPrice ? ((regularPrice * minQty) - promoPrice).toFixed(2) : null;
  const savingPct = regularPrice && promoPrice ? Math.round(((regularPrice * minQty - promoPrice) / (regularPrice * minQty)) * 100) : null;
  const pricePerUnit = promoPrice && minQty > 1 ? (promoPrice / minQty).toFixed(2) : null;
  const wazeUrl = 'https://waze.com/ul?q=' + encodeURIComponent((deal.storeName || '') + ' ' + (deal.city || '') + ' ישראל') + '&navigate=yes';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 z-10">✕</button>
        <div className="relative bg-stone-50 rounded-t-3xl h-48 flex items-center justify-center">
          {deal.imageUrl
            ? <img src={deal.imageUrl} alt={deal.productName} className="max-h-full max-w-full object-contain p-4" />
            : <span className="text-6xl">🏷️</span>
          }
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">🔥 מבצע</div>
          {deal.isClubOnly && <div className="absolute top-4 right-20 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">מועדון</div>}
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-black text-stone-800 text-right">{deal.productName}</h2>
            <p className="text-base text-red-600 font-bold text-right mt-1">{deal.description}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-right">
                {promoPrice && <p className="text-3xl font-black text-emerald-600">₪{promoPrice}</p>}
                {pricePerUnit && <p className="text-sm text-stone-500">₪{pricePerUnit} ליחידה</p>}
                {regularPrice && <p className="text-sm text-stone-400 line-through">מחיר רגיל: ₪{(regularPrice * minQty).toFixed(2)}</p>}
              </div>
              {saving && +saving > 0 && (
                <div className="bg-emerald-500 text-white rounded-2xl px-4 py-2 text-center">
                  <p className="text-xs">חוסך</p>
                  <p className="text-xl font-black">₪{saving}</p>
                  {savingPct && <p className="text-xs">{savingPct}%</p>}
                </div>
              )}
            </div>
            {minQty > 1 && <p className="text-xs text-stone-500 text-right bg-white rounded-lg px-3 py-1.5">📦 מינימום: {minQty} יחידות</p>}
          </div>
          {deal.endDate && (
            <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${days !== null && days <= 3 ? 'bg-red-50' : 'bg-stone-50'}`}>
              <span className={`text-sm font-bold ${days !== null && days <= 3 ? 'text-red-600' : 'text-stone-600'}`}>
                {days !== null && days <= 0 ? '⚠️ פג תוקף' : days !== null && days <= 3 ? `⏰ ${days} ימים אחרונים!` : `נותרו ${days} ימים`}
              </span>
              <span className="text-xs text-stone-400">עד {new Date(deal.endDate).toLocaleDateString('he-IL')}</span>
            </div>
          )}
          <div className="bg-stone-50 rounded-xl p-4 flex items-center justify-between">
            <a href={wazeUrl} target="_blank" className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium">🗺️ נווט</a>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-sm font-bold text-stone-700">{deal.storeName}</p>
                <ChainLogo name={deal.chainName} size={24} />
              </div>
              <p className="text-xs text-stone-400">{chainHe} · {deal.city}</p>
            </div>
          </div>
          {items.length > 1 && (
            <div>
              <p className="text-sm font-bold text-stone-700 text-right mb-2">מוצרים במבצע ({items.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((item: any) => (
                  <div key={item.id} className="shrink-0 w-16 flex flex-col items-center gap-1">
                    <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="object-contain max-h-full max-w-full p-1" /> : <span className="text-2xl">📦</span>}
                    </div>
                    <p className="text-[10px] text-stone-500 text-center leading-tight line-clamp-2">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { onAddToList(deal); onClose(); }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
            <span>+</span> הוסף לרשימת הקניות
          </button>
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal, onClick }: { deal: any; onClick: () => void }) {
  const chainHe = CHAINS[deal.chainName]?.he || deal.chainName;
  const days = daysLeft(deal.endDate);
  return (
    <button onClick={onClick} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 flex flex-col gap-3 min-w-[200px] max-w-[220px] shrink-0 hover:shadow-md hover:-translate-y-0.5 transition-all text-right">
      <div className="w-full h-28 bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
        {deal.imageUrl ? <img src={deal.imageUrl} alt={deal.productName} className="object-contain max-h-full max-w-full p-2" /> : <span className="text-4xl">🏷️</span>}
      </div>
      <p className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">{deal.productName}</p>
      <div className="bg-red-50 rounded-lg px-2 py-1.5">
        <p className="text-xs text-red-700 font-medium leading-tight line-clamp-2">{deal.description}</p>
      </div>
      {deal.discountedPrice && <p className="text-lg font-black text-emerald-600">₪{deal.discountedPrice}</p>}
      {!deal.discountedPrice && deal.discountRate && <p className="text-lg font-black text-emerald-600">{deal.discountRate}% הנחה</p>}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <ChainLogo name={deal.chainName} size={22} />
          <span className="text-xs text-stone-400">{chainHe}</span>
        </div>
        {days !== null && days <= 3 && days > 0 && <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-bold">⏰ {days}י׳</span>}
        {deal.isClubOnly && <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">מועדון</span>}
      </div>
    </button>
  );
}

function DealsSlider({ deals, title, onSelect }: { deals: any[]; title: string; onSelect: (d: any) => void }) {
  if (!deals.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-stone-800 text-right mb-3 px-4">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 px-4" style={{ scrollSnapType: 'x mandatory' }}>
        {deals.map((d: any) => (
          <div key={d.promotionId} style={{ scrollSnapAlign: 'start' }}>
            <DealCard deal={d} onClick={() => onSelect(d)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { dealsApi.chains().then((d: any) => setChains(d.chains || [])); }, []);

  useEffect(() => {
    setLoading(true);
    dealsApi.list(selectedChain || undefined, 100).then((d: any) => {
      setDeals(d.deals || []);
      setLoading(false);
    });
  }, [selectedChain]);

  const handleAddToList = (deal: any) => {
    try {
      const saved = localStorage.getItem('savy-list');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.find((i: any) => i.product?.id === deal.productId)) {
        list.push({ product: { id: deal.productId, name: deal.productName, barcode: deal.barcode }, qty: deal.minQty || 1 });
        localStorage.setItem('savy-list', JSON.stringify(list));
      }
      setToast(deal.productName);
      setTimeout(() => setToast(''), 2500);
    } catch {}
  };

  const byChain: Record<string, any[]> = {};
  for (const d of deals) {
    if (!byChain[d.chainName]) byChain[d.chainName] = [];
    byChain[d.chainName].push(d);
  }

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</span>
            {toast} נוסף לרשימה
          </div>
        </div>
      )}
      {selectedDeal && <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onAddToList={handleAddToList} />}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm">← חזרה</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h1 className="text-lg font-bold text-stone-800">מבצעים</h1>
          </div>
          <div className="w-12" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 px-4">
          <button onClick={() => setSelectedChain(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedChain ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>הכל</button>
          {chains.map((c: any) => (
            <button key={c.chainName} onClick={() => setSelectedChain(c.chainName)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedChain === c.chainName ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              <ChainLogo name={c.chainName} size={18} />
              {CHAINS[c.chainName]?.he || c.chainName}
            </button>
          ))}
        </div>
      </div>
      <div className="py-4">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : selectedChain ? (
          <DealsSlider deals={deals} title={CHAINS[selectedChain]?.he || selectedChain} onSelect={setSelectedDeal} />
        ) : (
          Object.entries(byChain).map(([chain, chainDeals]) => (
            <DealsSlider key={chain} deals={chainDeals} title={CHAINS[chain]?.he || chain} onSelect={setSelectedDeal} />
          ))
        )}
      </div>
    </div>
  );
}
