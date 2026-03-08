import './globals.css';
import PWAInstall from '../components/PWAInstall';
import dynamic from 'next/dynamic';
const AccessibilityWidget = dynamic(() => import('@/components/AccessibilityWidget'), { ssr: false });
import { ReactNode } from 'react';
import Header from '@/components/Header';
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
        <PWAInstall />
        <footer className="border-t bg-white/50 mt-12 py-8 text-center">
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
