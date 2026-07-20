import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מבצעים בסופר היום | כל המבצעים ברשתות הסופרמרקט | Savy",
  description:
    "כל המבצעים בסופרמרקטים בישראל במקום אחד — שופרסל, רמי לוי, ויקטורי, אושר עד, קרפור ועוד. מבצעי 1+1, מולטי-פאק והנחות — מתעדכן יומית.",
  alternates: { canonical: "https://savy.co.il/deals" },
  openGraph: {
    title: "מבצעים בסופר היום — כל הרשתות | Savy",
    description: "מבצעים חמים מכל רשתות הסופרמרקט בישראל, מתעדכן יומית. מצאו את המבצע הכי משתלם ליד הבית.",
    url: "https://savy.co.il/deals",
    siteName: "Savy",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "מבצעים בסופר היום — כל הרשתות | Savy",
    description: "מבצעים חמים מכל רשתות הסופרמרקט בישראל, מתעדכן יומית.",
  },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
