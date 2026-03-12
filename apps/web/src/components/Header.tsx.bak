'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import AuthModal from './AuthModal';
import dynamic from 'next/dynamic';
const HamburgerMenu = dynamic(() => import('./HamburgerMenu'), { ssr: false });

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, setUser, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* שמאל — פרופיל / כניסה */}
          <div className="w-28 flex justify-start">
            {user ? (
              <div className="flex items-center gap-2">
                {(user as any).picture ? (
                  <img src={(user as any).picture} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {((user as any).name || user.phone || '?')[0]}
                  </div>
                )}
                <button onClick={logout} className="text-xs text-stone-400 hover:text-red-400 transition">
                  יציאה
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-emerald-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                </svg>
                כניסה
              </button>
            )}
          </div>

          {/* מרכז — לוגו */}
          <a href="/" className="absolute left-1/2 -translate-x-1/2">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-9 object-contain" />
          </a>

          {/* ימין — המבורגר */}
          <div className="w-28 flex justify-end">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-hamburger'))}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition"
              aria-label="תפריט"
            >
              <span className="w-5 h-0.5 bg-stone-600 rounded-full" />
              <span className="w-4 h-0.5 bg-stone-400 rounded-full" />
              <span className="w-5 h-0.5 bg-stone-600 rounded-full" />
            </button>
          </div>

        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}
      <HamburgerMenu />
    </>
  );
}
