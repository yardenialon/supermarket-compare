// apps/web/src/app/product/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/product/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getPrices(id: string) {
  try {
    const res = await fetch(`${API}/product/${id}/prices?limit=60`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.prices ?? [];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "מוצר לא נמצא | Savy" };

  const { name, brand, category, barcode, minPrice, storeCount, imageUrl } = product;
  const brandStr  = brand     ? ` של ${brand}`                           : "";
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
    ...(minPrice != null && {
      offers: {
        "@type": "AggregateOffer",
        lowPrice: minPrice.toFixed(2), priceCurrency: "ILS", offerCount: prices.length,
        offers: prices.slice(0, 10).map((p: any) => ({
          "@type": "Offer", price: Number(p.price).toFixed(2), priceCurrency: "ILS",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: p.storeName ?? p.chainName },
        })),
      },
    }),
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

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, prices] = await Promise.all([getProduct(params.id), getPrices(params.id)]);
  if (!product) notFound();
  return (
    <>
      <ProductJsonLd product={product} prices={prices} id={params.id} />
      <ProductPageClient product={product} initialPrices={pric      <ProductPageClient product={product} initialPrices={prices} id={params.id} />
    </>
  );
}
