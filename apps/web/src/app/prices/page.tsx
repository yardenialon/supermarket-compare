import type { Metadata } from "next";
import { STAPLES } from "@/lib/staples";

export const metadata: Metadata = {
  title: "כמה עולה? מחירי מוצרי יסוד בסופרמרקט 2026 | Savy",
  description:
    "כמה עולה חלב, לחם, ביצים, חיתולים או קפה? מחירים עדכניים לכל מוצרי היסוד בכל רשתות הסופרמרקט בישראל — עדכון יומי מנתוני שקיפות המחירים.",
  alternates: { canonical: "https://savy.co.il/prices" },
  openGraph: {
    title: "כמה עולה? מחירי מוצרי יסוד בסופרמרקט | Savy",
    description: "מחירים עדכניים לכל מוצרי היסוד — חלב, לחם, ביצים ועוד — בכל רשתות הסופרמרקט בישראל.",
    url: "https://savy.co.il/prices",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

export default function PricesIndexPage() {
  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">כמה עולה? מחירי מוצרי יסוד</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          מחירים עדכניים למוצרי היסוד בסופרמרקטים בישראל, מבוססים על נתוני שקיפות המחירים ומתעדכנים יומית.
          בחרו מוצר לצפייה בטווח המחירים ולהשוואה מלאה בין הרשתות.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAPLES.map((s) => (
            <a key={s.slug} href={`/prices/${s.slug}`}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition flex items-center gap-3">
              <span className="text-2xl">{s.emoji}</span>
              <span className="font-semibold text-stone-700 text-sm">כמה עולה {s.he}?</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
