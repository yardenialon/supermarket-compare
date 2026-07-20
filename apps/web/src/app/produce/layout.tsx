import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מחירי ירקות ופירות היום | השוואה בין כל הרשתות | Savy",
  description:
    "מחירי ירקות ופירות עדכניים בכל רשתות הסופרמרקט בישראל — עגבניות, מלפפונים, בננות, תפוחים ועוד. השוו וגלו איפה הכי זול לקנות היום.",
  alternates: { canonical: "https://savy.co.il/produce" },
  openGraph: {
    title: "מחירי ירקות ופירות היום — השוואה בין כל הרשתות | Savy",
    description: "מחירי ירקות ופירות עדכניים בכל רשתות הסופרמרקט בישראל. מתעדכן יומית.",
    url: "https://savy.co.il/produce",
    siteName: "Savy",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "מחירי ירקות ופירות היום | Savy",
    description: "איפה הכי זול לקנות ירקות ופירות היום? השוואה בין כל הרשתות.",
  },
};

export default function ProduceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
