'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
const ADMIN_KEY = 'savy-admin-2024';

interface Product {
  id: number; barcode: string; name: string; store_count: number;
  min_price: number; image_url?: string; category?: string; subcategory?: string;
}

type Tab = 'images' | 'categories';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('images');

  // --- Images state ---
  const [imgProducts, setImgProducts] = useState<Product[]>([]);
  const [imgTotal, setImgTotal] = useState(0);
  const [imgOffset, setImgOffset] = useState(0);
  const [imgSearch, setImgSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  // --- Categories state ---
  const [catProducts, setCatProducts] = useState<Product[]>([]);
  const [catTotal, setCatTotal] = useState(0);
  const [catOffset, setCatOffset] = useState(0);
  const [catSearch, setCatSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<Record<number, { category: string; subcategory: string }>>({});
  const [catSaved, setCatSaved] = useState<Record<number, boolean>>({});

  function login() {
    if (password === ADMIN_KEY) { setAuthed(true); setAuthError(''); }
    else setAuthError('סיסמא שגויה');
  }

  // Load images
  const loadImages = useCallback(async () => {
    if (!authed || tab !== 'images') return;
    setImgLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(imgOffset), limit: '20', search: imgSearch, showAll: String(showAll) });
      const res = await fetch(`${API}/admin/products-missing-images?${params}`, { headers: { 'x-admin-key': ADMIN_KEY } });
      const data = await res.json();
      setImgProducts(data.products || []);
      setImgTotal(data.total || 0);
    } finally { setImgLoading(false); }
  }, [imgOffset, imgSearch, showAll, authed, tab]);

  useEffect(() => { loadImages(); }, [loadImages]);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!authed || tab !== 'categories') return;
    setCatLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(catOffset), limit: '20', search: catSearch, filterCategory });
      const res = await fetch(`${API}/admin/products-categories?${params}`, { headers: { 'x-admin-key': ADMIN_KEY } });
      const data = await res.json();
      setCatProducts(data.products || []);
      setCatTotal(data.total || 0);
    } finally { setCatLoading(false); }
  }, [catOffset, catSearch, filterCategory, authed, tab]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Load all categories map once
  useEffect(() => {
    if (!authed) return;
    fetch(`${API}/admin/all-categories`, { headers: { 'x-admin-key': ADMIN_KEY } })
      .then(r => r.json()).then(setAllCategories).catch(() => {});
  }, [authed]);

  async function saveImage(productId: number) {
    const url = imageUrls[productId];
    if (!url) return;
    await fetch(`${API}/admin/update-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ productId, imageUrl: url })
    });
    setSaved(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => setImgProducts(prev => prev.filter(p => p.id !== productId)), 1000);
  }

  async function saveCategory(productId: number) {
    const e = editing[productId];
    if (!e) return;
    await fetch(`${API}/admin/update-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ productId, category: e.category, subcategory: e.subcategory })
    });
    setCatSaved(prev => ({ ...prev, [productId]: true }));
    setCatProducts(prev => prev.map(p => p.id === productId ? { ...p, category: e.category, subcategory: e.subcategory } : p));
    setTimeout(() => setCatSaved(prev => ({ ...prev, [productId]: false })), 2000);
  }

  function getEditing(p: Product) {
    return editing[p.id] || { category: p.category || '', subcategory: p.subcategory || '' };
  }

  const categoryList = Object.keys(allCategories).sort();

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-6 text-center">Admin</h1>
          <input type="password" placeholder="סיסמא" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full border border-stone-200 rounded-xl px-4 py-3 mb-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400" autoFocus />
          {authError && <p className="text-red-500 text-sm text-center mb-3">{authError}</p>}
          <button onClick={login} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">כניסה</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Admin</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-stone-200">
          <button onClick={() => setTab('images')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${tab === 'images' ? 'bg-white border border-b-white border-stone-200 text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}>
            🖼️ תמונות
          </button>
          <button onClick={() => setTab('categories')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${tab === 'categories' ? 'bg-white border border-b-white border-stone-200 text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}>
            🏷️ קטגוריות
          </button>
        </div>

        {/* ── TAB: IMAGES ── */}
        {tab === 'images' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-stone-400">{imgTotal.toLocaleString()} מוצרים</span>
              <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                <input type="checkbox" checked={showAll} onChange={e => { setShowAll(e.target.checked); setImgOffset(0); }} className="rounded" />
                הצג גם מוצרים עם תמונה
              </label>
            </div>
            <input type="text" placeholder="חיפוש לפי שם או ברקוד..." value={imgSearch}
              onChange={e => { setImgSearch(e.target.value); setImgOffset(0); }}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 mb-6 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            {imgLoading ? <div className="text-center py-20 text-stone-400">טוען...</div> : (
              <div className="space-y-3">
                {imgProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                      {(imageUrls[p.id] || p.image_url)
                        ? <img src={imageUrls[p.id] || p.image_url} alt="" className="w-full h-full object-contain" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-800 truncate">{p.name}</div>
                      <div className="text-xs text-stone-400 mt-0.5">ברקוד: {p.barcode} · {p.store_count} חנויות</div>
                      <div className="flex gap-2 mt-2">
                        <input type="url" placeholder="הדבק URL של תמונה..." value={imageUrls[p.id] || ''}
                          onChange={e => setImageUrls(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(p.barcode + ' ' + p.name)}&tbm=isch`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition whitespace-nowrap">גוגל</a>
                        <button onClick={() => saveImage(p.id)} disabled={!imageUrls[p.id] || saved[p.id]}
                          className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-40 transition whitespace-nowrap">
                          {saved[p.id] ? 'נשמר' : 'שמור'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setImgOffset(Math.max(0, imgOffset - 20))} disabled={imgOffset === 0} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הקודם</button>
              <span className="px-4 py-2 text-sm text-stone-500">{Math.floor(imgOffset / 20) + 1} / {Math.ceil(imgTotal / 20)}</span>
              <button onClick={() => setImgOffset(imgOffset + 20)} disabled={imgOffset + 20 >= imgTotal} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הבא</button>
            </div>
          </>
        )}

        {/* ── TAB: CATEGORIES ── */}
        {tab === 'categories' && (
          <>
            <div className="flex gap-3 mb-4">
              <input type="text" placeholder="חיפוש לפי שם או ברקוד..." value={catSearch}
                onChange={e => { setCatSearch(e.target.value); setCatOffset(0); }}
                className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCatOffset(0); }}
                className="border border-stone-200 rounded-xl px-3 py-3 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                <option value="">כל הקטגוריות</option>
                <option value="__empty__">ללא קטגוריה</option>
                {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="text-sm text-stone-400 mb-4">{catTotal.toLocaleString()} מוצרים</div>
            {catLoading ? <div className="text-center py-20 text-stone-400">טוען...</div> : (
              <div className="space-y-3">
                {catProducts.map(p => {
                  const e = getEditing(p);
                  const subcatList = allCategories[e.category] || [];
                  const isDirty = e.category !== (p.category || '') || e.subcategory !== (p.subcategory || '');
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-stone-100 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-800 truncate">{p.name}</div>
                          <div className="text-xs text-stone-400 mt-0.5">ברקוד: {p.barcode} · {p.store_count} חנויות</div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {/* Category select */}
                            <select value={e.category}
                              onChange={ev => setEditing(prev => ({ ...prev, [p.id]: { category: ev.target.value, subcategory: '' } }))}
                              className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white min-w-[140px]">
                              <option value="">בחר קטגוריה...</option>
                              {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {/* Subcategory */}
                            {subcatList.length > 0 ? (
                              <select value={e.subcategory}
                                onChange={ev => setEditing(prev => ({ ...prev, [p.id]: { ...e, subcategory: ev.target.value } }))}
                                className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white min-w-[140px]">
                                <option value="">בחר תת-קטגוריה...</option>
                                {subcatList.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="תת-קטגוריה..." value={e.subcategory}
                                onChange={ev => setEditing(prev => ({ ...prev, [p.id]: { ...e, subcategory: ev.target.value } }))}
                                className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[140px]" />
                            )}
                            <button onClick={() => saveCategory(p.id)} disabled={!isDirty && !catSaved[p.id]}
                              className={`px-3 py-1.5 text-sm rounded-lg transition whitespace-nowrap font-medium ${catSaved[p.id] ? 'bg-green-100 text-green-700' : isDirty ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                              {catSaved[p.id] ? '✓ נשמר' : 'שמור'}
                            </button>
                          </div>
                          {(p.category || p.subcategory) && (
                            <div className="mt-1.5 flex gap-1.5">
                              {p.category && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{p.category}</span>}
                              {p.subcategory && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{p.subcategory}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setCatOffset(Math.max(0, catOffset - 20))} disabled={catOffset === 0} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הקודם</button>
              <span className="px-4 py-2 text-sm text-stone-500">{Math.floor(catOffset / 20) + 1} / {Math.ceil(catTotal / 20)}</span>
              <button onClick={() => setCatOffset(catOffset + 20)} disabled={catOffset + 20 >= catTotal} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm disabled:opacity-40">הבא</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
