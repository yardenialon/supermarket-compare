import type { Metadata } from "next";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export const metadata: Metadata = {
  title: "מדד מחירי סופרמרקט ישראל | השוואת רשתות | Savy",
  description: "מדד מחירים עדכני של כל רשתות הסופרמרקט בישראל. השוואת מחירים בין שופרסל, רמי לוי, אושר עד, קרפור ועוד 25 רשתות — מבוסס על 8.6 מיליון מחירים.",
  alternates: { canonical: "https://savy.co.il/price-index" },
  openGraph: {
    title: "מדד מחירי סופרמרקט ישראל 2026",
    description: "איזו רשת סופרמרקט הכי זולה בישראל? מדד מחירים מבוסס נתונים אמיתיים — מתעדכן יומית.",
    url: "https://savy.co.il/price-index",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

async function getPriceIndex() {
  try {
    const res = await fetch(`${API}/price-index`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
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
  "Yayno Bitan": "/logos/yayno-bitan.png",
  "Keshet Taamim": "/logos/keshet-taamim.png",
};

function getRankColor(index: number): string {
  if (index <= 105) return "bg-emerald-500";
  if (index <= 112) return "bg-emerald-400";
  if (index <= 118) return "bg-amber-400";
  if (index <= 125) return "bg-orange-400";
  return "bg-red-400";
}

function getRankLabel(index: number): string {
  if (index <= 105) return "זול מאוד";
  if (index <= 112) return "זול";
  if (index <= 118) return "ממוצע";
  if (index <= 125) return "יקר";
  return "יקר מאוד";
}

export default async function PriceIndexPage() {
  const data = await getPriceIndex();
  const chains = data?.chains || [];
  const computedAt = data?.computedAt ? new Date(data.computedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }) : "";
  const cheapest = chains[0];
  const mostExpensive = chains[chains.length - 1];
  const priceDiff = cheapest && mostExpensive ? Math.round((mostExpensive.index - cheapest.index)) : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "מדד מחירי סופרמרקט ישראל",
    "description": "השוואת מחירים בין רשתות הסופרמרקט בישראל מבוססת על 8.6 מיליון מחירים",
    "url": "https://savy.co.il/price-index",
    "creator": { "@type": "Organization", "name": "Savy", "url": "https://savy.co.il" },
    "dateModified": data?.computedAt || new Date().toISOString(),
    "license": "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700 text-sm font-semibold flex items-center gap-1.5">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">מדד מחירים</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Hero */}
        <div>
          <h1 className="font-black text-3xl text-stone-800 leading-tight mb-2">
            מדד מחירי סופרמרקט ישראל
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            השוואת מחירים בין {chains.length} רשתות סופרמרקט בישראל, מבוססת על {data?.productCount || 30} המוצרים הנמכרים ביותר ו-8.6 מיליון מחירים עדכניים.
            {computedAt && ` עודכן לאחרונה: ${computedAt}.`}
          </p>
        </div>

        {/* Stats */}
        {cheapest && mostExpensive && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <div className="text-xs text-emerald-600 font-medium mb-1">הזולה ביותר</div>
              <div className="font-black text-emerald-700 text-lg">{cheapest.chainHe || cheapest.chain}</div>
              <div className="text-xs text-emerald-600 mt-0.5">₪{cheapest.avgPrice} ממוצע</div>
            </div>
            <div className="bg-stone-100 rounded-2xl p-4 text-center">
              <div className="text-xs text-stone-500 font-medium mb-1">פער מחירים</div>
              <div className="font-black text-stone-700 text-lg">{priceDiff}%</div>
              <div className="text-xs text-stone-500 mt-0.5">בין זול ליקר</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <div className="text-xs text-red-500 font-medium mb-1">היקרה ביותר</div>
              <div className="font-black text-red-600 text-lg">{mostExpensive.chainHe || mostExpensive.chain}</div>
              <div className="text-xs text-red-500 mt-0.5">₪{mostExpensive.avgPrice} ממוצע</div>
            </div>
          </div>
        )}

        {/* Main table */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-base">דירוג רשתות לפי מחיר</h2>
            <p className="text-xs text-stone-400 mt-0.5">אינדקס 100 = הזול ביותר. ככל שהמספר גבוה יותר — כך המחיר יקר יותר.</p>
          </div>
          <div className="divide-y divide-stone-50">
            {chains.map((c: any, i: number) => {
              const logo = CHAIN_LOGOS[c.chain];
              const barWidth = Math.min(100, Math.max(10, (c.index - 95) * 3));
              return (
                <div key={c.chain} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition">
                  <div className="w-6 text-center font-black text-stone-300 text-sm">{i + 1}</div>
                  <div className="w-9 h-9 rounded-xl bg-stone-50 flex-shrink-0 overflow-hidden flex items-center justify-center border border-stone-100">
                    {logo ? (
                      <img src={logo} alt={c.chainHe || c.chain} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xs font-black text-stone-400">{(c.chainHe || c.chain).slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm">{c.chainHe || c.chain}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getRankColor(c.index)}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        c.index <= 105 ? "bg-emerald-100 text-emerald-700" :
                        c.index <= 112 ? "bg-emerald-50 text-emerald-600" :
                        c.index <= 118 ? "bg-amber-50 text-amber-600" :
                        c.index <= 125 ? "bg-orange-50 text-orange-600" :
                        "bg-red-50 text-red-600"
                      }`}>{getRankLabel(c.index)}</span>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="font-mono font-black text-stone-700 text-sm">₪{c.avgPrice}</div>
                    <div className="text-[10px] text-stone-400 text-center">אינדקס {c.index}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 mb-3 text-base">מתודולוגיה</h2>
          <div className="text-sm text-stone-500 leading-relaxed space-y-2">
            <p>המדד מחושב על בסיס {data?.productCount || 30} המוצרים הנמכרים ביותר בישראל — מוצרים שנמכרים ב-200+ חנויות ברחבי הארץ.</p>
            <p>לכל רשת מחושב ממוצע המחיר של אותם המוצרים. הרשת עם הממוצע הנמוך ביותר מקבלת אינדקס 100, וכל שאר הרשתות מדורגות ביחס אליה.</p>
            <p>הנתונים נלקחים ישירות ממאגר שקיפות המחירים הממשלתי ומתעדכנים יומית. Savy אוסף נתונים מ-29 רשתות סופרמרקט ומעל 8.6 מיליון מחירים.</p>
            <p className="font-medium text-stone-600">חשוב לדעת: המדד מייצג ממוצע כללי. מחיר מוצר ספציפי עשוי להיות זול יותר ברשת אחרת.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500 rounded-2xl p-5 text-center">
          <div className="font-black text-white text-lg mb-1">רוצה לדעת כמה תחסוך?</div>
          <div className="text-white/80 text-sm mb-4">בנה רשימת קניות והשווה את המחיר המדויק עבורך</div>
          <Link href="/" className="inline-block bg-white text-emerald-600 font-black text-sm rounded-xl px-6 py-3 hover:bg-emerald-50 transition">
            התחל להשוות עכשיו
          </Link>
        </div>

      </div>
    </div>
  );
}
