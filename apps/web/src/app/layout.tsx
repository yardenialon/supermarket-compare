import './globals.css';
import { ReactNode } from 'react';
import Header from '@/components/Header';
import Script from 'next/script';

export const metadata = {
  title: 'Savy | השוואת מחירי סופרמרקט בישראל | 25+ רשתות',
  description: 'השווה מחירי מוצרים ב-25+ רשתות סופרמרקט — שופרסל, רמי לוי, ויקטורי ועוד. 7.5 מיליון מחירים, עדכון יומי. מצא את המחיר הזול ביותר ליד הבית.',
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
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>

        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-67LW5LMRZF" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-67LW5LMRZF');
        `}</Script>
      </head>
      <body className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t bg-white/50 mt-12 py-8 text-center">
          <div className="text-xs text-stone-300">מחירים מתעדכנים יומית מנתוני שקיפות מחירים 🇮🇱</div>
          <div className="text-[10px] text-stone-200 mt-1">Savy — כי מגיע לכם לדעת</div>
        </footer>
        <AccessibilityWidget />
      </body>
    </html>
  );
}
