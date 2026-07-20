import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stapleBySlug, STAPLES } from "@/lib/staples";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

interface SearchProduct {
  id: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  storeCount: number;
}

async function getProducts(q: string): Promise<SearchProduct[]> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=12`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((p: SearchProduct) => p.minPrice != null && p.storeCount > 5);
  } catch { return []; }
}

function priceStats(products: SearchProduct[]) {
  if (!products.length) return null;
  const mins = products.map((p) => Number(p.minPrice));
  return {
    low: Math.min(...mins),
    high: Math.max(...mins),
    count: products.length,
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const staple = stapleBySlug(params.slug);
  if (!staple) return { title: "מחירים | Savy" };
  const stats = priceStats(await getProducts(staple.q));
  const title = `כמה עולה ${staple.he}? מחירים עדכניים 2026 | Savy`;
  const description = stats
    ? `מחיר ${staple.he} נע היום בין ₪${stats.low.toFixed(2)} ל-₪${stats.high.toFixed(2)} (לפי המוצרים הנפוצים). השוואת מחירים בין כל רשתות הסופרמרקט — עדכון יומי.`
    : `כמה עולה ${staple.he} בסופרמרקטים בישראל? השוואת מחירים עדכנית בין כל הרשתות — עדכון יומי מנתוני שקיפות המחירים.`;
  return {
    title, description,
    alternates: { canonical: `https://savy.co.il/prices/${params.slug}` },
    openGraph: { title, description, url: `https://savy.co.il/prices/${params.slug}`, siteName: "Savy", locale: "he_IL", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StaplePricePage({ params }: { params: { slug: string } }) {
  const staple = stapleBySlug(params.slug);
  if (!staple) notFound();
  const products = await getProducts(staple.q);
  const stats = priceStats(products);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const others = STAPLES.filter((s) => s.slug !== staple.slug).slice(0, 16);

  const faq = stats && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `כמה עולה ${staple.he} בסופרמרקט?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `נכון ל-${today}, המחיר הזול ביותר ל${staple.he} (המוצרים הנפוצים) נע בין ₪${stats.low.toFixed(2)} ל-₪${stats.high.toFixed(2)} — תלוי במותג, בגודל האריזה וברשת. הנתונים מבוססים על נתוני שקיפות המחירים ומתעדכנים יומית.`,
        },
      },
      {
        "@type": "Question",
        name: `איפה הכי זול לקנות ${staple.he}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `המחיר משתנה בין הרשתות והסניפים. בעמוד של כל מוצר ב-Savy מוצגת השוואת מחירים מלאה בין כל הרשתות, כולל המחיר הזול ביותר ליד הבית.`,
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
          <a href="/prices" className="hover:text-emerald-600">כמה עולה?</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">{staple.he}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-3">
          {staple.emoji} כמה עולה {staple.he}? מחירים עדכניים
        </h1>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
          {stats ? (
            <p>
              נכון ל-{today}, המחיר הזול ביותר ל<strong>{staple.he}</strong> נע בין{" "}
              <strong className="text-emerald-700">₪{stats.low.toFixed(2)} ל-₪{stats.high.toFixed(2)}</strong>{" "}
              במוצרים הנפוצים — תלוי במותג, בגודל האריזה וברשת. ההפרש בין הרשת הזולה ליקרה על אותו מוצר בדיוק
              יכול להגיע לעשרות אחוזים. לחצו על מוצר להשוואת מחירים מלאה בין כל הרשתות.
            </p>
          ) : (
            <p>לא הצלחנו לטעון כרגע את המחירים. אפשר לחפש {staple.he} ישירות ב<a href="/" className="text-emerald-600 hover:underline">חיפוש של Savy</a>.</p>
          )}
        </section>

        {products.length > 0 && (
          <section className="mb-8">
            <h2 className="font-black text-lg text-stone-800 mb-3">מחירי {staple.he} — המוצרים הנפוצים</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => (
                <a key={p.id} href={`/product/${p.id}`}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 hover:shadow-md transition flex flex-col gap-1.5">
                  <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                      : <span className="text-3xl">{staple.emoji}</span>}
                  </div>
                  <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{p.name}</div>
                  {p.brand && p.brand !== "לא ידוע" && <div className="text-[11px] text-stone-400">{p.brand}</div>}
                  <div className="font-mono font-black text-emerald-600 text-sm">
                    החל מ-₪{Number(p.minPrice).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-black text-lg text-stone-800 mb-3">כמה עולה —</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((s) => (
              <a key={s.slug} href={`/prices/${s.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                {s.emoji} {s.he}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
