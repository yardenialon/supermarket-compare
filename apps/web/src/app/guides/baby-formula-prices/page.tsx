import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("baby-formula-prices")!;

interface SearchProduct { id: number; name: string; brand: string | null; imageUrl: string | null; minPrice: number | null; maxPrice: number | null; storeCount: number }

async function searchProducts(q: string, limit = 8): Promise<SearchProduct[]> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=${limit}`, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((p: SearchProduct) => p.minPrice != null && p.storeCount > 5);
  } catch { return []; }
}

export async function generateMetadata(): Promise<Metadata> {
  const materna = await searchProducts("מטרנה", 5);
  const meta = guideMetadata(g);
  if (materna.length) {
    const low = Math.min(...materna.map((p) => Number(p.minPrice)));
    meta.description = `תרכובות מזון לתינוקות עולות מאות שקלים בחודש. מטרנה החל מ-₪${low.toFixed(2)} היום — איך משווים נכון (מחיר ל-100 גרם), ואיפה באמת הכי זול. מחירים חיים.`;
  }
  return meta;
}

export default async function BabyFormulaGuide() {
  const [materna, similac, nutrilon] = await Promise.all([
    searchProducts("מטרנה"),
    searchProducts("סימילאק"),
    searchProducts("נוטרילון"),
  ]);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const all = [...materna, ...similac, ...nutrilon];
  const low = all.length ? Math.min(...all.map((p) => Number(p.minPrice))) : null;

  const brands = [
    { name: "מטרנה", products: materna },
    { name: "סימילאק", products: similac },
    { name: "נוטרילון", products: nutrilon },
  ].filter((b) => b.products.length > 0);

  const faq = [
    { q: "כמה עולה מטרנה?", a: `${low ? `נכון ל-${today}, תרכובות מזון לתינוקות מתחילות מ-₪${low.toFixed(2)}, ` : ""}והמחיר משתנה משמעותית לפי שלב (1/2/3), גודל האריזה והרשת. ההפרש בין הרשת הזולה ליקרה על אותה אריזה בדיוק מגיע לעשרות שקלים — תמיד השוו לפני קנייה.` },
    { q: "איך משווים מחירי תרכובות נכון?", a: "לפי מחיר ל-100 גרם אבקה, לא לפי מחיר האריזה. אריזות שונות (700 גרם, 1,400 גרם, מארזים) מקשות על השוואה ישירה — חלקו את המחיר במשקל. מארזי ענק ומבצעי מולטי-פאק כמעט תמיד זולים יותר ל-100 גרם." },
    { q: "תינוק צורך תרכובת — כמה זה עולה בחודש?", a: "תינוק שניזון מתרכובת בלבד צורך בערך 600-800 גרם אבקה בשבוע בחודשי השיא — הוצאה של מאות שקלים בחודש. חיסכון של 15% מבחירת רשת ומבצעים נכונים שווה מאות שקלים בשנה." },
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
            תרכובת מזון היא מההוצאות הכבדות של הורים לתינוק — מאות שקלים בחודש.
            {low && <> נכון ל-{today}, המחירים מתחילים מ-<strong className="text-emerald-700">₪{low.toFixed(2)}</strong> לאריזה,</>}{" "}
            וההפרש בין רשתות על אותה אריזה בדיוק מגיע לעשרות שקלים. הכלל החשוב ביותר:
            משווים לפי <strong>מחיר ל-100 גרם אבקה</strong>, לא לפי מחיר האריזה — ותמיד בודקים גם את רשתות הפארם.
          </p>
        </section>

        {brands.map((b) => (
          <section key={b.name} className="mb-8">
            <h2 className="font-black text-xl text-stone-800 mb-3">מחירי {b.name} עכשיו — לחצו להשוואה מלאה</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {b.products.slice(0, 4).map((p) => (
                <a key={p.id} href={`/product/${p.id}`}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 hover:shadow-md transition flex flex-col gap-1.5">
                  <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                      : <span className="text-3xl">🍼</span>}
                  </div>
                  <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{p.name}</div>
                  <div className="font-mono font-black text-emerald-600 text-sm">החל מ-₪{Number(p.minPrice).toFixed(2)}</div>
                  <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">איך לחסוך על תרכובות — בלי להתפשר</h2>
          <p>
            <strong>מחיר ל-100 גרם.</strong> אריזה של 1,400 גרם כמעט תמיד משתלמת יותר מ-700 גרם — אבל לא תמיד, ובמבצעים
            התמונה מתהפכת. שניית החישוב הזו שווה עשרות שקלים בכל קנייה.
          </p>
          <p>
            <strong>רשתות הפארם והמבצעים.</strong> תרכובות הן מוצר עוגן שמושך הורים לחנות — ולכן מבצעי "2 ב-" ו"3 ב-"
            נפוצים בהן. מכיוון שהתרכובת נצרכת בקצב קבוע וידוע, הצטיידות במבצע טוב היא חיסכון נטו.
            עקבו אחרי <a href="/deals" className="text-emerald-600 hover:underline font-semibold">המבצעים</a>.
          </p>
          <p>
            <strong>עקביות רפואית, גמישות צרכנית.</strong> מעבר בין תרכובות הוא החלטה שעושים עם רופא/ה — לא עם הארנק.
            אבל בתוך אותה תרכובת בדיוק, אין שום סיבה לשלם יותר: אותה אריזה, אותו מפעל, מחיר שונה בין רשתות.
            השוו כל אריזה בלחיצה עליה למעלה.
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
            <a href="/guides/cheapest-diapers" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">איפה הכי זול לקנות חיתולים?</a>
            <a href="/prices/formula" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מחירי תרכובות חיים</a>
            <a href="/category/מוצרי תינוקות" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כל מוצרי התינוקות</a>
          </div>
        </section>
      </article>
    </div>
  );
}
