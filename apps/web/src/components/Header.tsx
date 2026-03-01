'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import AuthModal from './AuthModal';

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, setUser, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="w-24" />
          <a href="/"><img src="/icons/savy-logo.png" alt="Savy" className="h-10 object-contain" /></a>
          <div className="w-24 flex justify-end">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">{user.phone}</span>
                <button onClick={logout} className="text-xs text-stone-400 hover:text-red-500 transition">
                  יציאה
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                כניסה
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}
    </>
  );
}
