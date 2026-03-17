import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

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
  "Yochananof": "/logos/yochananof.png",
  "Keshet Taamim": "/logos/keshet-taamim.png",
  "Bareket": "/logos/bareket.png",
  "Zol Vebegadol": "/logos/zol-vebegadol.png",
  "Super Yuda": "/logos/super-yuda.png",
  "Polizer": "/logos/polizer.png",
  "Salach Dabach": "/logos/salach-dabach.png",
  "Netiv Hased": "/logos/Netiv-Hased.png",
  "Mahsani Ashuk": "/logos/mahsani-ashuk.png",
};

export default async function ChainPage({ params }: { params: { name: string } }) {
  const data = await getChain(decodeURIComponent(params.name));
  if (!data) notFound();

  const { chain, stores, hotDeals } = data;
  const nameHe = chain.nameHe || chain.name;
  const logo = CHAIN_LOGOS[chain.name];

  // קבץ סניפים לפי עיר
  const byCity: Record<string, any[]> = {};
  for (const s of stores) {
    const city = s.city || "אחר";
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(s);
  }
  const cities = Object.keys(byCity).sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": nameHe,
    "url": `https://savy.co.il/chain/${encodeURIComponent(chain.name)}`,
    "numberOfEmployees": { "@type": "QuantitativeValue", "value": chain.storeCount },
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700 text-sm font-semibold">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">{nameHe}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logo
                ? <img src={logo} alt={nameHe} className="w-full h-full object-contain p-2" />
                : <span className="text-3xl font-black text-stone-400">{nameHe.slice(0, 2)}</span>}
            </div>
            <div className="flex-1">
              <h1 className="font-black text-2xl text-stone-800">{nameHe}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-stone-500">
                  <span>🏪</span>
                  <span>{chain.storeCount} סניפים</span>
                </div>
                {chain.priceIndex && (
                  <div className={`flex items-center gap-1.5 text-sm font-bold px-2.5 py-0.5 rounded-full ${
                    chain.priceIndex <= 105 ? "bg-emerald-100 text-emerald-700" :
                    chain.priceIndex <= 115 ? "bg-emerald-50 text-emerald-600" :
                    chain.priceIndex <= 125 ? "bg-amber-50 text-amber-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    מדד מחירים: {chain.priceIndex}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href={`/?chain=${chain.name}`}
              className="flex-1 bg-emerald-500 text-white text-sm font-bold rounded-xl py-2.5 text-center hover:bg-emerald-600 transition">
              🔍 השווה מחירים
            </Link>
            <Link href="/price-index"
              className="flex-1 bg-stone-100 text-stone-600 text-sm font-bold rounded-xl py-2.5 text-center hover:bg-stone-200 transition">
              📊 מדד מחירים
            </Link>
          </div>
        </div>

        {/* מבצעים חמים */}
        {hotDeals.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-stone-800 text-base">🔥 מבצעים חמים</h2>
                <p className="text-xs text-stone-400 mt-0.5">מוצרים יקרים במחיר מיוחד</p>
              </div>
              <Link href={`/deals?chain=${chain.name}`}
                className="text-xs text-emerald-600 hover:underline font-medium">
                כל המבצעים ←
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {hotDeals.slice(0, 10).map((deal: any, i: number) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 text-sm truncate">{deal.productName || deal.description}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{deal.storeName} · {deal.city}</div>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <div className="font-mono font-black text-emerald-600 text-base">₪{Number(deal.discountedPrice).toFixed(2)}</div>
                    {deal.discountRate && (
                      <div className="text-[10px] text-red-500 font-bold text-center">-{deal.discountRate}%</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* סניפים לפי עיר */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-base">📍 סניפים ({chain.storeCount})</h2>
            <p className="text-xs text-stone-400 mt-0.5">לחץ על סניף לניווט בוויז</p>
          </div>
          <div className="divide-y divide-stone-50">
            {cities.map(city => (
              <div key={city}>
                <div className="px-5 py-2 bg-stone-50">
                  <span className="text-xs font-bold text-stone-500">{city} ({byCity[city].length})</span>
                </div>
                {byCity[city].map((store: any) => (
                  <a key={store.id}
                    href={`https://waze.com/ul?ll=${store.lat},${store.lng}&navigate=yes&zoom=17`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition border-b border-stone-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-700 text-sm">{store.name}</div>
                      {store.address && <div className="text-xs text-stone-400 mt-0.5">{store.address}</div>}
                      {store.subchainName && <div className="text-[10px] text-emerald-600 mt-0.5">{store.subchainName}</div>}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5 text-blue-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                      </svg>
                      <span className="text-xs font-medium">נווט</span>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500 rounded-2xl p-5 text-center">
          <div className="font-black text-white text-lg mb-1">השווה מחירים ב{nameHe}</div>
          <div className="text-white/80 text-sm mb-4">בנה רשימת קניות ומצא את הסניף הזול ביותר</div>
          <Link href="/" className="inline-block bg-white text-emerald-600 font-black text-sm rounded-xl px-6 py-3 hover:bg-emerald-50 transition">
            התחל עכשיו
          </Link>
        </div>

      </div>
    </div>
  );
}
