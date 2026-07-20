import './globals.css';
import PWAInstall from '../components/PWAInstall';
import dynamic from 'next/dynamic';
const AccessibilityWidget = dynamic(() => import('@/components/AccessibilityWidget'), { ssr: false });
import { ReactNode } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Script from 'next/script';

// Facebook domain verification added to head via metadata
export const metadata = {
  title: 'Savy | השוואת מחירי סופרמרקט בישראל | 25+ רשתות',
  description: 'השווה מחירי מוצרים ב-25+ רשתות סופרמרקט — שופרסל, רמי לוי, ויקטורי ועוד. 7.5 מיליון מחירים, עדכון יומי. מצא את המחיר הזול ביותר ליד הבית.',
  verification: {
    other: {
      'facebook-domain-verification': 'i7he4816sezg5iu67dxslrlowfyu1y',
    },
  },
  openGraph: {
    title: 'Savy | השוואת מחירי סופרמרקט בישראל | 25+ רשתות',
    description: 'השווה מחירי מוצרים ב-25+ רשתות סופרמרקט — שופרסל, רמי לוי, ויקטורי ועוד. 7.5 מיליון מחירים, עדכון יומי. מצא את המחיר הזול ביותר ליד הבית.',
    url: 'https://savy.co.il',
    siteName: 'Savy',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Savy - השוואת מחירי סופרמרקט' }],
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Savy | השוואת מחירי סופרמרקט בישראל | 25+ רשתות',
    description: 'השווה מחירי מוצרים ב-25+ רשתות סופרמרקט — שופרסל, רמי לוי, ויקטורי ועוד. 7.5 מיליון מחירים, עדכון יומי. מצא את המחיר הזול ביותר ליד הבית.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icons/favicon.png', type: 'image/png' },
    ],
    apple: '/icons/favicon.png',
    shortcut: '/icons/favicon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#10b981',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Savy',
  },
};

const FOOTER_CATEGORIES = [
  "מוצרי חלב", "לחם ומאפה", "בשר ועוף", "ירקות ופירות", "משקאות", "חטיפים וממתקים",
  "שימורים ומזון יבש", "מוצרים קפואים", "ניקיון ובית", "היגיינה ויופי", "מוצרי תינוקות", "מזון לחיות מחמד",
];

const FOOTER_CHAINS = [
  { name: "Shufersal", he: "שופרסל", slug: "shufersal" },
  { name: "Rami Levy", he: "רמי לוי", slug: "rami-levy" },
  { name: "Osher Ad", he: "אושר עד", slug: "osher-ad" },
  { name: "Victory", he: "ויקטורי", slug: "victory" },
  { name: "Carrefour", he: "קרפור", slug: "carrefour" },
  { name: "Yochananof", he: "יוחננוף", slug: "yochananof" },
  { name: "Tiv Taam", he: "טיב טעם", slug: "tiv-taam" },
  { name: "Hazi Hinam", he: "חצי חינם", slug: "hazi-hinam" },
];

const FOOTER_CITIES = [
  { slug: "tel-aviv", he: "תל אביב" },
  { slug: "jerusalem", he: "ירושלים" },
  { slug: "haifa", he: "חיפה" },
  { slug: "beer-sheva", he: "באר שבע" },
  { slug: "rishon-lezion", he: "ראשון לציון" },
  { slug: "petah-tikva", he: "פתח תקווה" },
  { slug: "netanya", he: "נתניה" },
  { slug: "ashdod", he: "אשדוד" },
];

const FOOTER_PAGES = [
  { href: "/category", label: "כל הקטגוריות" },
  { href: "/compare", label: "השוואת רשתות — מי יותר זול?" },
  { href: "/prices", label: "כמה עולה? מחירי מוצרי יסוד" },
  { href: "/deals", label: "מבצעים" },
  { href: "/price-index", label: "מדד מחירי סופרמרקט" },
  { href: "/supermarkets", label: "רשתות הסופרמרקט בישראל" },
  { href: "/online", label: "השוואת סל קניות אונליין" },
  { href: "/guides", label: "מדריכי חיסכון בקניות" },
  { href: "/guide", label: "מדריך השוואת מחירים" },
  { href: "/hashvatat-mekhirim-mazon", label: "השוואת מחירים מזון" },
  { href: "/produce", label: "מחירי ירקות ופירות" },
];

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://savy.co.il/#organization",
      name: "Savy",
      url: "https://savy.co.il",
      logo: "https://savy.co.il/icons/savy-logo.png",
      email: "info@savy.co.il",
      sameAs: [
        "https://www.facebook.com/profile.php?id=61588513298725",
        "https://www.instagram.com/savy.co.il",
        "https://www.tiktok.com/@savy.co.il",
        "https://www.youtube.com/@SAVYCOIL",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://savy.co.il/#website",
      url: "https://savy.co.il",
      name: "Savy — השוואת מחירי סופרמרקט בישראל",
      description: "השוואת מחירי מוצרים ב-25+ רשתות סופרמרקט בישראל. 7.5 מיליון מחירים, עדכון יומי.",
      inLanguage: "he",
      publisher: { "@id": "https://savy.co.il/#organization" },
    },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>

        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-67LW5LMRZF" strategy="afterInteractive" />
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
          }
        `}</Script>
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-67LW5LMRZF');
        `}</Script>
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5786695693273761" crossorigin="anonymous"></script>
    </head>
      <body className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <PWAInstall />
      <BottomNav />
        <footer className="border-t bg-white/50 mt-12 py-8 text-center">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
          <div className="max-w-5xl mx-auto px-4 text-right grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <nav aria-label="קטגוריות">
              <div className="text-xs font-bold text-stone-500 mb-2">השוואת מחירים לפי קטגוריה</div>
              <ul className="space-y-1">
                {FOOTER_CATEGORIES.map((c) => (
                  <li key={c}>
                    <a href={`/category/${encodeURIComponent(c)}`} className="text-xs text-stone-400 hover:text-emerald-600 transition">{c}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="רשתות">
              <div className="text-xs font-bold text-stone-500 mb-2">מחירים לפי רשת</div>
              <ul className="space-y-1">
                {FOOTER_CHAINS.map((c) => (
                  <li key={c.name} className="flex gap-2">
                    <a href={`/chain/${encodeURIComponent(c.name)}`} className="text-xs text-stone-400 hover:text-emerald-600 transition">מחירי {c.he}</a>
                    <span className="text-stone-200 text-xs">·</span>
                    <a href={`/deals/${c.slug}`} className="text-xs text-stone-400 hover:text-emerald-600 transition">מבצעים</a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="ערים">
              <div className="text-xs font-bold text-stone-500 mb-2">סופרמרקט זול לפי עיר</div>
              <ul className="space-y-1">
                {FOOTER_CITIES.map((c) => (
                  <li key={c.slug}>
                    <a href={`/supermarkets/${c.slug}`} className="text-xs text-stone-400 hover:text-emerald-600 transition">סופרמרקט זול ב{c.he}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="כלים ומדריכים">
              <div className="text-xs font-bold text-stone-500 mb-2">כלים ומדריכים</div>
              <ul className="space-y-1">
                {FOOTER_PAGES.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} className="text-xs text-stone-400 hover:text-emerald-600 transition">{p.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="text-xs text-stone-300">מחירים מתעדכנים יומית מנתוני שקיפות מחירים 🇮🇱</div>
          <div className="text-[10px] text-stone-200 mt-1">Savy — כי מגיע לכם לדעת</div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-stone-300">
            <a href="/terms" className="hover:text-stone-500 transition-colors">תנאי שימוש</a>
            <span>·</span>
            <a href="/accessibility" className="hover:text-stone-500 transition-colors">הצהרת נגישות</a>
            <span>·</span>
            <a href="mailto:info@savy.co.il" className="hover:text-stone-500 transition-colors">info@savy.co.il</a>
            <span>·</span>
            <span>© 2026 Savy</span>
          </div>
        </footer>
        <AccessibilityWidget />
      </body>
    </html>
  );
}
