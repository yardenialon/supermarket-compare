import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סריקת קבלה מהסופר | בדקו כמה יכולתם לחסוך | Savy",
  description:
    "סרקו קבלה מהסופרמרקט וגלו תוך שניות כמה הייתם חוסכים על אותו סל ברשתות אחרות. כלי חינמי מבוסס נתוני שקיפות מחירים.",
  alternates: { canonical: "https://savy.co.il/receipt" },
  openGraph: {
    title: "סריקת קבלה מהסופר — כמה יכולתם לחסוך? | Savy",
    description: "סרקו קבלה וגלו כמה הייתם חוסכים על אותו סל קניות ברשתות אחרות.",
    url: "https://savy.co.il/receipt",
    siteName: "Savy",
    locale: "he_IL",
    type: "website",
  },
};

export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
