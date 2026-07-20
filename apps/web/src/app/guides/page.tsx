import type { Metadata } from "next";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "מדריכי חיסכון בקניות — מבוססי מחירים אמיתיים | Savy",
  description:
    "מדריכים לחיסכון בקניות הסופר, מבוססים על נתוני מחירים חיים מ-25+ רשתות: מי הכי זול, כמה עולה סל בסיסי, איפה זול לקנות חיתולים ועוד.",
  alternates: { canonical: "https://savy.co.il/guides" },
  openGraph: {
    title: "מדריכי חיסכון בקניות | Savy",
    description: "מדריכים מבוססי נתוני מחירים חיים — מי הכי זול, כמה עולה סל בסיסי ועוד.",
    url: "https://savy.co.il/guides",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

export default function GuidesHubPage() {
  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">מדריכי חיסכון בקניות</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          כל מדריך כאן בנוי על נתוני המחירים החיים של Savy — 7.5 מיליון מחירים מ-25+ רשתות, מתעדכנים יומית.
          לא הערכות, לא "בערך": מספרים אמיתיים מהיום.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <a key={g.slug} href={`/guides/${g.slug}`}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md transition flex flex-col gap-2">
              <div className="text-3xl">{g.emoji}</div>
              <div className="font-black text-stone-800 leading-snug">{g.title}</div>
              <div className="text-xs text-stone-500 leading-relaxed">{g.description}</div>
              <div className="text-xs font-bold text-emerald-600 mt-auto">לקריאה ←</div>
            </a>
          ))}
        </div>
        <div className="mt-8 bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-black text-lg text-stone-800 mb-2">כלים שיעזרו לכם לחסוך</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/guide" className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">המדריך המלא להשוואת מחירים</a>
            <a href="/price-index" className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מדד מחירי הסופרמרקט</a>
            <a href="/compare" className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">השוואת רשתות ראש-בראש</a>
            <a href="/prices" className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה? מחירי מוצרי יסוד</a>
            <a href="/online" className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">השוואת סל קניות אונליין</a>
          </div>
        </div>
      </div>
    </div>
  );
}
