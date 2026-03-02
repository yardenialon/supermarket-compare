import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';

export interface User {
  id: number;
  phone: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  async function syncCartToCloud(items: any[]) {
    if (!user) return;
    try {
      await fetch(`${API}/auth/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'הסל שלי', items }),
      });
    } catch {}
  }

  async function loadCartFromCloud(): Promise<any[] | null> {
    if (!user) return null;
    try {
      const res = await fetch(`${API}/auth/cart`, { credentials: 'include' });
      const data = await res.json();
      return data.cart?.items || null;
    } catch { return null; }
  }

  return { user, setUser, loading, logout, syncCartToCloud, loadCartFromCloud };
}
