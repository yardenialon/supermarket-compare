'use client';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ id: number; phone: string; name?: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  }

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
