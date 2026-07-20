import type { Metadata } from "next";
import { comparePairs, MAJOR_CHAINS } from "@/lib/chains";

export const metadata: Metadata = {
  title: "השוואת רשתות סופרמרקט — מי יותר זול? | Savy",
  description:
    "השוואות ראש-בראש בין רשתות הסופרמרקט בישראל: שופרסל מול רמי לוי, אושר עד מול ויקטורי ועוד. סל מוצרי יסוד אמיתי, מחירים רשמיים, עדכון יומי.",
  alternates: { canonical: "https://savy.co.il/compare" },
  openGraph: {
    title: "השוואת רשתות סופרמרקט — מי יותר זול? | Savy",
    description: "השוואות ראש-בראש בין כל רשתות הסופרמרקט בישראל, על בסיס סל מוצרי יסוד אמיתי.",
    url: "https://savy.co.il/compare",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

export default function CompareIndexPage() {
  const pairs = comparePairs();
  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">השוואת רשתות סופרמרקט</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          מי באמת יותר זול? בחרו זוג רשתות וקבלו השוואה מוצר-מוצר על סל מוצרי יסוד,
          מבוססת על נתוני שקיפות המחירים הרשמיים ומתעדכנת יומית.
          לסקירה כללית של כל הרשתות — <a href="/price-index" className="text-emerald-600 hover:underline">מדד מחירי הסופרמרקט</a>.
        </p>
        {MAJOR_CHAINS.map((chain) => {
          // each pair is listed once, under the chain that opens its slug
          const own = pairs.filter((p) => p.a.slug === chain.slug);
          if (!own.length) return null;
          return (
            <section key={chain.slug} className="mb-6">
              <h2 className="font-black text-lg text-stone-800 mb-2">{chain.he} מול —</h2>
              <div className="flex flex-wrap gap-2">
                {own.map((p) => (
                  <a key={p.slug} href={`/compare/${p.slug}`}
                    className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                    {p.a.he} מול {p.b.he}
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
