'use client';
import { useEffect, useState, useCallback } from 'react';
import { dealsApi } from '@/lib/api';
import { DealModal, ChainLogo } from '@/components/DealModal';
import Link from 'next/link';

const CHAINS: Record<string, string> = {
  'Shufersal': 'שופרסל', 'Rami Levy': 'רמי לוי', 'Victory': 'ויקטורי',
  'Mega': 'מגה', 'Osher Ad': 'אושר עד', 'Tiv Taam': 'טיב טעם',
  'Yochananof': 'יוחננוף', 'Hazi Hinam': 'חצי חינם', 'Bareket': 'סופר ברקת',
  'Mahsani Ashuk': 'מחסני השוק', 'City Market': 'סיטי מרקט', 'Dor Alon': 'דור אלון', 'AM-PM': 'AM-PM', 'אלונית': 'אלונית', 'דוכן': 'דוכן',
  'Het Cohen': 'חט כהן', 'Good Pharm': 'גוד פארם', 'Keshet Taamim': 'קשת טעמים',
  'Freshmarket': 'פרש מרקט', 'King Store': 'קינג סטור', 'Maayan 2000': 'מעיין 2000',
  'Netiv Hased': 'נתיב חסד', 'Shefa Barcart Ashem': 'שפע',
  'Stop Market': 'סטופ מרקט', 'Carrefour': 'קארפור', 'Zol Vebegadol': 'זול ובגדול',
  'Wolt': 'וולט', 'Polizer': 'פוליצר', 'Super Sapir': 'סופר ספיר',
  'Super Yuda': 'סופר יהודה', 'Shuk Ahir': 'שוק העיר', 'Salach Dabach': 'סלאח דבאח',
  'Meshmat Yosef': 'משמת יוסף', 'Super Dosh': 'סופר דוש',
};

const CATEGORY_COLORS: Record<string, string> = {
  'מוצרי חלב': 'bg-blue-50 text-blue-700 border-blue-200',
  'בשר ועוף': 'bg-red-50 text-red-700 border-red-200',
  'דגים ופירות ים': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'לחם ומאפה': 'bg-amber-50 text-amber-700 border-amber-200',
  'ירקות ופירות': 'bg-green-50 text-green-700 border-green-200',
  'משקאות': 'bg-sky-50 text-sky-700 border-sky-200',
  'חטיפים וממתקים': 'bg-pink-50 text-pink-700 border-pink-200',
  'דגנים וקטניות': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'שימורים ומזון יבש': 'bg-orange-50 text-orange-700 border-orange-200',
  'מוצרים קפואים': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'ניקיון ובית': 'bg-teal-50 text-teal-700 border-teal-200',
  'היגיינה ויופי': 'bg-purple-50 text-purple-700 border-purple-200',
  'מוצרי תינוקות': 'bg-rose-50 text-rose-700 border-rose-200',
  'מזון לחיות מחמד': 'bg-lime-50 text-lime-700 border-lime-200',
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
      <div className="relative w-full aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
        {deal.imageUrl
          ? <img src={deal.imageUrl} alt={deal.productName} className="object-contain w-full h-full p-3 group-hover:scale-105 transition-transform" />
          : <div className="w-16 h-16 rounded-2xl bg-stone-100" />
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
            {days} ימים
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-bold text-stone-800 leading-tight line-clamp-2">{deal.productName}</p>
        <p className="text-[11px] text-red-600 font-medium leading-tight line-clamp-2 bg-red-50 rounded-lg px-2 py-1">{deal.description}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          {deal.discountedPrice
            ? <span className="text-base font-black text-emerald-600">&#8362;{deal.discountedPrice}</span>
            : <span className="text-base font-black text-emerald-600">מבצע</span>
          }
          {deal.regularPrice && deal.discountedPrice && (
            <span className="text-xs text-stone-400 line-through">&#8362;{(+deal.regularPrice).toFixed(2)}</span>
          )}
        </div>
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

export default function DealsPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [toast, setToast] = useState('');
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'chains' | 'categories'>('categories');
  const [showAllChain, setShowAllChain] = useState(false);
  const [radius, setRadius] = useState(3);
  const offset = deals.length;

  useEffect(() => {
    dealsApi.chains().then((d: any) => setChains(d.chains || []));
    (dealsApi as any).categories().then((d: any) => setCategories(d.categories || []));
    if (navigator.geolocation) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
        () => setLocLoading(false),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    }
  }, []);

  const fetchDeals = useCallback(async (reset = true) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    const currentOffset = reset ? 0 : offset;
    const useLocation = userLoc && (!selectedChain || showAllChain === false);
    const d = await dealsApi.list(
      selectedChain || undefined, 25, currentOffset,
      useLocation ? userLoc?.lat : undefined,
      useLocation ? userLoc?.lng : undefined,
      selectedCategory || undefined,
      useLocation ? radius : undefined
    );
    if (reset) setDeals(d.deals || []);
    else setDeals(prev => [...prev, ...(d.deals || [])]);
    setTotal(d.total || 0);
    setLoading(false);
    setLoadingMore(false);
  }, [selectedChain, selectedCategory, userLoc, radius, showAllChain]);

  useEffect(() => { fetchDeals(true); }, [selectedChain, selectedCategory, userLoc, radius, showAllChain]);

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

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">&#10003;</span>
            {toast} נוסף לרשימה
          </div>
        </div>
      )}
      {selectedDeal && <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onAddToList={(deal) => { handleAddToList(deal); setTimeout(() => setSelectedDeal(null), 100); }} />}

      <div className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm">&#8592; חזרה</Link>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-black text-stone-800">מבצעים</h1>
            {userLoc && <p className="text-xs text-emerald-600 font-medium">ברדיוס {radius} ק"מ</p>}
          </div>
          <button
            onClick={() => { if (userLoc) setUserLoc(null); else { setLocLoading(true); navigator.geolocation?.getCurrentPosition((pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); }, () => setLocLoading(false)); } }}
            className={"text-xs px-3 py-1.5 rounded-full font-medium transition-all " + (userLoc ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500')}
          >
            {locLoading ? '...' : userLoc ? `${radius} ק"מ` : 'הכל'}
          </button>
        </div>
        {userLoc && (
          <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-3">
            <span className="text-xs text-stone-400 whitespace-nowrap">1 ק"מ</span>
            <input
              type="range" min={1} max={50} step={1} value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-stone-400 whitespace-nowrap">50 ק"מ</span>
            <span className="text-xs font-bold text-emerald-600 whitespace-nowrap min-w-[45px] text-left">{radius} ק"מ</span>
          </div>
        )}

        {/* Toggle chains/categories */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-2">
          <button
            onClick={() => setFilterMode('categories')}
            className={"px-4 py-1.5 rounded-full text-sm font-bold transition-all " + (filterMode === 'categories' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500')}
          >
            קטגוריות
          </button>
          <button
            onClick={() => setFilterMode('chains')}
            className={"px-4 py-1.5 rounded-full text-sm font-bold transition-all " + (filterMode === 'chains' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500')}
          >
            רשתות
          </button>
        </div>

        {/* Categories filter */}
        {filterMode === 'categories' && (
          <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={"shrink-0 px-4 py-2 rounded-full border text-sm font-bold transition-all " + (!selectedCategory ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400')}
            >
              הכל
            </button>
            {categories.map((c: any) => {
              const colorClass = CATEGORY_COLORS[c.category] || 'bg-stone-50 text-stone-600 border-stone-200';
              const isSelected = selectedCategory === c.category;
              return (
                <button
                  key={c.category}
                  onClick={() => { setSelectedChain(null); setSelectedCategory(isSelected ? null : c.category); }}
                  className={"shrink-0 px-4 py-2 rounded-full border text-sm font-bold transition-all whitespace-nowrap " + (isSelected ? 'bg-stone-900 text-white border-stone-900' : colorClass + ' hover:opacity-80')}
                >
                  {c.category}
                  <span className="mr-1.5 text-xs opacity-60">{c.dealCount}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Chains filter */}
        {filterMode === 'chains' && (
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedChain(null)}
              className={"shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all min-w-[75px] " + (!selectedChain ? 'border-emerald-500 bg-emerald-50' : 'border-stone-100 bg-white')}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg">כל</div>
              <span className={"text-[10px] font-bold " + (!selectedChain ? 'text-emerald-700' : 'text-stone-600')}>הכל</span>
            </button>
            {chains.map((c: any) => (
              <button
                key={c.chainName}
                onClick={() => { setSelectedCategory(null); setShowAllChain(false); setSelectedChain(selectedChain === c.chainName ? null : c.chainName); }}
                className={"shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all min-w-[75px] " + (selectedChain === c.chainName ? 'border-emerald-500 bg-emerald-50' : 'border-stone-100 bg-white hover:border-stone-300')}
              >
                <ChainLogo name={c.chainName} size={48} />
                <span className={"text-[10px] font-bold truncate w-full text-center " + (selectedChain === c.chainName ? 'text-emerald-700' : 'text-stone-600')}>
                  {CHAINS[c.chainName] || c.chainName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

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
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-3xl">🔍</div>
            <div className="text-center">
              <p className="text-stone-700 font-bold mb-1">לא נמצאו מבצעים</p>
              <p className="text-stone-400 text-sm">
                {userLoc ? `לא נמצאו מבצעים ברדיוס ${radius} ק"מ ממך` : selectedChain ? `אין מבצעים פעילים ל${CHAINS[selectedChain] || selectedChain}` : 'נסה לשנות את הסינון'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {userLoc && (
                <button onClick={() => setRadius(Math.min(radius + 10, 50))} className="w-full py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition">
                  הרחב רדיוס ל-{Math.min(radius + 10, 50)} ק"מ
                </button>
              )}
              {(userLoc || selectedCategory || selectedChain) && (
                <button onClick={() => { setUserLoc(null); setSelectedCategory(null); setSelectedChain(null); setRadius(3); }} className="w-full py-2.5 bg-stone-100 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-200 transition">
                  הצג את כל המבצעים
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {selectedChain && userLoc && !showAllChain && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
              <p className="text-xs text-amber-700 font-medium">מציג מבצעים מהסניף הקרוב אליך</p>
              <button
                onClick={() => setShowAllChain(true)}
                className="text-xs font-bold text-amber-700 underline whitespace-nowrap mr-2"
              >
                הצג את כל מבצעי הרשת
              </button>
            </div>
          )}
          <p className="text-xs text-stone-400 mb-3">{total.toLocaleString()} מבצעים{selectedCategory ? ' ב' + selectedCategory : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {deals.map((deal: any) => (
                <DealCard key={deal.promotionId} deal={deal} onClick={() => setSelectedDeal(deal)} />
              ))}
            </div>
            {deals.length < total && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchDeals(false)}
                  disabled={loadingMore}
                  className="bg-white border-2 border-stone-200 text-stone-600 font-bold px-8 py-3 rounded-2xl hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" /> : null}
                  {loadingMore ? 'טוען...' : 'טען עוד (' + (total - deals.length) + ')'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
