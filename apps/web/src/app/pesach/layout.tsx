import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סל קניות לפסח | השוואת מחירי מוצרי ניקיון וחג | Savy",
  description:
    "מתכוננים לפסח? השוו מחירים על סל מוצרי ניקיון וסדר פסח בין כל רשתות הסופרמרקט בישראל וגלו איפה הכי זול להתארגן לחג.",
  alternates: { canonical: "https://savy.co.il/pesach" },
  openGraph: {
    title: "סל קניות לפסח — השוואת מחירים | Savy",
    description: "השוואת מחירי סל ניקיון וסדר פסח בין כל רשתות הסופרמרקט בישראל.",
    url: "https://savy.co.il/pesach",
    siteName: "Savy",
    locale: "he_IL",
    type: "website",
  },
};

export default function PesachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
