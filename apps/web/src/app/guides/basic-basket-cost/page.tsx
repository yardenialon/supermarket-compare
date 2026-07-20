import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";
import { chainByName } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("basic-basket-cost")!;

interface Breakdown {
  products: { product_id: number; name: string; imageUrl: string | null }[];
  chainPrices: Record<string, Record<number, number>>;
  chains: { chain: string; total: number }[];
}

async function getBreakdown(): Promise<Breakdown | null> {
  try {
    const res = await fetch(`${API}/savy-basket/breakdown`, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const heName = (chain: string) => chainByName(chain)?.he || chain;

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBreakdown();
  const meta = guideMetadata(g);
  if (b?.chains?.length) {
    const cheap = b.chains[0], exp = b.chains[b.chains.length - 1];
    meta.description = `סל של ${b.products.length} מוצרי יסוד עולה היום בין ₪${cheap.total.toFixed(0)} (${heName(cheap.chain)}) ל-₪${exp.total.toFixed(0)} — הפרש של ₪${(exp.total - cheap.total).toFixed(0)} על אותו סל בדיוק. הנתונים המלאים, מתעדכן יומית.`;
  }
  return meta;
}

export default async function BasketCostGuide() {
  const b = await getBreakdown();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const cheap = b?.chains?.[0];
  const exp = b?.chains?.[b.chains.length - 1];
  const diff = cheap && exp ? exp.total - cheap.total : null;
  // avg weekly shop → monthly saving estimate on 4 baskets
  const monthlySaving = diff ? Math.round(diff * 4) : null;

  const faq = cheap && exp ? [
    { q: "כמה עולה סל קניות בסיסי בישראל?", a: `נכון ל-${today}, סל של ${b!.products.length} מוצרי יסוד עולה בין ₪${cheap.total.toFixed(2)} ברשת הזולה ביותר (${heName(cheap.chain)}) ל-₪${exp.total.toFixed(2)} ברשת היקרה ביותר שנבדקה.` },
    { q: "כמה אפשר לחסוך על סל קניות?", a: `ההפרש על סל היסוד בין הרשת הזולה ליקרה הוא ₪${diff!.toFixed(2)}. במשפחה שעורכת קנייה שבועית, זה מצטבר לכ-₪${monthlySaving} בחודש — רק מבחירת הרשת הנכונה, לפני מבצעים.` },
    { q: "כמה מוציאה משפחה בישראל על מזון בחודש?", a: "על פי סקר הוצאות משק הבית של הלמ\"ס, ההוצאה החודשית הממוצעת של משק בית על מזון (ללא ארוחות בחוץ) היא כ-2,700 ₪ — אחד מסעיפי ההוצאה הגדולים במשק הבית, ולכן גם זה עם פוטנציאל החיסכון הגדול ביותר." },
  ] : [];

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
        <div className="text-xs text-stone-400 mb-5">עודכן: {today} · מבוסס על נתוני שקיפות מחירים רשמיים</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          {cheap && exp ? (
            <p>
              נכון ל-{today}, סל קניות בסיסי של <strong>{b!.products.length} מוצרי יסוד</strong> עולה{" "}
              <strong className="text-emerald-700">₪{cheap.total.toFixed(2)} ברשת הזולה ביותר ({heName(cheap.chain)})</strong>{" "}
              ועד ₪{exp.total.toFixed(2)} ברשת היקרה ביותר — הפרש של ₪{diff!.toFixed(2)} על אותו סל בדיוק.
              בקנייה שבועית, זה כ-₪{monthlySaving} בחודש.
            </p>
          ) : (
            <p>סל מוצרי היסוד של Savy נבדק יומית בכל הרשתות. את המספרים החיים אפשר לראות ב<a href="/price-index" className="text-emerald-600 underline">מדד המחירים</a>.</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-stone-800 mb-3">כמה עולה הסל בכל רשת?</h2>
          {b?.chains?.length ? (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs">
                    <th className="text-right p-3 font-semibold">רשת</th>
                    <th className="text-center p-3 font-semibold">מחיר הסל</th>
                    <th className="text-center p-3 font-semibold">מול הזול ביותר</th>
                  </tr>
                </thead>
                <tbody>
                  {b.chains.map((c, i) => (
                    <tr key={c.chain} className={`border-b border-stone-50 last:border-0 ${i === 0 ? "bg-emerald-50/50" : ""}`}>
                      <td className="p-3 font-semibold text-stone-700">
                        {i === 0 && "🥇 "}
                        {chainByName(c.chain)
                          ? <a href={`/chain/${encodeURIComponent(c.chain)}`} className="hover:text-emerald-600 hover:underline">{heName(c.chain)}</a>
                          : heName(c.chain)}
                      </td>
                      <td className={`p-3 text-center font-mono font-black ${i === 0 ? "text-emerald-600" : "text-stone-600"}`}>₪{c.total.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono text-stone-400">{i === 0 ? "—" : `+₪${(c.total - b.chains[0].total).toFixed(2)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className="text-xs text-stone-400 mt-2">* לכל רשת נלקח המחיר הזול ביותר לכל מוצר (ללא אילת וללא אונליין). נכללות רשתות שבהן זמינים רוב מוצרי הסל.</p>
        </section>

        {b?.products?.length ? (
          <section className="mb-8">
            <h2 className="font-black text-xl text-stone-800 mb-3">מה יש בסל?</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-3">
              הסל כולל {b.products.length} מוצרי יסוד שנמצאים כמעט בכל בית בישראל. לחצו על מוצר להשוואת מחירים מלאה בין כל הרשתות:
            </p>
            <div className="flex flex-wrap gap-2">
              {b.products.map((p) => (
                <a key={p.product_id} href={`/product/${p.product_id}`}
                  className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                  {p.name}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">ומה עם הסל שלכם?</h2>
          <p>
            סל היסוד הוא קנה מידה — אבל לכל משפחה סל משלה. ההפרשים על הסל האישי שלכם יכולים להיות גדולים אף יותר,
            במיוחד אם הוא כולל מותגים ספציפיים, מוצרי תינוקות או מזון לחיות. {" "}
            <a href="/online" className="text-emerald-600 hover:underline font-semibold">בנו את הרשימה שלכם ב-Savy</a>{" "}
            וקבלו תוך שניות את המחיר שלה בכל רשת — כולל הסניפים ליד הבית.
          </p>
          <p>
            על פי סקר הוצאות משק הבית של הלמ״ס, משק בית ממוצע מוציא כ-2,700 ₪ בחודש על מזון (ללא ארוחות בחוץ).
            חיסכון של 10% — שהוא בהחלט בר-השגה לפי הנתונים למעלה — שווה יותר מ-3,200 ₪ בשנה.
          </p>
        </section>

        {faq.length > 0 && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-8 text-sm text-stone-600 leading-relaxed space-y-4">
            <h2 className="font-black text-xl text-stone-800">שאלות נפוצות</h2>
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold text-stone-700">{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        )}

        <section className="text-sm">
          <h2 className="font-black text-lg text-stone-800 mb-3">להמשך קריאה</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/guides/cheapest-supermarket" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">איזה סופר הכי זול בישראל?</a>
            <a href="/guides/price-controlled-products" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מוצרים בפיקוח מחירים</a>
            <a href="/prices" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה? מחירי מוצרי יסוד</a>
          </div>
        </section>
      </article>
    </div>
  );
}
