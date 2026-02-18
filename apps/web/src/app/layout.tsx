import './globals.css';
import { ReactNode } from 'react';
export const metadata = { title: 'סל חכם', description: 'השוואת מחירים בסופרים' };
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-stone-50">
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <div className="font-bold text-lg">סל חכם</div>
              <div className="text-[10px] text-stone-400">השוואת מחירים · 18 רשתות</div>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t mt-12 py-6 text-center text-xs text-stone-300">מחירים מתעדכנים יומית 🇮🇱</footer>
      </body>
    </html>
  );
}
