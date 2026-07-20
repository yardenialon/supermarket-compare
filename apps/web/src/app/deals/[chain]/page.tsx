import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chainBySlug, MAJOR_CHAINS } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

interface Deal {
  promotionId: number;
  description: string | null;
  discountedPrice: number | null;
  discountRate: number | null;
  minQty: number | null;
  endDate: string | null;
  isClubOnly: boolean;
  chainName: string;
  storeName: string | null;
  productId: number | null;
  productName: string | null;
  imageUrl: string | null;
  regularPrice: number | null;
  category: string | null;
}

async function getDeals(chainName: string): Promise<{ deals: Deal[]; total: number }> {
  try {
    const res = await fetch(`${API}/deals?chain=${encodeURIComponent(chainName)}&limit=48`, { next: { revalidate: 3600 } });
    if (!res.ok) return { deals: [], total: 0 };
    const data = await res.json();
    return { deals: data.deals ?? [], total: data.total ?? 0 };
  } catch { return { deals: [], total: 0 }; }
}

export async function generateMetadata({ params }: { params: { chain: string } }): Promise<Metadata> {
  const chain = chainBySlug(params.chain);
  if (!chain) return { title: "מבצעים | Savy" };
  const { total } = await getDeals(chain.name);
  const countStr = total > 0 ? `${total} מבצעים פעילים` : "כל המבצעים";
  const title = `מבצעים ב${chain.he} השבוע | ${countStr} | Savy`;
  const description = `כל המבצעים של ${chain.he} במקום אחד — ${countStr}, כולל 1+1, מולטי-פאק ומבצעי מועדון. מתעדכן יומית מנתוני שקיפות המחירים.`;
  return {
    title, description,
    alternates: { canonical: `https://savy.co.il/deals/${params.chain}` },
    openGraph: { title, description, url: `https://savy.co.il/deals/${params.chain}`, siteName: "Savy", locale: "he_IL", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ChainDealsPage({ params }: { params: { chain: string } }) {
  const chain = chainBySlug(params.chain);
  if (!chain) notFound();
  const { deals, total } = await getDeals(chain.name);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const itemList = deals.length > 0 && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `מבצעים ב${chain.he}`,
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 20).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.description ?? d.productName ?? "מבצע",
      ...(d.productId && { url: `https://savy.co.il/product/${d.productId}` }),
    })),
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      {itemList && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />}
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a>
          <span className="mx-1">›</span>
          <a href="/deals" className="hover:text-emerald-600">מבצעים</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">{chain.he}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-3">מבצעים ב{chain.he} השבוע</h1>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
          <p>
            {total > 0
              ? <>ב{chain.he} יש כרגע <strong>{total} מבצעים פעילים</strong> — כולל מבצעי 1+1, מולטי-פאק ומבצעי מועדון. הרשימה מבוססת על נתוני שקיפות המחירים הרשמיים ומתעדכנת יומית. נכון ל-{today}.</>
              : <>לא נמצאו כרגע מבצעים פעילים ב{chain.he}. שווה לבדוק שוב מחר — הנתונים מתעדכנים יומית.</>}
            {" "}רוצים לדעת אם {chain.he} משתלמת גם בלי מבצעים? ראו את <a href={`/chain/${encodeURIComponent(chain.name)}`} className="text-emerald-600 hover:underline">עמוד הרשת</a> או <a href="/compare" className="text-emerald-600 hover:underline">השוו אותה לרשת אחרת</a>.
          </p>
        </section>

        {deals.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-8">
            {deals.map((d) => (
              <div key={d.promotionId} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 flex flex-col gap-1.5">
                <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                  {d.imageUrl
                    ? <img src={d.imageUrl} alt={d.productName ?? d.description ?? ""} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                    : <span className="text-3xl">🏷️</span>}
                </div>
                <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{d.description ?? d.productName}</div>
                {d.discountedPrice != null && (
                  <div className="font-mono font-black text-emerald-600 text-sm">
                    ₪{Number(d.discountedPrice).toFixed(2)}
                    {d.minQty && d.minQty > 1 ? <span className="text-[10px] text-stone-400 font-sans"> ב-{d.minQty} יח׳</span> : null}
                  </div>
                )}
                {d.isClubOnly && <div className="text-[10px] text-amber-600 font-bold">מועדון בלבד</div>}
                {d.productId && (
                  <a href={`/product/${d.productId}`} className="text-[11px] text-emerald-600 hover:underline font-semibold mt-auto">להשוואת מחירים ←</a>
                )}
              </div>
            ))}
          </div>
        )}

        <section>
          <h2 className="font-black text-lg text-stone-800 mb-3">מבצעים ברשתות נוספות</h2>
          <div className="flex flex-wrap gap-2">
            {MAJOR_CHAINS.filter((c) => c.slug !== chain.slug).map((c) => (
              <a key={c.slug} href={`/deals/${c.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                מבצעים ב{c.he}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
