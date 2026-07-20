import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";
import { chainByName } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("cheapest-supermarket")!;

interface IndexChain { chain: string; chainHe: string | null; avgPrice: number; totalPrice: number; productCount: number; index: number }

async function getIndex(): Promise<IndexChain[]> {
  try {
    const res = await fetch(`${API}/price-index`, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.chains ?? []).map((c: any) => ({ ...c, avgPrice: Number(c.avgPrice), totalPrice: Number(c.totalPrice) }));
  } catch { return []; }
}

const heName = (c: IndexChain) => c.chainHe || chainByName(c.chain)?.he || c.chain;

export async function generateMetadata(): Promise<Metadata> {
  const chains = await getIndex();
  const meta = guideMetadata(g);
  if (chains.length) {
    meta.description = `${heName(chains[0])} היא הרשת הזולה בישראל לפי מדד סל היסוד — הפרש של ${(chains[chains.length - 1].index - 100)}% מהרשת היקרה. הדירוג המלא, מבוסס נתוני שקיפות מחירים, מתעדכן יומית.`;
  }
  return meta;
}

export default async function CheapestSupermarketGuide() {
  const chains = await getIndex();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const cheapest = chains[0];
  const priciest = chains[chains.length - 1];
  const gapPct = cheapest && priciest ? Math.round((priciest.avgPrice / cheapest.avgPrice - 1) * 100) : null;
  const monthly = gapPct ? Math.round(4000 * gapPct / (100 + gapPct)) : null;

  const faq = cheapest ? [
    { q: "איזה סופר הכי זול בישראל?", a: `לפי מדד סל היסוד של Savy, נכון ל-${today}, ${heName(cheapest)} היא הרשת הזולה ביותר בישראל. הדירוג מבוסס על השוואת סל מוצרי יסוד זהה בכל הרשתות, מנתוני שקיפות המחירים הרשמיים.` },
    { q: "מה ההפרש בין הרשת הזולה ליקרה?", a: `ההפרש על סל היסוד הוא כ-${gapPct}%. משפחה שמוציאה כ-4,000 ₪ בחודש יכולה לחסוך בהערכה כ-₪${monthly} בחודש במעבר מהרשת היקרה לזולה.` },
    { q: "האם הרשת הזולה ביותר זולה בכל מוצר?", a: "לא. גם ברשתות היקרות יש מוצרים שזולים יותר מהמתחרות, ומבצעים משנים את התמונה כל שבוע. לכן משתלם להשוות ברמת המוצר או הסל, לא רק ברמת הרשת." },
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
          {cheapest ? (
            <p>
              <strong className="text-emerald-700">{heName(cheapest)} היא הרשת הזולה ביותר בישראל</strong>{" "}
              לפי מדד סל היסוד של Savy, נכון ל-{today}. ההפרש בינה לבין הרשת היקרה ביותר בדירוג ({heName(priciest)})
              עומד על כ-{gapPct}% — שווה ערך לחיסכון של כ-₪{monthly} בחודש למשפחה ממוצעת. הדירוג המלא, שמתעדכן יומית, לפניכם.
            </p>
          ) : (
            <p>הדירוג המלא של רשתות הסופרמרקט בישראל, מהזולה ליקרה, על בסיס סל מוצרי יסוד אחיד — מתעדכן יומית מנתוני שקיפות המחירים.</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-stone-800 mb-3">הדירוג המלא — מהזול ליקר</h2>
          {chains.length > 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs">
                    <th className="text-right p-3 font-semibold">#</th>
                    <th className="text-right p-3 font-semibold">רשת</th>
                    <th className="text-center p-3 font-semibold">מדד (100 = הזול)</th>
                    <th className="text-center p-3 font-semibold">ממוצע למוצר בסל</th>
                  </tr>
                </thead>
                <tbody>
                  {chains.map((c, i) => {
                    const info = chainByName(c.chain);
                    return (
                      <tr key={c.chain} className={`border-b border-stone-50 last:border-0 ${i === 0 ? "bg-emerald-50/50" : ""}`}>
                        <td className="p-3 text-stone-400 font-mono">{i + 1}</td>
                        <td className="p-3 font-semibold text-stone-700">
                          {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}
                          {info
                            ? <a href={`/chain/${encodeURIComponent(c.chain)}`} className="hover:text-emerald-600 hover:underline">{heName(c)}</a>
                            : heName(c)}
                        </td>
                        <td className={`p-3 text-center font-mono font-black ${i === 0 ? "text-emerald-600" : c.index > 115 ? "text-red-500" : "text-stone-600"}`}>{c.index}</td>
                        <td className="p-3 text-center font-mono text-stone-500">₪{c.avgPrice.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone-500">הנתונים נטענים — אפשר לראות את הדירוג החי ב<a href="/price-index" className="text-emerald-600 hover:underline">מדד המחירים</a>.</p>
          )}
          <p className="text-xs text-stone-400 mt-2">
            * המדד משווה את המחיר הזול ביותר לכל מוצר בסל היסוד בכל רשת (ללא אילת וללא חנויות אונליין). מדד 110 = יקר ב-10% מהרשת הזולה.
          </p>
        </section>

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">איך בנוי הדירוג?</h2>
          <p>
            הדירוג מבוסס על <strong>סל מוצרי יסוד אחיד</strong> — חלב, לחם, ביצים, מוצרי ניקיון ועוד — שנבדק בכל הרשתות
            במקביל. הנתונים מגיעים ממאגר שקיפות המחירים הממשלתי, שבו כל רשת מחויבת בחוק לפרסם את מחיריה, ומתעדכנים
            ב-Savy מדי יום. כדי שההשוואה תהיה הוגנת, רשת נכללת רק אם רוב מוצרי הסל זמינים בה.
          </p>
          <h2 className="font-black text-xl text-stone-800">הזול ביותר — לא בהכרח בכל מוצר</h2>
          <p>
            חשוב להבין: הרשת שמובילה את הדירוג היא הזולה <em>בממוצע</em>, אבל כמעט בכל רשת יש מוצרים ספציפיים שדווקא
            זולים יותר אצל המתחרות — ומבצעים הופכים את הקערה כל שבוע. לכן החיסכון הגדול באמת מגיע מהשוואה ברמת
            הסל האישי שלכם: <a href="/online" className="text-emerald-600 hover:underline font-semibold">הזינו את רשימת הקניות שלכם</a>{" "}
            וגלו איפה הסל המלא שלכם הכי זול, או השוו <a href="/compare" className="text-emerald-600 hover:underline font-semibold">רשת מול רשת</a>.
          </p>
          <h2 className="font-black text-xl text-stone-800">והכי זול ליד הבית?</h2>
          <p>
            הדירוג הארצי הוא נקודת פתיחה — אבל המחירים משתנים גם בין סניפים וערים. בדקו את המדד המקומי בעיר שלכם:{" "}
            <a href="/supermarkets/tel-aviv" className="text-emerald-600 hover:underline">תל אביב</a> ·{" "}
            <a href="/supermarkets/jerusalem" className="text-emerald-600 hover:underline">ירושלים</a> ·{" "}
            <a href="/supermarkets/haifa" className="text-emerald-600 hover:underline">חיפה</a> ·{" "}
            <a href="/supermarkets/beer-sheva" className="text-emerald-600 hover:underline">באר שבע</a>
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
            <a href="/guides/basic-basket-cost" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה סל קניות בסיסי?</a>
            <a href="/guides/price-controlled-products" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מוצרים בפיקוח מחירים</a>
            <a href="/price-index" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">מדד המחירים החי</a>
          </div>
        </section>
      </article>
    </div>
  );
}
