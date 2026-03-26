import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "השוואת סל קניות אונליין 2026 | השווה בין כל הרשתות – Savy",
  description:
    "השוואת סל קניות אונליין בין שופרסל, רמי לוי, ויקטורי, מגה ועוד. הכניסו רשימת קניות וגלו היכן הכי זול — בזמן אמת, חינם לחלוטין.",
  keywords: [
    "השוואת סל קניות אונליין",
    "סל קניות אונליין",
    "השוואת מחירים אונליין",
    "קניות אונליין זול",
    "השוואת סל קניות",
    "סופרמרקט אונליין זול",
    "savy השוואת סל",
  ],
  alternates: { canonical: "https://savy.co.il/online" },
  openGraph: {
    title: "השוואת סל קניות אונליין – Savy",
    description: "הכניסו רשימת קניות וגלו היכן הכי זול לקנות אונליין בישראל.",
    url: "https://savy.co.il/online",
    siteName: "Savy",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "השוואת סל קניות אונליין – Savy",
    description: "השווה סל קניות בין כל הרשתות — חינם ובזמן אמת.",
  },
};

export default function OnlineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
