import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("cheapest-diapers")!;

interface SearchProduct { id: number; name: string; brand: string | null; imageUrl: string | null; minPrice: number | null; maxPrice: number | null; storeCount: number }

async function getDiapers(): Promise<SearchProduct[]> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent("חיתולים")}&limit=15`, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((p: SearchProduct) => p.minPrice != null && p.storeCount > 5);
  } catch { return []; }
}

export async function generateMetadata(): Promise<Metadata> {
  const products = await getDiapers();
  const meta = guideMetadata(g);
  if (products.length) {
    const mins = products.map((p) => Number(p.minPrice));
    meta.description = `חבילת חיתולים עולה היום החל מ-₪${Math.min(...mins).toFixed(2)} — וההפרש בין הרשתות על אותה חבילה מגיע לעשרות אחוזים. איפה הכי זול, איך מחשבים מחיר לחיתול, וכמה חוסכים בשנה.`;
  }
  return meta;
}

export default async function CheapestDiapersGuide() {
  const products = await getDiapers();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const mins = products.map((p) => Number(p.minPrice));
  const low = mins.length ? Math.min(...mins) : null;
  // typical spread between chains on the same pack, from min/max of the cheapest listing
  const spreadExample = products[0] && products[0].maxPrice
    ? Math.round((Number(products[0].maxPrice) / Number(products[0].minPrice) - 1) * 100)
    : null;

  const faq = [
    { q: "איפה הכי זול לקנות חיתולים?", a: `אין רשת אחת שתמיד זולה — המחיר משתנה לפי מותג, מידה ומבצעים באותו שבוע. הדרך הבטוחה: השוואת המחיר של החבילה הספציפית בין כל הרשתות${low ? ` (נכון ל-${today}, חבילות מתחילות מ-₪${low.toFixed(2)})` : ""}, ומעקב אחרי מבצעי מולטי-פאק, שם החיסכון הגדול.` },
    { q: "איך מחשבים מחיר לחיתול?", a: "מחלקים את מחיר החבילה במספר החיתולים בה. חבילה של ₪50 עם 44 חיתולים = ₪1.14 לחיתול; חבילה של ₪60 עם 66 חיתולים = ₪0.91 לחיתול — זולה יותר למרות המחיר הגבוה. תמיד משווים מחיר ליחידה, לא מחיר לחבילה." },
    { q: "כמה עולים חיתולים בשנה?", a: "תינוק צורך בממוצע 5-6 חיתולים ביום בשנה הראשונה — כ-2,000 חיתולים בשנה. במחיר של ₪1 לחיתול זה כ-2,000 ₪ בשנה; הפרש של 20% בין רשתות = כ-400 ₪ בשנה על חיתולים בלבד." },
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

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">{g.emoji} {g.title}</h1>
        <div className="text-xs text-stone-400 mb-5">עודכן: {today} · מחירים חיים מכל הרשתות</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          <p>
            חיתולים הם מההוצאות הגדולות של משפחה עם תינוק — כ-2,000 חיתולים בשנה הראשונה.
            {low && <> נכון ל-{today}, חבילות חיתולים מתחילות מ-<strong className="text-emerald-700">₪{low.toFixed(2)}</strong>{spreadExample ? <>, וההפרש בין הרשת הזולה ליקרה על אותה חבילה בדיוק מגיע עד <strong>{spreadExample}%</strong></> : null}.</>}
            {" "}שתי החלטות עושות את החיסכון: <strong>לחשב מחיר לחיתול</strong> (לא לחבילה) ו<strong>להשוות בין רשתות לפני כל קנייה גדולה</strong>.
          </p>
        </section>

        {products.length > 0 && (
          <section className="mb-8">
            <h2 className="font-black text-xl text-stone-800 mb-3">מחירי חיתולים עכשיו — לחצו להשוואה מלאה</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.slice(0, 9).map((p) => (
                <a key={p.id} href={`/product/${p.id}`}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 hover:shadow-md transition flex flex-col gap-1.5">
                  <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                      : <span className="text-3xl">👶</span>}
                  </div>
                  <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{p.name}</div>
                  <div className="font-mono font-black text-emerald-600 text-sm">החל מ-₪{Number(p.minPrice).toFixed(2)}</div>
                  <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">שלושת הכללים לחיסכון בחיתולים</h2>
          <p>
            <strong>1. מחיר לחיתול, לא לחבילה.</strong> החבילות מגיעות בגדלים שונים בכוונה — חבילת ענק ב-₪75 יכולה להיות
            זולה משמעותית לחיתול מחבילה רגילה ב-₪50. חלקו את המחיר במספר החיתולים לפני כל השוואה.
          </p>
          <p>
            <strong>2. מבצעי מולטי-פאק הם המלך.</strong> רוב החיסכון בחיתולים מגיע ממבצעי "2 ב-" ו"3 ב-" — שם
            המחיר לחיתול יורד גם ב-30%. חיתולים לא מתקלקלים: כשיש מבצע טוב במידה הנכונה, שווה להצטייד.
            עקבו אחרי <a href="/deals" className="text-emerald-600 hover:underline font-semibold">המבצעים החמים</a> ברשתות.
          </p>
          <p>
            <strong>3. גם רשתות הפארם במשחק.</strong> גוד פארם וסופר-פארם מריצים מבצעי חיתולים אגרסיביים כדי למשוך
            משפחות — לפעמים מתחת למחירי הסופרמרקטים. Savy משווה גם אותן.
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
            <a href="/prices/diapers" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולים חיתולים? מחירים חיים</a>
            <a href="/prices/formula" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מחירי תרכובות מזון לתינוקות</a>
            <a href="/guides/cheapest-supermarket" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">איזה סופר הכי זול בישראל?</a>
          </div>
        </section>
      </article>
    </div>
  );
}
