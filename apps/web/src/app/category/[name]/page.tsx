import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

async function getProducts(name: string) {
  try {
    const res = await fetch(`${API}/category/${encodeURIComponent(name)}/products?page=0`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  const products = await getProducts(name);
  const count = products.length;
  const minPrice = count > 0 ? Math.min(...products.map((p: any) => Number(p.minPrice)).filter(Boolean)) : null;
  const countStr = count > 0 ? `${count}+ מוצרים` : "";
  const priceStr = minPrice ? ` החל מ-₪${minPrice.toFixed(2)}` : "";
  const description = `השווה מחירי ${name} ב-25+ רשתות סופרמרקט בישראל. ${countStr}${priceStr} — עדכון יומי, מצא את הזול ביותר.`;
  return {
    title: `${name} | השוואת מחירים בסופר | Savy`,
    description,
    alternates: { canonical: `/category/${encodeURIComponent(name)}` },
    openGraph: {
      title: `${name} | השוואת מחירים בסופר | Savy`,
      description,
      url: `https://savy.co.il/category/${encodeURIComponent(name)}`,
      siteName: "Savy", locale: "he_IL", type: "website",
    },
  };
}

export default async function CategoryPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const initialProducts = await getProducts(name);
  return <CategoryClient name={name} initialProducts={initialProducts} />;
}
