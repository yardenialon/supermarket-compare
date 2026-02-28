'use client';
import { useEffect, useState, useCallback } from 'react';
import { dealsApi } from '@/lib/api';
import { DealModal, ChainLogo } from '@/components/DealModal';
import Link from 'next/link';

const CHAINS: Record<string, string> = {
  'Shufersal': 'שופרסל', 'Rami Levy': 'רמי לוי', 'Victory': 'ויקטורי',
  'Mega': 'מגה', 'Osher Ad': 'אושר עד', 'Tiv Taam': 'טיב טעם',
  'Yochananof': 'יוחננוף', 'Hazi Hinam': 'חצי חינם', 'Bareket': 'סופר ברקת',
  'Mahsani Ashuk': 'מחסני השוק', 'City Market': 'סיטי מרקט', 'Dor Alon': 'דור אלון',
  'Het Cohen': 'חט כהן', 'Good Pharm': 'גוד פארם', 'Keshet Taamim': 'קשת טעמים',
  'Freshmarket': 'פרש מרקט', 'King Store': 'קינג סטור', 'Maayan 2000': 'מעיין 2000',
  'Netiv Hased': 'נתיב חסד', 'Shefa Barcart Ashem': 'שפע',
};

function daysLeft(endDate: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function DealCard({ deal, onClick }: { deal: any; onClick: () => void }) {
  const days = daysLeft(deal.endDate);
  const chainHe = CHAINS[deal.chainName] || deal.chainName;

  return (
    <button onClick={onClick} className="group bg-white rounded-2xl border border-stone-100 hover:border-emerald-200 hover:shadow-lg transition-all text-right flex flex-col overflow-hidden">
      {/* תמונה */}
      <div className="relative w-full aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
        {deal.imageUrl
          ? <img src={deal.imageUrl} alt={deal.productName} className="object-contain w-full h-full p-3 group-hover:scale-105 transition-transform" />
          : <span className="text-4xl">🏷️</span>
        }
        {deal.savingPct && deal.savingPct > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
            -{deal.savingPct}%
          </div>
        )}
        {deal.isClubOnly && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            מועדון
          </div>
        )}
        {days !== null && days <= 3 && days > 0 && (
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⏰ {days} ימים
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-bold text-stone-800 leading-tight line-clamp-2">{deal.productName}</p>
        <p className="text-[11px] text-red-600 font-medium leading-tight line-clamp-2 bg-red-50 rounded-lg px-2 py-1">{deal.description}</p>

        <div className="flex items-center justify-between mt-auto pt-1">
          {deal.discountedPrice
            ? <span className="text-base font-black text-emerald-600">₪{deal.discountedPrice}</span>
            : <span className="text-base font-black text-emerald-600">מבצע</span>
          }
          {deal.regularPrice && deal.discountedPrice && (
            <span className="text-xs text-stone-400 line-through">₪{(+deal.regularPrice).toFixed(2)}</span>
          )}
        </div>

        {/* חנות */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-stone-50">
          <ChainLogo name={deal.chainName} size={18} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-stone-600 truncate">{deal.storeName || chainHe}</p>
            {deal.city && <p className="text-[10px] text-stone-400 truncate">{deal.city}</p>}
          </div>
        </div>
      </div>
    </button>
  );
}

function ChainFilterButton({ chain, count, selected, onClick }: { chain: string; count: number; selected: boolean; onClick: () => void }) {
  const chainHe = CHAINS[chain] || chain;
  return (
    <button onClick={onClick} className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all min-w-[90px] ${selected ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-stone-100 bg-white hover:border-stone-300 hover:shadow-sm'}`}>
      <ChainLogo name={chain} size={56} />
      <span className={`text-[11px] font-bold leading-tight text-center ${selected ? 'text-emerald-700' : 'text-stone-600'}`}>{chainHe}</span>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selected ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>{count}</span>
    </button>
  );
}

export default function DealsPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [toast, setToast] = useState('');
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number; city?: string} | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const offset = deals.length;

  useEffect(() => {
    dealsApi.chains().then((d: any) => setChains(d.chains || []));
    // נסה לקבל מיקום אוטומטית
    if (navigator.geolocation) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocLoading(false);
        },
        () => setLocLoading(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  const fetchDeals = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    const currentOffset = reset ? 0 : offset;
    const d = await dealsApi.list(
      selectedChain || undefined,
      25,
      currentOffset,
      userLoc?.lat,
      userLoc?.lng
    );
    if (reset) {
      setDeals(d.deals || []);
    } else {
      setDeals(prev => [...prev, ...(d.deals || [])]);
    }
    setTotal(d.total || 0);
    setLoading(false);
    setLoadingMore(false);
  }, [selectedChain, userLoc, offset]);

  useEffect(() => { fetchDeals(true); }, [selectedChain, userLoc]);

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

  const hasMore = deals.length < total;

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</span>
            {toast} נוסף לרשימה
          </div>
        </div>
      )}
      {selectedDeal && (
        <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onAddToList={handleAddToList} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1">
            ← חזרה
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-black text-stone-800">🏷️ מבצעים</h1>
            {userLoc && (
              <p className="text-xs text-emerald-600 font-medium">📍 ברדיוס 3 ק"מ ממך</p>
            )}
            {locLoading && <p className="text-xs text-stone-400">מאתר מיקום...</p>}
          </div>
          <button
            onClick={() => {
              if (userLoc) { setUserLoc(null); }
              else {
                setLocLoading(true);
                navigator.geolocation?.getCurrentPosition(
                  (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
                  () => setLocLoading(false)
                );
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${userLoc ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}
          >
            {userLoc ? '📍 קרוב אלי' : '📍 הכל'}
          </button>
        </div>

        {/* פילטר רשתות */}
        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-4 scrollbar-hide snap-x snap-mandatory">
          <button
            onClick={() => setSelectedChain(null)}
            className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all min-w-[90px] ${!selectedChain ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-stone-100 bg-white hover:border-stone-300 hover:shadow-sm'}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl shadow-sm">🏪</div>
            <span className={`text-[11px] font-bold ${!selectedChain ? 'text-emerald-700' : 'text-stone-600'}`}>הכל</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${!selectedChain ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>{total}</span>
          </button>
          {chains.map((c: any) => (
            <ChainFilterButton
              key={c.chainName}
              chain={c.chainName}
              count={c.dealCount}
              selected={selectedChain === c.chainName}
              onClick={() => setSelectedChain(selectedChain === c.chainName ? null : c.chainName)}
            />
          ))}
        </div>
      </div>

      {/* Grid מבצעים */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-100" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-3 bg-stone-100 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <span className="text-5xl">🔍</span>
            <p className="text-stone-500 font-medium">לא נמצאו מבצעים באזור שלך</p>
            {userLoc && (
              <button onClick={() => setUserLoc(null)} className="text-emerald-600 text-sm font-medium underline">
                הצג מבצעים מכל הארץ
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-400 text-right mb-3">מציג {deals.length} מתוך {total} מבצעים</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {deals.map((deal: any) => (
                <DealCard key={deal.promotionId} deal={deal} onClick={() => setSelectedDeal(deal)} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchDeals(false)}
                  disabled={loadingMore}
                  className="bg-white border-2 border-emerald-400 text-emerald-600 font-bold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <><div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> טוען...</>
                  ) : (
                    <>טען עוד מבצעים ({total - deals.length} נותרו)</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
