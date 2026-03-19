import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

async function getBestDeals(name: string) {
  try {
    const res = await fetch(`${API}/chain/${encodeURIComponent(name)}/best-deals`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).products || [];
  } catch { return []; }
}

async function getChain(name: string) {
  try {
    const res = await fetch(`${API}/chain/${encodeURIComponent(name)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const data = await getChain(decodeURIComponent(params.name));
  if (!data) return { title: "רשת לא נמצאה | Savy" };
  const { chain } = data;
  const nameHe = chain.nameHe || chain.name;
  return {
    title: `${nameHe} | סניפים, מבצעים ומחירים | Savy`,
    description: `כל סניפי ${nameHe} בישראל — ${chain.storeCount} סניפים. מבצעים חמים, מחירים עדכניים והשוואה לרשתות אחרות. מתעדכן יומית.`,
    alternates: { canonical: `https://savy.co.il/chain/${encodeURIComponent(chain.name)}` },
    openGraph: {
      title: `${nameHe} | סניפים ומבצעים | Savy`,
      description: `${chain.storeCount} סניפים, מבצעים חמים ומחירים עדכניים של ${nameHe}`,
      url: `https://savy.co.il/chain/${encodeURIComponent(chain.name)}`,
      siteName: "Savy", locale: "he_IL", type: "website",
    },
  };
}

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
};

const INDEX_CONFIG = (idx: number) => idx <= 105
  ? { bg: "bg-emerald-100", text: "text-emerald-700", label: "זול מאוד" }
  : idx <= 115 ? { bg: "bg-emerald-50", text: "text-emerald-600", label: "זול" }
  : idx <= 125 ? { bg: "bg-amber-50", text: "text-amber-600", label: "ממוצע" }
  : idx <= 135 ? { bg: "bg-orange-50", text: "text-orange-600", label: "יקר" }
  : { bg: "bg-red-50", text: "text-red-600", label: "יקר מאוד" };

export default async function ChainPage({ params }: { params: { name: string } }) {
  const [data, bestDeals] = await Promise.all([
    getChain(decodeURIComponent(params.name)),
    getBestDeals(decodeURIComponent(params.name))
  ]);
  if (!data) notFound();

  const { chain, stores, hotDeals } = data;
  const nameHe = chain.nameHe || chain.name;
  const logo = CHAIN_LOGOS[chain.name];
  const idxConfig = chain.priceIndex ? INDEX_CONFIG(chain.priceIndex) : null;

  const byCity: Record<string, any[]> = {};
  for (const s of stores) {
    const city = s.city || "אחר";
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(s);
  }
  const cities = Object.keys(byCity).sort();

  const uniqueDeals = hotDeals.filter((d: any, i: number, arr: any[]) =>
    arr.findIndex((x: any) => x.description === d.description) === i
  ).slice(0, 12);

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "GroceryStore",
        "name": nameHe, "url": `https://savy.co.il/chain/${encodeURIComponent(chain.name)}`,
      }) }} />

      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex-shrink-0">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-300">›</span>
          <div className="flex items-center gap-2 min-w-0">
            {logo && <img src={logo} alt={nameHe} className="h-5 object-contain" />}
            <span className="text-stone-700 text-sm font-bold truncate">{nameHe}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logo
                  ? <img src={logo} alt={nameHe} className="w-full h-full object-contain p-2" />
                  : <span className="text-3xl font-black text-stone-300">{nameHe.slice(0, 2)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-2xl text-stone-800 leading-tight">{nameHe}</h1>
                <p className="sr-only">
                  {nameHe} — {chain.storeCount} סניפים בישראל. השווה מחירים ב{nameHe} מול שופרסל, רמי לוי, ויקטורי ועוד 25 רשתות.
                  מבצעים עדכניים, מחירים יומיים, וניווט לסניף הקרוב אליך.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm text-stone-500 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2"/></svg>
                    {chain.storeCount} סניפים
                  </span>
                  {idxConfig && (
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${idxConfig.bg} ${idxConfig.text}`}>
                      מדד {chain.priceIndex} · {idxConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
            <Link href="/"
              className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              השווה מחירים
            </Link>
            <Link href="/price-index"
              className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              מדד מחירים
            </Link>
          </div>
        </div>

        {/* Best Deals */}
        {bestDeals.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-stone-800 text-base flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/></svg>
                    </span>
                    הכי זול ב{nameHe}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">מוצרים זולים משמעותית ביחס לממוצע השוק</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4">
              {bestDeals.slice(0, 12).map((p: any, i: number) => (
                <Link key={p.id} href={`/product/${p.id}`}
                  className={`flex flex-col items-center gap-2 p-3 hover:bg-emerald-50/50 transition active:scale-95 ${i < bestDeals.slice(0,12).length - 1 ? "border-b border-stone-50" : ""}`}
                  style={{ borderRight: i % 3 !== 0 ? "1px solid #f5f5f4" : "none" }}>
                  <div className="relative">
                    <div className="w-[72px] h-[72px] bg-stone-50 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-100">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1.5" loading="lazy" />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" fill="#e7e5e4"/><path d="M9 9h6M9 12h6M9 15h4" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>
                    <div className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      -{p.savingPct}%
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <div className="text-[11px] font-medium text-stone-700 leading-tight line-clamp-2 mb-1">{p.name}</div>
                    <div className="font-black text-emerald-600 text-sm">₪{p.chainPrice}</div>
                    <div className="text-[10px] text-stone-400 line-through">₪{p.marketAvg}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Hot Deals */}
        {uniqueDeals.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-stone-800 text-base flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs">🔥</span>
                  מבצעים חמים
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">מוצרים יקרים במחיר מיוחד</p>
              </div>
              <Link href={`/deals?chain=${chain.name}`} className="text-xs text-emerald-600 font-bold hover:underline">
                כל המבצעים ←
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {uniqueDeals.map((deal: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-stone-100">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="7" cy="7" r="1.5" fill="#a8a29e"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 text-sm truncate">{deal.productName || deal.description}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{deal.storeName}{deal.city ? ` · ${deal.city}` : ""}</div>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <div className="font-mono font-black text-emerald-600">₪{Number(deal.discountedPrice).toFixed(2)}</div>
                    {deal.discountRate && (
                      <div className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full text-center mt-0.5">-{deal.discountRate}%</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stores */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-base flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </span>
              סניפים · {chain.storeCount}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">לחץ לניווט בוויז</p>
          </div>
          <div>
            {cities.map((city, ci) => (
              <div key={city}>
                <div className="px-5 py-2 bg-stone-50/80 border-y border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">{city}</span>
                  <span className="text-xs text-stone-400">{byCity[city].length} סניפים</span>
                </div>
                {byCity[city].map((store: any, si: number) => (
                  <a key={store.id}
                    href={`https://waze.com/ul?ll=${store.lat},${store.lng}&navigate=yes&zoom=17`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50/30 transition border-b border-stone-50 last:border-0 group">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-700 text-sm group-hover:text-blue-600 transition">{store.name}</div>
                      {store.address && <div className="text-xs text-stone-400 mt-0.5">{store.address}</div>}
                      {store.subchainName && (
                        <span className="inline-block text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-1">{store.subchainName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-3 py-1.5 rounded-xl flex-shrink-0 group-hover:bg-blue-100 transition">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      <span className="text-xs font-bold">נווט</span>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-black text-white text-lg leading-tight">רוצה לחסוך ב{nameHe}?</div>
              <div className="text-white/80 text-sm mt-1">בנה רשימת קניות ומצא את הסניף הזול ביותר</div>
            </div>
            <Link href="/"
              className="flex-shrink-0 bg-white text-emerald-600 font-black text-sm rounded-xl px-4 py-3 hover:bg-emerald-50 transition whitespace-nowrap">
              התחל עכשיו
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
