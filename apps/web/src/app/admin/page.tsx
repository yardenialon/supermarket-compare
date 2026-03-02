'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
const ADMIN_KEY = 'savy-admin-2024';

interface Product { id: number; barcode: string; name: string; store_count: number; min_price: number; image_url?: string; }

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  function login() {
    if (password === ADMIN_KEY) {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('סיסמא שגויה');
    }
  }

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(offset), limit: '20', search, showAll: String(showAll) });
      const res = await fetch(`${API}/admin/products-missing-images?${params}`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, showAll, authed]);

  useEffect(() => { load(); }, [load]);

  async function saveImage(productId: number) {
    const url = imageUrls[productId];
    if (!url) return;
    await fetch(`${API}/admin/update-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ productId, imageUrl: url })
    });
    setSaved(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setProducts(prev => prev.filter((p) => p.id !== productId));
    }, 1000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-6 text-center">Admin</h1>
          <input
            type="password"
            placeholder="סיסמא"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full border border-stone-200 rounded-xl px-4 py-3 mb-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            autoFocus
          />
          {authError && <p className="text-red-500 text-sm text-center mb-3">{authError}</p>}
          <button
            onClick={login}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
          >
            כניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-800">עדכון תמונות</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => { setShowAll(e.target.checked); setOffset(0); }}
                className="rounded"
              />
              הצג גם מוצרים עם תמונה
            </label>
            <span className="text-sm text-stone-400">{total.toLocaleString()} מוצרים</span>
          </div>
        </div>
        <input
          type="text"
          placeholder="חיפוש לפי שם או ברקוד..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 mb-6 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {loading ? (
          <div className="text-center py-20 text-stone-400">טוען...</div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                  {(imageUrls[p.id] || p.image_url) ? (
                    <img src={imageUrls[p.id] || p.image_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 truncate">{p.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">ברקוד: {p.barcode} · {p.store_count} חנויות</div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      placeholder="הדבק URL של תמונה..."
                      value={imageUrls[p.id] || ''}
                      onChange={(e) => setImageUrls((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    
                      href={`https://www.google.com/search?q=${encodeURIComponent(p.barcode + ' ' + p.name)}&tbm=isch`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition whitespace-nowrap"
                    >
                      גוגל
                    </a>
                    <button
                      onClick={() => saveImage(p.id)}
                      disabled={!imageUrls[p.id] || saved[p.id]}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-40 transition whitespace-nowrap"
                    >
                      {saved[p.id] ? 'נשמר' : 'שמור'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הקודם</button>
          <span className="px-4 py-2 text-sm text-stone-500">{Math.floor(offset / 20) + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הבא</button>
        </div>
      </div>
    </div>
  );
}
