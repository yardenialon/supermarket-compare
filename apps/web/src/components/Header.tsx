'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import AuthModal from './AuthModal';
import dynamic from 'next/dynamic';
const HamburgerMenu = dynamic(() => import('./HamburgerMenu'), { ssr: false });

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, setUser, logout } = useAuth();

  const initials = (user as any)?.name
    ? (user as any).name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
    : ((user as any)?.phone || '?')[0];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl"
        style={{ borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* שמאל — פרופיל / כניסה */}
          <div className="w-28 flex justify-start">
            {user ? (
              <div className="flex items-center gap-2">
                {(user as any).picture ? (
                  <img
                    src={(user as any).picture}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ outline: '2px solid #d1fae5', outlineOffset: '1px' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                  >
                    {initials}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  יציאה
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2" />
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
              className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-colors hover:bg-emerald-50 active:bg-emerald-100"
              aria-label="תפריט"
            >
              <span className="w-5 h-[2px] rounded-full bg-gray-600 transition-colors" />
              <span className="w-3.5 h-[2px] rounded-full bg-gray-400 transition-colors" />
              <span className="w-5 h-[2px] rounded-full bg-gray-600 transition-colors" />
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
