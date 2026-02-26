'use client';
import { useEffect, useState, useRef } from 'react';
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
};

function ChainLogo({ name, size = 40 }: { name: string; size?: number }) {
  const c = CHAINS[name] || { he: name, color: '#6b7280', logo: '' };
  const [err, setErr] = useState(false);
  if (c.logo && !err) return (
    <div style={{ width: size, height: size, borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <img src={c.logo} alt={c.he} width={size} height={size} onError={() => setErr(true)} className="object-contain p-1" />
    </div>
  );
  return <span className="flex items-center justify-center text-white font-black text-sm rounded-xl" style={{ backgroundColor: c.color, width: size, height: size }}>{c.he.charAt(0)}</span>;
}

function DealCard({ deal }: { deal: any }) {
  const chainHe = CHAINS[deal.chainName]?.he || deal.chainName;
  const hasPrice = deal.discountedPrice != null;
  const hasRate = deal.discountRate != null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 flex flex-col gap-3 min-w-[200px] max-w-[220px] shrink-0 hover:shadow-md transition-shadow">
      {/* תמונת מוצר */}
      <div className="w-full h-28 bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
        {deal.imageUrl
          ? <img src={deal.imageUrl} alt={deal.productName} className="object-contain max-h-full max-w-full p-2" />
          : <span className="text-4xl">🏷️</span>
        }
      </div>

      {/* שם מוצר */}
      <p className="text-sm font-semibold text-stone-800 text-right leading-tight line-clamp-2">{deal.productName}</p>

      {/* תיאור מבצע */}
      <div className="bg-red-50 rounded-lg px-2 py-1">
        <p className="text-xs text-red-700 font-medium text-right leading-tight line-clamp-2">{deal.description}</p>
      </div>

      {/* מחיר */}
      {hasPrice && (
        <p className="text-lg font-black text-emerald-600 text-right">₪{deal.discountedPrice}</p>
      )}
      {hasRate && !hasPrice && (
        <p className="text-lg font-black text-emerald-600 text-right">{deal.discountRate}% הנחה</p>
      )}

      {/* רשת + מועדון */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <ChainLogo name={deal.chainName} size={24} />
          <span className="text-xs text-stone-500">{chainHe}</span>
        </div>
        {deal.isClubOnly && (
          <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">מועדון</span>
        )}
      </div>

      {/* תאריך סיום */}
      {deal.endDate && (
        <p className="text-[10px] text-stone-400 text-right">עד {new Date(deal.endDate).toLocaleDateString('he-IL')}</p>
      )}
    </div>
  );
}

function DealsSlider({ deals, title }: { deals: any[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!deals.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-stone-800 text-right mb-3 px-4">{title}</h2>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
        {deals.map(d => (
          <div key={d.promotionId} style={{ scrollSnapAlign: 'start' }}>
            <DealCard deal={d} />
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

  useEffect(() => {
    dealsApi.chains().then(d => setChains(d.chains || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    dealsApi.list(selectedChain || undefined, 100).then(d => {
      setDeals(d.deals || []);
      setLoading(false);
    });
  }, [selectedChain]);

  // קבץ לפי רשת
  const byChain: Record<string, any[]> = {};
  for (const d of deals) {
    if (!byChain[d.chainName]) byChain[d.chainName] = [];
    byChain[d.chainName].push(d);
  }

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm">← חזרה</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h1 className="text-lg font-bold text-stone-800">מבצעים</h1>
          </div>
          <div className="w-12" />
        </div>

        {/* פילטר רשתות */}
        <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedChain(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedChain ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            הכל
          </button>
          {chains.map(c => (
            <button
              key={c.chainName}
              onClick={() => setSelectedChain(c.chainName)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedChain === c.chainName ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              <ChainLogo name={c.chainName} size={18} />
              {CHAINS[c.chainName]?.he || c.chainName}
            </button>
          ))}
        </div>
      </div>

      {/* תוכן */}
      <div className="py-4">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : selectedChain ? (
          <DealsSlider deals={deals} title={CHAINS[selectedChain]?.he || selectedChain} />
        ) : (
          Object.entries(byChain).map(([chain, chainDeals]) => (
            <DealsSlider key={chain} deals={chainDeals} title={CHAINS[chain]?.he || chain} />
          ))
        )}
      </div>
    </div>
  );
}
