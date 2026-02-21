import './globals.css';
import { ReactNode } from 'react';
import Script from 'next/script';

export const metadata = {
  title: 'Savy — השוואת מחירי סופרמרקט',
  description: 'משווים מחירים מכל רשתות השיווק בישראל. חוסכים בקליק.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&family=Heebo:wght@300..800&display=swap" rel="stylesheet" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-67LW5LMRZF" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-67LW5LMRZF');
        `}</Script>
      </head>
      <body className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center">
            <a href="/"><img src="/icons/savy-logo.png" alt="Savy" className="h-10 object-contain" /></a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t bg-white/50 mt-12 py-8 text-center">
          <div className="text-xs text-stone-300">מחירים מתעדכנים יומית מנתוני שקיפות מחירים 🇮🇱</div>
          <div className="text-[10px] text-stone-200 mt-1">Savy — כי מגיע לכם לדעת</div>
        </footer>
      </body>
    </html>
  );
}
