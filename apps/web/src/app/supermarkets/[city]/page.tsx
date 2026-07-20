import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cityBySlug, CITIES } from "@/lib/cities";
import { chainByName } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

interface CityData {
  city: string;
  storeCount: number;
  chains: { chain: string; chainHe: string | null; storeCount: number }[];
  basketChains: { chain: string; chainHe: string | null; productCount: number; avgPrice: number; index: number }[];
}

async function getCity(he: string): Promise<CityData | null> {
  try {
    const res = await fetch(`${API}/city/${encodeURIComponent(he)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const heName = (c: { chain: string; chainHe: string | null }) => c.chainHe || chainByName(c.chain)?.he || c.chain;

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const city = cityBySlug(params.city);
  if (!city) return { title: "סופרמרקטים | Savy" };
  const data = await getCity(city.he);
  const cheapest = data?.basketChains?.[0];
  const title = `סופרמרקט זול ב${city.he} — השוואת מחירים ${data ? `בין ${data.chains.length} רשתות ` : ""}| Savy`;
  const description = cheapest
    ? `איפה הכי זול לקנות ב${city.he}? ${heName(cheapest)} מובילה במדד סל היסוד בעיר. השוואת מחירים בין ${data!.chains.length} רשתות ו-${data!.storeCount} סניפים — עדכון יומי.`
    : `כל הסופרמרקטים ב${city.he}: רשתות, סניפים והשוואת מחירים על סל מוצרי יסוד. עדכון יומי מנתוני שקיפות המחירים.`;
  return {
    title, description,
    alternates: { canonical: `https://savy.co.il/supermarkets/${params.city}` },
    openGraph: { title, description, url: `https://savy.co.il/supermarkets/${params.city}`, siteName: "Savy", locale: "he_IL", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const city = cityBySlug(params.city);
  if (!city) notFound();
  const data = await getCity(city.he);
  if (!data || !data.chains.length) notFound();

  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const cheapest = data.basketChains[0];
  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 12);

  const faq = cheapest && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `איזה סופרמרקט הכי זול ב${city.he}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `לפי מדד סל היסוד של Savy, ${heName(cheapest)} היא הרשת הזולה ביותר ב${city.he} (ממוצע ₪${cheapest.avgPrice.toFixed(2)} למוצר בסל). הנתונים מחושבים על סניפי העיר בלבד ומתעדכנים יומית.`,
        },
      },
      {
        "@type": "Question",
        name: `כמה סופרמרקטים יש ב${city.he}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `ב${city.he} פועלים ${data.storeCount} סניפים של ${data.chains.length} רשתות שונות.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a>
          <span className="mx-1">›</span>
          <a href="/supermarkets" className="hover:text-emerald-600">סופרמרקטים</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">{city.he}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-3">
          סופרמרקט זול ב{city.he} — השוואת מחירים
        </h1>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
          <p>
            ב{city.he} פועלים <strong>{data.storeCount} סניפי סופרמרקט</strong> של {data.chains.length} רשתות.
            {cheapest && (
              <> לפי מדד סל היסוד של Savy — המחושב על סניפי {city.he} בלבד —{" "}
              <strong className="text-emerald-700">{heName(cheapest)} היא הזולה ביותר בעיר</strong>{" "}
              (ממוצע ₪{cheapest.avgPrice.toFixed(2)} למוצר בסל).</>
            )}
            {" "}הנתונים מבוססים על נתוני שקיפות המחירים הרשמיים, נכון ל-{today}.
          </p>
        </section>

        {data.basketChains.length > 1 && (
          <section className="mb-6">
            <h2 className="font-black text-lg text-stone-800 mb-3">מדד המחירים ב{city.he} — מהזול ליקר</h2>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs">
                    <th className="text-right p-3 font-semibold">רשת</th>
                    <th className="text-center p-3 font-semibold">ממוצע למוצר בסל</th>
                    <th className="text-center p-3 font-semibold">מדד (100 = הזול)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.basketChains.map((c, i) => {
                    const info = chainByName(c.chain);
                    return (
                      <tr key={c.chain} className="border-b border-stone-50 last:border-0">
                        <td className="p-3 text-stone-700 font-semibold">
                          {i === 0 && <span className="ml-1">🥇</span>}
                          {info
                            ? <a href={`/chain/${encodeURIComponent(c.chain)}`} className="hover:text-emerald-600 hover:underline">{heName(c)}</a>
                            : heName(c)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-stone-600">₪{c.avgPrice.toFixed(2)}</td>
                        <td className={`p-3 text-center font-mono font-black ${i === 0 ? "text-emerald-600" : c.index > 115 ? "text-red-500" : "text-stone-600"}`}>{c.index}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-400 mt-2">* המדד מחושב על סל מוצרי היסוד של Savy, לפי המחיר הזול בכל רשת בסניפי {city.he} בלבד.</p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="font-black text-lg text-stone-800 mb-3">כל הרשתות ב{city.he}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.chains.map((c) => {
              const info = chainByName(c.chain);
              return (
                <div key={c.chain} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                  <div className="font-bold text-sm text-stone-800">{heName(c)}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{c.storeCount} סניפים בעיר</div>
                  <div className="flex gap-2 mt-2 text-[11px] font-semibold">
                    <a href={`/chain/${encodeURIComponent(c.chain)}`} className="text-emerald-600 hover:underline">מחירים</a>
                    {info && <a href={`/deals/${info.slug}`} className="text-emerald-600 hover:underline">מבצעים</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-black text-lg text-stone-800 mb-3">השוואת מחירים בערים נוספות</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <a key={c.slug} href={`/supermarkets/${c.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                סופרמרקט זול ב{c.he}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
