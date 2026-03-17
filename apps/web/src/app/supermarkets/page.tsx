import type { Metadata } from "next";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export const metadata: Metadata = {
  title: "רשתות סופרמרקט בישראל | כל הרשתות | Savy",
  description: "כל רשתות הסופרמרקט בישראל במקום אחד — שופרסל, רמי לוי, אושר עד, קרפור ועוד 25 רשתות. סניפים, מבצעים ומחירים עדכניים.",
  alternates: { canonical: "https://savy.co.il/supermarkets" },
  openGraph: {
    title: "רשתות סופרמרקט בישראל | Savy",
    description: "כל רשתות הסופרמרקט בישראל — סניפים, מבצעים ומחירים עדכניים",
    url: "https://savy.co.il/supermarkets",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

const CHAIN_LOGOS: Record<string, string> = {
  "Shufersal": "/logos/shufersal.png",
  "Rami Levy": "/logos/rami-levy.png",
  "Osher Ad": "/logos/osher-ad.png",
  "Yochananof": "/logos/yochananof.png",
  "Carrefour": "/logos/Carrefour.png",
  "Hazi Hinam": "/logos/hazi-hinam.png",
  "Victory": "/logos/victory.png",
  "Tiv Taam": "/logos/tiv-taam.png",
  "Freshmarket": "/logos/freshmarket.png",
  "Mahsani Ashuk": "/logos/mahsani-ashuk.png",
  "Keshet Taamim": "/logos/keshet-taamim.png",
  "Bareket": "/logos/bareket.png",
  "Zol Vebegadol": "/logos/zol-vebegadol.png",
  "Super Yuda": "/logos/super-yuda.png",
  "Polizer": "/logos/polizer.png",
  "Salach Dabach": "/logos/salach-dabach.png",
  "Netiv Hased": "/logos/Netiv-Hased.png",
  "King Store": "/logos/king-store.png",
  "Dor Alon": "/logos/alunit.png",
  "Super Sapir": "/logos/Super-Sapir.png",
  "Good Pharm": "/logos/Good-Pharm.png",
  "Het Cohen": "/logos/Het-Cohen.png",
  "Maayan 2000": "/logos/maian2000.png",
  "Shefa Barcart Ashem": "/logos/Shefa-Barcart-Ashem.png",
  "Shuk Ahir": "/logos/shuk-haeir.png",
  "Stop Market": "/logos/stopmarket.png",
  "Wolt": "/logos/wolt.png",
  "City Market": "/logos/city-market.png",
};

async function getChains() {
  try {
    const res = await fetch(`${API}/chains`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.chains.filter((c: any) => c.storeCount > 0);
  } catch { return []; }
}

async function getPriceIndex() {
  try {
    const res = await fetch(`${API}/price-index`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const INDEX_CONFIG = (idx: number) => idx <= 105
  ? { bg: "bg-emerald-100", text: "text-emerald-700", label: "זול מאוד" }
  : idx <= 115 ? { bg: "bg-emerald-50", text: "text-emerald-600", label: "זול" }
  : idx <= 125 ? { bg: "bg-amber-50", text: "text-amber-600", label: "ממוצע" }
  : idx <= 135 ? { bg: "bg-orange-50", text: "text-orange-600", label: "יקר" }
  : { bg: "bg-red-50", text: "text-red-600", label: "יקר מאוד" };

export default async function SupermarketsPage() {
  const [chains, indexData] = await Promise.all([getChains(), getPriceIndex()]);

  const indexMap: Record<string, number> = {};
  if (indexData?.chains) {
    for (const c of indexData.chains) {
      indexMap[c.chain] = c.index;
    }
  }

  const sorted = [...chains].sort((a: any, b: any) => {
    const ai = indexMap[a.name] || 999;
    const bi = indexMap[b.name] || 999;
    return ai - bi;
  });

  const totalStores = chains.reduce((sum: number, c: any) => sum + c.storeCount, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "רשתות סופרמרקט בישראל",
    "description": "כל רשתות הסופרמרקט בישראל",
    "url": "https://savy.co.il/supermarkets",
    "numberOfItems": chains.length,
    "itemListElement": chains.map((c: any, i: number) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.nameHe || c.name,
      "url": `https://savy.co.il/chain/${encodeURIComponent(c.name)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/"><img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" /></Link>
          <span className="text-stone-300">›</span>
          <span className="text-stone-700 text-sm font-bold">רשתות סופרמרקט</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Hero */}
        <div>
          <h1 className="font-black text-3xl text-stone-800 leading-tight mb-2">
            רשתות סופרמרקט בישראל
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            {chains.length} רשתות · {totalStores.toLocaleString()} סניפים ברחבי הארץ.
            מדורגות לפי מדד המחירים של Savy — מהזולה ביותר לויקרה.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
            <div className="font-black text-2xl text-emerald-600">{chains.length}</div>
            <div className="text-xs text-stone-400 mt-1">רשתות</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
            <div className="font-black text-2xl text-stone-800">{totalStores.toLocaleString()}</div>
            <div className="text-xs text-stone-400 mt-1">סניפים</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
            <div className="font-black text-2xl text-stone-800">8.6M</div>
            <div className="text-xs text-stone-400 mt-1">מחירים</div>
          </div>
        </div>

        {/* Chains grid */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-base">כל הרשתות — מהזול לייקר</h2>
            <p className="text-xs text-stone-400 mt-0.5">מדורג לפי מדד מחירי Savy · {indexData?.computedAt ? new Date(indexData.computedAt).toLocaleDateString("he-IL") : ""}</p>
          </div>
          <div className="divide-y divide-stone-50">
            {sorted.map((c: any, i: number) => {
              const logo = CHAIN_LOGOS[c.name];
              const idx = indexMap[c.name];
              const cfg = idx ? INDEX_CONFIG(idx) : null;
              return (
                <Link key={c.name} href={`/chain/${encodeURIComponent(c.name)}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition active:scale-[0.99] group">
                  <div className="w-6 text-center font-black text-stone-300 text-sm flex-shrink-0">{i + 1}</div>
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logo
                      ? <img src={logo} alt={c.nameHe || c.name} className="w-full h-full object-contain p-1.5" />
                      : <span className="text-sm font-black text-stone-400">{(c.nameHe || c.name).slice(0, 2)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 group-hover:text-emerald-600 transition">{c.nameHe || c.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{c.storeCount} סניפים</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cfg && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {idx}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-stone-300 group-hover:text-emerald-500 transition">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-black text-white text-lg leading-tight">רוצה לדעת איפה הכי זול?</div>
              <div className="text-white/80 text-sm mt-1">בנה רשימת קניות והשווה בין כל הרשתות</div>
            </div>
            <Link href="/" className="flex-shrink-0 bg-white text-emerald-600 font-black text-sm rounded-xl px-4 py-3 hover:bg-emerald-50 transition whitespace-nowrap">
              התחל עכשיו
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
