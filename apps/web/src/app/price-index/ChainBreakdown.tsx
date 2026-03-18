'use client';
import { useState } from 'react';
import Link from 'next/link';

const CHAIN_LOGOS: Record<string, string> = {
  "Shufersal": "/logos/shufersal.png", "Rami Levy": "/logos/rami-levy.png",
  "Osher Ad": "/logos/osher-ad.png", "Yochananof": "/logos/yochananof.png",
  "Carrefour": "/logos/Carrefour.png", "Hazi Hinam": "/logos/hazi-hinam.png",
  "Victory": "/logos/victory.png", "Tiv Taam": "/logos/tiv-taam.png",
  "Freshmarket": "/logos/freshmarket.png", "Mahsani Ashuk": "/logos/mahsani-ashuk.png",
  "Keshet Taamim": "/logos/keshet-taamim.png", "Bareket": "/logos/bareket.png",
  "Zol Vebegadol": "/logos/zol-vebegadol.png", "Super Yuda": "/logos/super-yuda.png",
  "Polizer": "/logos/polizer.png", "Salach Dabach": "/logos/salach-dabach.png",
  "Netiv Hased": "/logos/Netiv-Hased.png", "King Store": "/logos/king-store.png",
  "Dor Alon": "/logos/alunit.png", "Super Sapir": "/logos/Super-Sapir.png",
  "Good Pharm": "/logos/Good-Pharm.png", "Het Cohen": "/logos/Het-Cohen.png",
  "Maayan 2000": "/logos/maian2000.png", "Shefa Barcart Ashem": "/logos/Shefa-Barcart-Ashem.png",
  "Shuk Ahir": "/logos/shuk-haeir.png", "Stop Market": "/logos/stopmarket.png",
  "Wolt": "/logos/wolt.png", "City Market": "/logos/city-market.png",
};

const MEDALS = [
  {
    rank: "1",
    cartColor: "text-yellow-500",
    border: "ring-2 ring-yellow-400/80 shadow-md shadow-yellow-100",
    rowBg: "bg-gradient-to-l from-yellow-50/80 to-white",
    badge: "bg-yellow-400 text-white",
    label: "הזול ביותר",
    labelColor: "text-yellow-600 bg-yellow-50",
  },
  {
    rank: "2",
    cartColor: "text-slate-400",
    border: "ring-2 ring-slate-300/80 shadow-md shadow-slate-100",
    rowBg: "bg-gradient-to-l from-slate-50/80 to-white",
    badge: "bg-slate-400 text-white",
    label: "מקום שני",
    labelColor: "text-slate-500 bg-slate-50",
  },
  {
    rank: "3",
    cartColor: "text-amber-600",
    border: "ring-2 ring-amber-500/60 shadow-md shadow-amber-100",
    rowBg: "bg-gradient-to-l from-amber-50/60 to-white",
    badge: "bg-amber-600 text-white",
    label: "מקום שלישי",
    labelColor: "text-amber-700 bg-amber-50",
  },
];

function getRankLabel(index: number) {
  if (index <= 105) return { label: "זול מאוד", color: "bg-emerald-100 text-emerald-700" };
  if (index <= 115) return { label: "זול", color: "bg-emerald-50 text-emerald-600" };
  if (index <= 125) return { label: "ממוצע", color: "bg-amber-50 text-amber-600" };
  if (index <= 135) return { label: "יקר", color: "bg-orange-50 text-orange-600" };
  return { label: "יקר מאוד", color: "bg-red-50 text-red-600" };
}

interface Product { id?: number; product_id?: number; name: string; imageUrl?: string; }
interface Chain { chain: string; chainHe?: string; index: number; avgPrice: number; totalPrice: number; productCount: number; }

export default function ChainBreakdown({
  chains, products, chainPrices, basketSize
}: {
  chains: Chain[];
  products: Product[];
  chainPrices: Record<string, Record<string, number>>;
  basketSize: number;
}) {
  const [openChain, setOpenChain] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-50">
        <h2 className="font-bold text-stone-800 text-base">פירוט מחירים לפי רשת</h2>
        <p className="text-xs text-stone-400 mt-0.5">לחץ על רשת לראות מחיר כל מוצר · מוצר חסר = לא נמצא בסניפי הרשת</p>
      </div>
      <div className="divide-y divide-stone-50">
        {chains.map((c, i) => {
          const logo = CHAIN_LOGOS[c.chain];
          const { label, color } = getRankLabel(c.index);
          const isOpen = openChain === c.chain;
          const prods = chainPrices[c.chain] || {};
          const missingCount = products.filter(p => {
            const pid = p.id ?? (p as any).product_id;
            return !prods[pid] && !prods[String(pid)];
          }).length;

          const medal = i < 3 ? MEDALS[i] : null;

          return (
            <div key={c.chain} className={medal ? "relative" : ""}>
              <button
                onClick={() => setOpenChain(isOpen ? null : c.chain)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition text-right ${medal ? medal.rowBg : ""}`}
              >
                {/* Rank / Cart icon */}
                <div className="w-6 text-center flex-shrink-0">
                  {medal ? (
                    <span className={`text-xl leading-none ${medal.cartColor}`}>🛒</span>
                  ) : (
                    <span className="font-black text-stone-300 text-sm">{i + 1}</span>
                  )}
                </div>

                {/* Logo with badge */}
                <div className={`w-9 h-9 rounded-xl bg-stone-50 flex-shrink-0 overflow-hidden flex items-center justify-center border border-stone-100 relative ${medal ? medal.border : ""}`}>
                  {logo
                    ? <img src={logo} alt={c.chainHe || c.chain} className="w-full h-full object-contain p-1" />
                    : <span className="text-xs font-black text-stone-400">{(c.chainHe || c.chain).slice(0, 2)}</span>
                  }
                  {medal && (
                    <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center leading-none ${medal.badge}`}>
                      {medal.rank}
                    </span>
                  )}
                </div>

                {/* Chain name + tags */}
                <div className="flex-1 min-w-0 text-right">
                  <div className={`font-bold text-sm ${medal ? "text-stone-900" : "text-stone-800"}`}>
                    {c.chainHe || c.chain}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {medal && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${medal.labelColor}`}>
                        {medal.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>
                    {missingCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                        ⚠️ {missingCount} מוצרים חסרים
                      </span>
                    )}
                  </div>
                </div>

                {/* Price + index */}
                <div className="flex-shrink-0 text-left">
                  <div className={`font-mono font-black text-sm ${medal?.rank === "1" ? "text-yellow-600" : "text-stone-700"}`}>
                    ₪{c.totalPrice}
                  </div>
                  <div className="text-[10px] text-stone-400 text-center">מדד {c.index}</div>
                </div>

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  className={`text-stone-300 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {isOpen && (
                <div className="bg-stone-50/50 border-t border-stone-100">
                  <div className="divide-y divide-stone-100">
                    {products.map((p) => {
                      const pid = p.id ?? (p as any).product_id;
                      const price = prods[pid] ?? prods[String(pid)];
                      const missing = !price;
                      return (
                        <Link key={pid} href={`/product/${pid}`}
                          className={`flex items-center gap-3 px-5 py-3 hover:bg-white transition ${missing ? "opacity-60" : ""}`}>
                          <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-stone-100 flex-shrink-0">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1" />
                              : <span className="text-lg">📦</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-stone-700 truncate">{p.name}</div>
                          </div>
                          <div className="flex-shrink-0">
                            {missing ? (
                              <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">
                                לא נמצא
                              </span>
                            ) : (
                              <span className="font-mono font-black text-emerald-600 text-sm">₪{price}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">{products.length - missingCount}/{products.length} מוצרים נמצאו</span>
                    <span className="font-mono font-black text-emerald-600">סה״כ: ₪{c.totalPrice}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
