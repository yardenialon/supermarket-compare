// apps/web/src/app/product/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/product/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getPrices(id: string) {
  try {
    const res = await fetch(`${API}/product/${id}/prices?limit=60`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.prices ?? [];
  } catch { return []; }
}

async function getRelated(category: string | null, brand: string | null, excludeId: string) {
  if (!category) return [];
  try {
    const res = await fetch(`${API}/category/${encodeURIComponent(category)}/products?page=0`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const products = (data.products ?? []).filter((p: any) => String(p.id) !== String(excludeId));
    // same-brand products first, then the rest of the category
    const sameBrand = brand ? products.filter((p: any) => p.brand === brand) : [];
    const rest = products.filter((p: any) => !sameBrand.includes(p));
    return [...sameBrand, ...rest].slice(0, 10);
  } catch { return []; }
}

const isKnownBrand = (brand?: string | null) => !!brand && brand !== "לא ידוע" && brand.toLowerCase() !== "unknown";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "מוצר לא נמצא | Savy" };

  const { name, brand, category, barcode, minPrice, storeCount, imageUrl } = product;
  const brandStr  = isKnownBrand(brand) ? ` של ${brand}`                 : "";
  const priceStr  = minPrice  ? ` החל מ-₪${Number(minPrice).toFixed(2)}` : "";
  const storesStr = storeCount? ` ב-${storeCount} חנויות`                : "";
  const catStr    = category  ? ` | ${category}`                         : "";
  const title       = `${name}${brandStr}${catStr} | מחיר | Savy`;
  const description = `השווה מחירי ${name}${brandStr}${storesStr}${priceStr}. עדכון יומי — מצא את המחיר הזול ביותר בכל הסופרמרקטים.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${params.id}` },
    openGraph: {
      title, description,
      url: `https://savy.co.il/product/${params.id}`,
      siteName: "Savy", locale: "he_IL", type: "website",
      ...(imageUrl && { images: [{ url: imageUrl, width: 600, height: 600, alt: name }] }),
    },
    twitter: {
      card: "summary_large_image", title, description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

function ProductJsonLd({ product, prices, id }: { product: any; prices: any[]; id: string }) {
  const { name, brand, category, barcode, imageUrl } = product;
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => Number(p.price))) : null;
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name,
    url: `https://savy.co.il/product/${id}`,
    ...(imageUrl && { image: imageUrl }),
    ...(brand    && { brand: { "@type": "Brand", name: brand } }),
    ...(category && { category }),
    ...(barcode  && { gtin13: barcode }),
    offers: {
      "@type": "AggregateOffer",
      lowPrice: minPrice != null ? minPrice.toFixed(2) : "0",
      highPrice: minPrice != null ? Math.max(...prices.map((p: any) => Number(p.price))).toFixed(2) : "0",
      priceCurrency: "ILS",
      offerCount: prices.length || 1,
      availability: "https://schema.org/InStock",
      ...(prices.length > 0 && {
        offers: prices.slice(0, 10).map((p: any) => ({
          "@type": "Offer", price: Number(p.price).toFixed(2), priceCurrency: "ILS",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: p.storeName ?? p.chainName },
        })),
      }),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ראשי", item: "https://savy.co.il" },
      ...(category ? [{ "@type": "ListItem", position: 2, name: category, item: `https://savy.co.il/category/${encodeURIComponent(category)}` }] : []),
      { "@type": "ListItem", position: category ? 3 : 2, name, item: `https://savy.co.il/product/${id}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

function PriceSummary({ product, prices }: { product: any; prices: any[] }) {
  if (!prices.length) return null;
  const { name, brand } = product;
  const nums = prices.map((p: any) => Number(p.price));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const cheapest = prices.find((p: any) => Number(p.price) === min);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const brandStr = isKnownBrand(brand) ? ` של ${brand}` : "";
  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 mt-4 text-sm text-stone-600 leading-relaxed">
      <h2 className="font-bold text-stone-800 mb-1">כמה עולה {name}?</h2>
      <p>
        {name}{brandStr} עולה בין ₪{min.toFixed(2)} ל-₪{max.toFixed(2)} ברשתות הסופרמרקט בישראל.
        המחיר הזול ביותר — ₪{min.toFixed(2)}{cheapest?.chainName ? ` ב${cheapest.storeName ?? cheapest.chainName}` : ""} —
        מתוך השוואה של {prices.length} חנויות. הנתונים מבוססים על מאגר שקיפות המחירים הממשלתי, נכון ל-{today}.
      </p>
    </section>
  );
}

function RelatedProducts({ products, category }: { products: any[]; category: string | null }) {
  if (!products.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-black text-lg text-stone-800 mb-3">מוצרים דומים{category ? ` ב${category}` : ""}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {products.map((p) => (
          <a key={p.id} href={`/product/${p.id}`}
            className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 hover:shadow-md transition flex flex-col gap-1.5">
            <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                : <span className="text-3xl">📦</span>}
            </div>
            <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{p.name}</div>
            {p.minPrice && <div className="font-mono font-black text-emerald-600 text-sm">₪{Number(p.minPrice).toFixed(2)}</div>}
          </a>
        ))}
      </div>
      {category && (
        <a href={`/category/${encodeURIComponent(category)}`} className="inline-block mt-3 text-sm font-semibold text-emerald-600 hover:underline">
          לכל המוצרים בקטגוריית {category} ←
        </a>
      )}
    </section>
  );
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, prices] = await Promise.all([getProduct(params.id), getPrices(params.id)]);
  if (!product) notFound();
  const related = await getRelated(product.category ?? null, product.brand ?? null, params.id);
  return (
    <>
      <ProductJsonLd product={product} prices={prices} id={params.id} />
      <ProductPageClient product={product} initialPrices={prices} id={params.id} />
      <div className="max-w-3xl mx-auto px-4">
        <PriceSummary product={product} prices={prices} />
        <RelatedProducts products={related} category={product.category ?? null} />
      </div>
    </>
  );
}
