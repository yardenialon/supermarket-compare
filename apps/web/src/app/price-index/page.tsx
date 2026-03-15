import type { Metadata } from "next";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export const metadata: Metadata = {
  title: "מדד מחירי סופרמרקט ישראל 2026 | השוואת רשתות | Savy",
  description: "מדד מחירים עדכני של כל רשתות הסופרמרקט בישראל. השוואת מחירים בין שופרסל, רמי לוי, אושר עד, קרפור ועוד 25 רשתות — מבוסס על נתוני שקיפות מחירים ממשלתיים.",
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

async function getBasketProducts() {
  try {
    const res = await fetch(`${API}/savy-basket`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch { return []; }
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
  "Bareket": "/logos/bareket.png",
  "Zol Vebegadol": "/logos/zol-vebegadol.png",
  "Super Yuda": "/logos/super-yuda.png",
  "Polizer": "/logos/polizer.png",
  "Salach Dabach": "/logos/salach-dabach.png",
};

function getRankColor(index: number): string {
  if (index <= 105) return "bg-emerald-500";
  if (index <= 115) return "bg-emerald-400";
  if (index <= 125) return "bg-amber-400";
  if (index <= 135) return "bg-orange-400";
  return "bg-red-400";
}

function getRankLabel(index: number): { label: string; color: string } {
  if (index <= 105) return { label: "זול מאוד", color: "bg-emerald-100 text-emerald-700" };
  if (index <= 115) return { label: "זול", color: "bg-emerald-50 text-emerald-600" };
  if (index <= 125) return { label: "ממוצע", color: "bg-amber-50 text-amber-600" };
  if (index <= 135) return { label: "יקר", color: "bg-orange-50 text-orange-600" };
  return { label: "יקר מאוד", color: "bg-red-50 text-red-600" };
}

export default async function PriceIndexPage() {
  const [data, basketProducts] = await Promise.all([getPriceIndex(), getBasketProducts()]);
  const chains = data?.chains || [];
  const computedAt = data?.computedAt
    ? new Date(data.computedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const cheapest = chains[0];
  const mostExpensive = chains[chains.length - 1];
  const priceDiff = cheapest && mostExpensive ? Math.round(mostExpensive.index - cheapest.index) : 0;
  const totalSaving = cheapest && mostExpensive
    ? (Number(mostExpensive.totalPrice) - Number(cheapest.totalPrice)).toFixed(2)
    : "0";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "מדד מחירי סופרמרקט ישראל",
    "description": "השוואת מחירים בין רשתות הסופרמרקט בישראל",
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
          <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
            מתעדכן יומית · נתוני שקיפות מחירים ממשלתיים
          </div>
          <h1 className="font-black text-3xl text-stone-800 leading-tight mb-2">
            מדד מחירי סופרמרקט ישראל
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            השוואת מחירים בין {chains.length} רשתות סופרמרקט בישראל על בסיס סל של {basketProducts.length || data?.productCount || 0} מוצרי יסוד נבחרים.
            {computedAt && ` עודכן: ${computedAt}.`}
          </p>
        </div>

        {/* Stats */}
        {cheapest && mostExpensive && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
              <div className="text-xs text-emerald-600 font-medium mb-1">הזולה ביותר</div>
              <div className="font-black text-emerald-700 text-base leading-tight">{cheapest.chainHe || cheapest.chain}</div>
              <div className="text-xs text-emerald-600 mt-1">סל: ₪{cheapest.totalPrice}</div>
            </div>
            <div className="bg-stone-100 rounded-2xl p-4 text-center">
              <div className="text-xs text-stone-500 font-medium mb-1">חיסכון מקסימלי</div>
              <div className="font-black text-stone-700 text-base">₪{totalSaving}</div>
              <div className="text-xs text-stone-500 mt-1">{priceDiff}% הפרש</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
              <div className="text-xs text-red-500 font-medium mb-1">היקרה ביותר</div>
              <div className="font-black text-red-600 text-base leading-tight">{mostExpensive.chainHe || mostExpensive.chain}</div>
              <div className="text-xs text-red-500 mt-1">סל: ₪{mostExpensive.totalPrice}</div>
            </div>
          </div>
        )}

        {/* Main table */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-base">דירוג רשתות לפי מחיר הסל</h2>
            <p className="text-xs text-stone-400 mt-0.5">מחיר הסל = סכום המחיר הזול ביותר של כל מוצר באותה רשת. ללא סניפי אילת וסניפי אינטרנט.</p>
          </div>
          <div className="divide-y divide-stone-50">
            {chains.map((c: any, i: number) => {
              const logo = CHAIN_LOGOS[c.chain];
              const barWidth = Math.min(100, Math.max(5, (c.index - 95) * 2.5));
              const { label, color } = getRankLabel(c.index);
              return (
                <div key={c.chain} className={`flex items-center gap-3 px-5 py-3.5 transition ${i === 0 ? "bg-emerald-50/50" : "hover:bg-stone-50"}`}>
                  <div className={`w-6 text-center font-black text-sm ${i === 0 ? "text-emerald-500" : i <= 2 ? "text-stone-500" : "text-stone-300"}`}>{i + 1}</div>
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex-shrink-0 overflow-hidden flex items-center justify-center border border-stone-100">
                    {logo
                      ? <img src={logo} alt={c.chainHe || c.chain} className="w-full h-full object-contain p-1" />
                      : <span className="text-xs font-black text-stone-400">{(c.chainHe || c.chain).slice(0, 2)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm">{c.chainHe || c.chain}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getRankColor(c.index)}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <div className="font-mono font-black text-stone-700 text-sm">₪{c.totalPrice}</div>
                    <div className="text-[10px] text-stone-400 text-center mt-0.5">מדד {c.index}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Basket products */}
        {basketProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <h2 className="font-bold text-stone-800 text-base">סל הקניות של המדד</h2>
              <p className="text-xs text-stone-400 mt-0.5">{basketProducts.length} מוצרי יסוד שנבחרו ידנית על ידי צוות Savy כדי לייצג קנייה טיפוסית.</p>
            </div>
            <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-stone-50" style={{direction: "rtl"}}>
              {basketProducts.map((p: any) => (
                <Link key={p.productId} href={`/product/${p.productId}`}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-stone-50 transition">
                  <div className="w-20 h-20 bg-stone-50 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-100">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-2" />
                      : <span className="text-3xl">📦</span>}
                  </div>
                  <div className="text-xs font-medium text-stone-700 text-center leading-tight line-clamp-2">{p.name}</div>
                  {p.minPrice && (
                    <div className="text-xs font-black text-emerald-600">מ-₪{Number(p.minPrice).toFixed(2)}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Methodology */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 mb-3 text-base">איך מחשבים את המדד?</h2>
          <div className="text-sm text-stone-500 leading-relaxed space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <p><strong className="text-stone-700">בחירת סל מוצרים:</strong> צוות Savy בחר {basketProducts.length || data?.productCount || 0} מוצרי יסוד מוכרים שנמכרים בכל הרשתות הגדולות.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <p><strong className="text-stone-700">איסוף מחירים:</strong> לכל מוצר נלקח המחיר הזול ביותר מכלל סניפי הרשת. סניפי אילת וסניפי אינטרנט הוצאו מהחישוב כדי לשקף מחיר קנייה פיזית ממוצעת.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <p><strong className="text-stone-700">חישוב המדד:</strong> הרשת עם סל הקניות הזול ביותר מקבלת מדד 100. שאר הרשתות מדורגות ביחס אליה — מדד 130 אומר שהרשת יקרה ב-30%.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
              <p><strong className="text-stone-700">עדכון יומי:</strong> הנתונים נלקחים ממאגר שקיפות המחירים הממשלתי ומתעדכנים מדי יום. Savy אוסף נתונים מ-29 רשתות ומעל 8.6 מיליון מחירים.</p>
            </div>
            <p className="text-xs text-stone-400 border-t border-stone-100 pt-3">
              ⚠️ חשוב: המדד מייצג ממוצע כללי. מחיר מוצר ספציפי עשוי להיות זול יותר ברשת אחרת בסניף מסוים. לבדיקה מדויקת — בנה רשימת קניות ב-Savy.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-emerald-500 rounded-2xl p-5 text-center">
          <div className="font-black text-white text-lg mb-1">רוצה לדעת כמה תחסוך?</div>
          <div className="text-white/80 text-sm mb-4">בנה רשימת קניות אישית והשווה את המחיר המדויק עבורך</div>
          <Link href="/" className="inline-block bg-white text-emerald-600 font-black text-sm rounded-xl px-6 py-3 hover:bg-emerald-50 transition">
            התחל להשוות עכשיו
          </Link>
        </div>

      </div>
    </div>
  );
}
