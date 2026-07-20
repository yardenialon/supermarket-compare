// Registry for /guides content hub — shared by the hub page, sitemap and footer.
export interface GuideInfo {
  slug: string;
  title: string;       // H1 / display title
  seoTitle: string;    // <title> targeting the search phrase
  description: string;
  emoji: string;
  targetQuery: string; // primary search phrase, for internal tracking
  datePublished: string;
}

export const GUIDES: GuideInfo[] = [
  {
    slug: "cheapest-supermarket",
    title: "איזה סופר הכי זול בישראל?",
    seoTitle: "איזה סופר הכי זול בישראל? הדירוג המלא לפי נתונים | Savy",
    description: "דירוג רשתות הסופרמרקט מהזולה ליקרה, על בסיס סל מוצרי יסוד אמיתי ונתוני שקיפות מחירים — מתעדכן יומית.",
    emoji: "🏆",
    targetQuery: "איזה סופר הכי זול",
    datePublished: "2026-07-20",
  },
  {
    slug: "basic-basket-cost",
    title: "כמה עולה סל קניות בסיסי למשפחה?",
    seoTitle: "כמה עולה סל קניות בסיסי? מחירים אמיתיים | Savy",
    description: "כמה באמת עולה סל מוצרי היסוד בישראל, מה ההפרש בין הרשת הזולה ליקרה, וכמה משפחה יכולה לחסוך — נתונים חיים.",
    emoji: "🛒",
    targetQuery: "כמה עולה סל קניות בסיסי",
    datePublished: "2026-07-20",
  },
  {
    slug: "cheapest-diapers",
    title: "איפה הכי זול לקנות חיתולים?",
    seoTitle: "איפה הכי זול לקנות חיתולים? השוואת מחירים | Savy",
    description: "השוואת מחירי חיתולים בין כל רשתות הסופרמרקט והפארם, איך לחשב מחיר לחיתול, וכמה אפשר לחסוך בשנה — מחירים חיים.",
    emoji: "👶",
    targetQuery: "איפה הכי זול לקנות חיתולים",
    datePublished: "2026-07-20",
  },
  {
    slug: "price-controlled-products",
    title: "מוצרים בפיקוח מחירים — הרשימה המלאה",
    seoTitle: "מוצרים בפיקוח מחירים 2026 — הרשימה המלאה והמחירים | Savy",
    description: "אילו מוצרים נמצאים בפיקוח מחירים ממשלתי, מה המחיר המרבי החוקי שלהם, וכמה הם עולים בפועל ברשתות — מעודכן 2026.",
    emoji: "⚖️",
    targetQuery: "מוצרים בפיקוח מחירים",
    datePublished: "2026-07-20",
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

// shared schema.org builders
export function guideJsonLd(g: GuideInfo, faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: g.title,
        description: g.description,
        datePublished: g.datePublished,
        dateModified: new Date().toISOString().split("T")[0],
        inLanguage: "he",
        author: { "@id": "https://savy.co.il/#organization" },
        publisher: { "@id": "https://savy.co.il/#organization" },
        mainEntityOfPage: `https://savy.co.il/guides/${g.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ראשי", item: "https://savy.co.il" },
          { "@type": "ListItem", position: 2, name: "מדריכים", item: "https://savy.co.il/guides" },
          { "@type": "ListItem", position: 3, name: g.title, item: `https://savy.co.il/guides/${g.slug}` },
        ],
      },
      ...(faq.length ? [{
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }] : []),
    ],
  };
}

export function guideMetadata(g: GuideInfo) {
  return {
    title: g.seoTitle,
    description: g.description,
    alternates: { canonical: `https://savy.co.il/guides/${g.slug}` },
    openGraph: {
      title: g.seoTitle, description: g.description,
      url: `https://savy.co.il/guides/${g.slug}`,
      siteName: "Savy", locale: "he_IL", type: "article",
    },
    twitter: { card: "summary_large_image" as const, title: g.seoTitle, description: g.description },
  };
}
