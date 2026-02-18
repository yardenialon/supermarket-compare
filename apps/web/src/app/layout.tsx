import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'סל חכם — השוואת מחירים בסופרים',
  description: 'משווים מחירים ב-18 רשתות שיווק בישראל. מוצאים את הסל הכי זול באזור שלכם.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&family=Heebo:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition">
                <span className="text-white text-xl">🛒</span>
              </div>
              <div>
                <div className="font-black text-xl text-stone-800 tracking-tight">סל חכם</div>
                <div className="text-[10px] text-stone-400 font-medium tracking-wide">השוואת מחירים · 18 רשתות</div>
              </div>
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t bg-white/50 mt-12 py-8 text-center">
          <div className="text-xs text-stone-300">מחירים מתעדכנים יומית מנתוני שקיפות מחירים 🇮🇱</div>
          <div className="text-[10px] text-stone-200 mt-1">סל חכם — כי מגיע לכם לדעת</div>
        </footer>
      </body>
    </html>
  );
}
