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
  return {
    title: `${name} | השוואת מחירים | Savy`,
    description: `השווה מחירי ${name} ב-25+ רשתות סופרמרקט בישראל. מצא את המחיר הזול ביותר על מוצרי ${name} — עדכון יומי.`,
    alternates: { canonical: `/category/${encodeURIComponent(name)}` },
    openGraph: {
      title: `${name} | השוואת מחירים | Savy`,
      description: `השווה מחירי ${name} ב-25+ רשתות סופרמרקט בישראל.`,
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
