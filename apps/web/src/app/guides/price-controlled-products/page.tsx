import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("price-controlled-products")!;

// the main price-controlled categories; live prices pulled per search query
const CONTROLLED = [
  { name: "לחם אחיד פרוס", q: "לחם אחיד", note: "לחם הבסיס שבפיקוח — כהה ולבן, פרוס ולא פרוס" },
  { name: "חלה", q: "חלה", note: "חלה פשוטה במשקל 500 גרם" },
  { name: "חלב 3% בשקית", q: "חלב שקית 3%", note: "ליטר חלב טרי בשקית" },
  { name: "חלב 3% בקרטון", q: "חלב 3% ליטר", note: "ליטר חלב טרי בקרטון" },
  { name: "חמאה 100 גרם", q: "חמאה 100", note: "חמאה רגילה" },
  { name: "גבינה לבנה 5%", q: "גבינה לבנה 5%", note: "גביע 250 גרם" },
  { name: "שמנת חמוצה 15%", q: "שמנת חמוצה", note: "גביע 200 מ\"ל" },
  { name: "ביצים גודל L", q: "ביצים L", note: "תבנית ביצים — מחיר מרבי לפי גודל" },
  { name: "מלח שולחן", q: "מלח שולחני", note: "אריזת קילוגרם" },
];

interface SearchProduct { id: number; name: string; minPrice: number | null; maxPrice: number | null; storeCount: number }

async function liveMin(q: string): Promise<SearchProduct | null> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=5`, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const found = (data.results ?? []).filter((p: SearchProduct) => p.minPrice != null && p.storeCount > 5);
    return found[0] ?? null;
  } catch { return null; }
}

export const metadata: Metadata = guideMetadata(g);

export default async function PriceControlledGuide() {
  const live = await Promise.all(CONTROLLED.map((c) => liveMin(c.q)));
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const faq = [
    { q: "מה זה מוצרים בפיקוח מחירים?", a: "מוצרי יסוד שהמדינה קובעת להם מחיר מרבי בחוק, במטרה להבטיח שמוצרים חיוניים יישארו נגישים לכולם. לרשת אסור למכור אותם מעל המחיר המרבי — אבל מותר (וקורה) למכור מתחתיו." },
    { q: "אילו מוצרים נמצאים בפיקוח?", a: "הקטגוריות המרכזיות: לחם אחיד וחלה, חלב טרי (שקית וקרטון), חמאה, גבינה לבנה 5%, שמנת חמוצה, ביצים ומלח. הרשימה הרשמית והמחירים המרביים מתפרסמים באתר משרד הכלכלה והתעשייה." },
    { q: "האם מוצר בפיקוח עולה אותו דבר בכל הרשתות?", a: "לא. המחיר בפיקוח הוא תקרה, לא מחיר אחיד — רשתות רבות מוכרות מוצרים מפוקחים מתחת למחיר המרבי כדי למשוך לקוחות. לכן גם על מוצרים בפיקוח שווה להשוות." },
  ];

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd(g, faq)) }} />
      <article className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a><span className="mx-1">›</span>
          <a href="/guides" className="hover:text-emerald-600">מדריכים</a><span className="mx-1">›</span>
          <span className="text-stone-500">{g.title}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">{g.emoji} {g.title} (2026)</h1>
        <div className="text-xs text-stone-400 mb-5">עודכן: {today}</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          <p>
            מוצרים בפיקוח מחירים הם מוצרי יסוד — לחם, חלב, חמאה, ביצים ועוד — שהמדינה קובעת להם{" "}
            <strong>מחיר מרבי בחוק</strong>. חשוב לדעת: זו תקרה, לא מחיר אחיד. רשתות רבות מוכרות אותם{" "}
            <strong className="text-emerald-700">מתחת למחיר המרבי</strong>, ולכן גם על מוצרים מפוקחים אפשר לחסוך.
            הרשימה המלאה, עם המחירים בפועל ברשתות נכון להיום — לפניכם.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-stone-800 mb-3">הרשימה: קטגוריות הפיקוח המרכזיות והמחיר בפועל</h2>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-500 text-xs">
                  <th className="text-right p-3 font-semibold">מוצר</th>
                  <th className="text-right p-3 font-semibold">פירוט</th>
                  <th className="text-center p-3 font-semibold">מחיר בפועל היום (החל מ-)</th>
                </tr>
              </thead>
              <tbody>
                {CONTROLLED.map((c, i) => {
                  const p = live[i];
                  return (
                    <tr key={c.name} className="border-b border-stone-50 last:border-0">
                      <td className="p-3 font-semibold text-stone-700">
                        {p ? <a href={`/product/${p.id}`} className="hover:text-emerald-600 hover:underline">{c.name}</a> : c.name}
                      </td>
                      <td className="p-3 text-xs text-stone-400">{c.note}</td>
                      <td className="p-3 text-center font-mono font-black text-emerald-600">
                        {p?.minPrice ? `₪${Number(p.minPrice).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            * "החל מ-" = המחיר הזול ביותר שנמצא כרגע ברשתות למוצר מייצג בקטגוריה. המחירים המרביים הרשמיים מתפרסמים ומתעדכנים ע"י{" "}
            <a href="https://www.gov.il/he/departments/dynamiccollectors/food-price-control-search" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">משרד הכלכלה והתעשייה</a>.
          </p>
        </section>

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">למה זה חשוב לצרכן?</h2>
          <p>
            <strong>ראשית, הגנה:</strong> אם רשת גובה על מוצר מפוקח יותר מהמחיר המרבי — זו עבירה, ואפשר (וכדאי) לדווח
            למשרד הכלכלה. שווה להכיר את המחירים המרביים של מוצרי הבסיס שאתם קונים כל שבוע.
          </p>
          <p>
            <strong>שנית, חיסכון:</strong> דווקא בגלל שכולם מכירים את "מחיר הפיקוח", רשתות משתמשות במוצרים האלה
            כמוצרי פיתיון וזולות מהתקרה. ההבדלים בין הרשתות על סל מוצרי הפיקוח לבדו יכולים להצטבר לעשרות שקלים בחודש —{" "}
            <a href="/guides/cheapest-supermarket" className="text-emerald-600 hover:underline font-semibold">בדקו איזו רשת זולה יותר</a>{" "}
            או השוו כל מוצר בנפרד בלחיצה על שמו בטבלה.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-8 text-sm text-stone-600 leading-relaxed space-y-4">
          <h2 className="font-black text-xl text-stone-800">שאלות נפוצות</h2>
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-bold text-stone-700">{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <section className="text-sm">
          <h2 className="font-black text-lg text-stone-800 mb-3">להמשך קריאה</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/guides/basic-basket-cost" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה סל קניות בסיסי?</a>
            <a href="/prices/milk" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה חלב?</a>
            <a href="/prices/bread" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה לחם?</a>
          </div>
        </section>
      </article>
    </div>
  );
}
