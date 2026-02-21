"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || 'https://supermarket-compare-production.up.railway.app';

interface SharedItem { productId: number; name: string; barcode: string; brand: string; qty: number; minPrice: number | null; }

export default function SharedList() {
  const params = useParams();
  const id = params.id as string;
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/shared-list/${id}`)
      .then(r => r.json())
      .then(data => { if (data.error) setError("הרשימה לא נמצאה"); else setItems(data.items || []); })
      .catch(() => setError("שגיאה בטעינה"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQty = (productId: number, newQty: number) => {
    if (newQty <= 0) setItems(prev => prev.filter(i => i.productId !== productId));
    else setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty: newQty } : i));
  };

  const saveChanges = async () => {
    setSaving(true);
    try { await fetch(`${API}/api/shared-list/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) }); } catch {}
    setSaving(false);
  };

  const importToApp = () => {
    const listItems = items.map(i => ({ product: { id: i.productId, barcode: i.barcode, name: i.name, brand: i.brand, minPrice: i.minPrice, unitQty: '', unitMeasure: '', matchScore: 0, maxPrice: null, storeCount: 0 }, qty: i.qty }));
    localStorage.setItem('savy-list', JSON.stringify(listItems));
    window.location.href = '/';
  };

  const total = items.reduce((sum, i) => sum + (i.minPrice || 0) * i.qty, 0);

  if (loading) return (<div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" /></div>);
  if (error) return (<div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center px-4"><div className="text-center"><div className="text-4xl mb-4">😕</div><div className="text-lg font-bold text-stone-700">{error}</div><a href="/" className="mt-4 inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">חזרה ל-Savy</a></div></div>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 pb-24" dir="rtl">
      <div className="bg-white border-b border-stone-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div><h1 className="font-black text-xl text-stone-800">🛒 רשימה משותפת</h1><p className="text-xs text-stone-400 mt-0.5">{items.length} מוצרים{total > 0 ? ` · ~₪${total.toFixed(0)}` : ''}</p></div>
          <a href="/"><img src="/icons/savy-logo.png" alt="Savy" className="h-8" /></a>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-xl p-3.5 border border-stone-100 flex items-center justify-between">
            <div className="min-w-0"><div className="font-bold text-sm text-stone-800 truncate">{item.name}</div><div className="text-xs text-stone-400">{item.minPrice ? `מ-₪${Number(item.minPrice).toFixed(2)}` : ''}{item.brand ? ` · ${item.brand}` : ''}</div></div>
            <div className="flex items-center gap-2 shrink-0 mr-2">
              <button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 font-bold">−</button>
              <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
              <button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={importToApp} className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm disabled:opacity-50">➕ הוסף מוצרים</button>
          <button onClick={importToApp} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">🔍 השווה מחירים</button>
        </div>
      </div>
    </div>
  );
}
