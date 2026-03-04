import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

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

export default function CategoryPage({ params }: { params: { name: string } }) {
  return <CategoryClient name={decodeURIComponent(params.name)} />;
}
