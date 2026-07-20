import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parseCompareSlug, comparePairs, type ChainInfo } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

interface Breakdown {
  products: { product_id: number; name: string; imageUrl: string | null; barcode: string | null }[];
  chainPrices: Record<string, Record<number, number>>;
  chains: { chain: string; total: number }[];
}

async function getBreakdown(): Promise<Breakdown | null> {
  try {
    const res = await fetch(`${API}/savy-basket/breakdown`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getChain(name: string) {
  try {
    const res = await fetch(`${API}/chain/${encodeURIComponent(name)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function compareData(breakdown: Breakdown | null, a: ChainInfo, b: ChainInfo) {
  if (!breakdown) return null;
  const pa = breakdown.chainPrices[a.name];
  const pb = breakdown.chainPrices[b.name];
  if (!pa || !pb) return null;
  // only products both chains carry, so totals compare like for like
  const rows = breakdown.products
    .filter((p) => pa[p.product_id] != null && pb[p.product_id] != null)
    .map((p) => ({ ...p, priceA: pa[p.product_id], priceB: pb[p.product_id] }));
  if (rows.length < 5) return null;
  const totalA = rows.reduce((s, r) => s + r.priceA, 0);
  const totalB = rows.reduce((s, r) => s + r.priceB, 0);
  const winsA = rows.filter((r) => r.priceA < r.priceB).length;
  const winsB = rows.filter((r) => r.priceB < r.priceA).length;
  const cheaper = totalA <= totalB ? a : b;
  const expensive = totalA <= totalB ? b : a;
  const diff = Math.abs(totalA - totalB);
  const diffPct = (diff / Math.max(totalA, totalB)) * 100;
  return { rows, totalA, totalB, winsA, winsB, cheaper, expensive, diff, diffPct };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const parsed = parseCompareSlug(params.slug);
  if (!parsed || parsed.reversed) return { title: "השוואת רשתות | Savy" };
  const { a, b } = parsed;
  const cmp = compareData(await getBreakdown(), a, b);
  const title = `${a.he} או ${b.he} — איפה יותר זול? השוואת מחירים 2026 | Savy`;
  const description = cmp
    ? `השוואת סל קניות של ${cmp.rows.length} מוצרי יסוד: ${cmp.cheaper.he} זולה יותר ב-₪${cmp.diff.toFixed(0)} (${cmp.diffPct.toFixed(1)}%). מחירים אמיתיים, עדכון יומי.`
    : `השוואת מחירים בין ${a.he} ל-${b.he} על סל מוצרי יסוד — נתונים אמיתיים מנתוני שקיפות המחירים, עדכון יומי.`;
  return {
    title, description,
    alternates: { canonical: `https://savy.co.il/compare/${params.slug}` },
    openGraph: { title, description, url: `https://savy.co.il/compare/${params.slug}`, siteName: "Savy", locale: "he_IL", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparePage({ params }: { params: { slug: string } }) {
  const parsed = parseCompareSlug(params.slug);
  if (!parsed) notFound();
  const { a, b, reversed } = parsed;
  if (reversed) redirect(`/compare/${a.slug}-vs-${b.slug}`);

  const [breakdown, chainA, chainB] = await Promise.all([getBreakdown(), getChain(a.name), getChain(b.name)]);
  const cmp = compareData(breakdown, a, b);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const storesA = chainA?.chain?.storeCount;
  const storesB = chainB?.chain?.storeCount;

  const otherPairs = comparePairs()
    .filter((p) => p.slug !== params.slug && (p.a.slug === a.slug || p.b.slug === a.slug || p.a.slug === b.slug || p.b.slug === b.slug))
    .slice(0, 8);

  const faq = cmp && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `מה יותר זול — ${a.he} או ${b.he}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `על סל של ${cmp.rows.length} מוצרי יסוד, ${cmp.cheaper.he} זולה יותר מ${cmp.expensive.he} ב-₪${cmp.diff.toFixed(2)} (${cmp.diffPct.toFixed(1)}%). הנתונים מבוססים על מחירים רשמיים מנתוני שקיפות המחירים ומתעדכנים יומית.`,
        },
      },
      {
        "@type": "Question",
        name: `כמה אפשר לחסוך במעבר מ${cmp.expensive.he} ל${cmp.cheaper.he}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `על סל הבסיס שנבדק ההפרש הוא ₪${cmp.diff.toFixed(2)}. משפחה שמוציאה כ-4,000 ₪ בחודש יכולה לחסוך בהערכה גסה כ-₪${Math.round(4000 * cmp.diffPct / 100)} בחודש.`,
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
          <a href="/compare" className="hover:text-emerald-600">השוואת רשתות</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">{a.he} מול {b.he}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-3">
          {a.he} או {b.he} — איפה יותר זול?
        </h1>

        {cmp ? (
          <>
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
              <p>
                השווינו סל של <strong>{cmp.rows.length} מוצרי יסוד</strong> (חלב, לחם, ביצים ועוד) בין {a.he} ל{b.he},
                על בסיס נתוני שקיפות המחירים הרשמיים. התוצאה:{" "}
                <strong className="text-emerald-700">{cmp.cheaper.he} זולה יותר ב-₪{cmp.diff.toFixed(2)}</strong>{" "}
                ({cmp.diffPct.toFixed(1)}%) על הסל כולו. נכון ל-{today}.
              </p>
            </section>

            <section className="grid grid-cols-2 gap-3 mb-6">
              {[{ c: a, total: cmp.totalA, wins: cmp.winsA, stores: storesA }, { c: b, total: cmp.totalB, wins: cmp.winsB, stores: storesB }].map(({ c, total, wins, stores }) => (
                <div key={c.slug} className={`rounded-2xl border p-4 text-center ${c.slug === cmp.cheaper.slug ? "bg-emerald-50 border-emerald-200" : "bg-white border-stone-100"}`}>
                  <div className="font-black text-lg text-stone-800">{c.he}</div>
                  <div className={`font-mono font-black text-2xl mt-1 ${c.slug === cmp.cheaper.slug ? "text-emerald-600" : "text-stone-600"}`}>₪{total.toFixed(2)}</div>
                  <div className="text-xs text-stone-400 mt-1">הכי זול ב-{wins} מוצרים{stores ? ` · ${stores} סניפים` : ""}</div>
                  {c.slug === cmp.cheaper.slug && <div className="text-[11px] font-bold text-emerald-600 mt-1">✓ הזולה יותר</div>}
                </div>
              ))}
            </section>

            <section className="mb-6">
              <h2 className="font-black text-lg text-stone-800 mb-3">השוואה מוצר-מוצר</h2>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 text-xs">
                      <th className="text-right p-3 font-semibold">מוצר</th>
                      <th className="text-center p-3 font-semibold">{a.he}</th>
                      <th className="text-center p-3 font-semibold">{b.he}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmp.rows.map((r) => (
                      <tr key={r.product_id} className="border-b border-stone-50 last:border-0">
                        <td className="p-3 text-stone-700">
                          <a href={`/product/${r.product_id}`} className="hover:text-emerald-600 hover:underline">{r.name}</a>
                        </td>
                        <td className={`p-3 text-center font-mono font-bold ${r.priceA < r.priceB ? "text-emerald-600" : "text-stone-500"}`}>₪{r.priceA.toFixed(2)}</td>
                        <td className={`p-3 text-center font-mono font-bold ${r.priceB < r.priceA ? "text-emerald-600" : "text-stone-500"}`}>₪{r.priceB.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-50 font-black">
                      <td className="p-3 text-stone-800">סה"כ הסל</td>
                      <td className={`p-3 text-center font-mono ${cmp.totalA <= cmp.totalB ? "text-emerald-600" : "text-stone-600"}`}>₪{cmp.totalA.toFixed(2)}</td>
                      <td className={`p-3 text-center font-mono ${cmp.totalB < cmp.totalA ? "text-emerald-600" : "text-stone-600"}`}>₪{cmp.totalB.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                * המחיר לכל מוצר הוא הזול ביותר שנמצא ברשת (ללא סניפי אילת וללא חנויות אונליין). מוצרים שאינם נמכרים בשתי הרשתות לא נכללו.
              </p>
            </section>

            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed space-y-3">
              <h2 className="font-black text-lg text-stone-800">שאלות נפוצות</h2>
              <div>
                <h3 className="font-bold text-stone-700">מה יותר זול — {a.he} או {b.he}?</h3>
                <p>{cmp.cheaper.he} זולה יותר ב-₪{cmp.diff.toFixed(2)} ({cmp.diffPct.toFixed(1)}%) על סל של {cmp.rows.length} מוצרי יסוד, נכון ל-{today}.</p>
              </div>
              <div>
                <h3 className="font-bold text-stone-700">כמה אפשר לחסוך בחודש?</h3>
                <p>משפחה שמוציאה כ-4,000 ₪ בחודש על קניות יכולה לחסוך בהערכה כ-₪{Math.round(4000 * cmp.diffPct / 100)} בחודש במעבר ל{cmp.cheaper.he} — ועוד יותר עם <a href="/online" className="text-emerald-600 hover:underline">השוואת סל מלא ב-Savy</a>.</p>
              </div>
            </section>
          </>
        ) : (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
            <p>
              אין כרגע מספיק נתוני סל משותפים בין {a.he} ל{b.he} להשוואה ישירה.
              אפשר לראות את המחירים של כל רשת בנפרד או להשוות סל אישי ב<a href="/online" className="text-emerald-600 hover:underline">השוואת סל קניות</a>.
            </p>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 mb-8">
          <a href={`/chain/${encodeURIComponent(a.name)}`} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">כל המחירים והמבצעים של {a.he} ←</div>
          </a>
          <a href={`/chain/${encodeURIComponent(b.name)}`} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">כל המחירים והמבצעים של {b.he} ←</div>
          </a>
        </section>

        {otherPairs.length > 0 && (
          <section>
            <h2 className="font-black text-lg text-stone-800 mb-3">השוואות נוספות</h2>
            <div className="flex flex-wrap gap-2">
              {otherPairs.map((p) => (
                <a key={p.slug} href={`/compare/${p.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                  {p.a.he} מול {p.b.he}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
