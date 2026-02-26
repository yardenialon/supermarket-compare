'use client';
import { useEffect, useState } from 'react';
import { dealsApi } from '@/lib/api';
import { DealModal, ChainLogo, daysLeft } from '@/components/DealModal';
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
