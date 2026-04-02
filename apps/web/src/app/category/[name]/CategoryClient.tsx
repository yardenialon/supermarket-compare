"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export default function CategoryClient({ name, initialProducts = [] }: { name: string; initialProducts?: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch(`${API}/category/${encodeURIComponent(name)}/subcategories`)
      .then(r => r.json())
      .then(d => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [name]);

  useEffect(() => {
    if (page === 0 && !activeSubcat) return;
    setLoading(true);
    const url = activeSubcat
      ? `${API}/category/${encodeURIComponent(name)}/products?page=${page}&subcategory=${encodeURIComponent(activeSubcat)}`
      : `${API}/category/${encodeURIComponent(name)}/products?page=${page}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name, page, activeSubcat]);

  const handleSubcat = (sub: string | null) => {
    setActiveSubcat(sub);
    setPage(0);
    setLoading(true);
    const url = sub
      ? `${API}/category/${encodeURIComponent(name)}/products?page=0&subcategory=${encodeURIComponent(sub)}`
      : `${API}/category/${encodeURIComponent(name)}/products?page=0`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/category" className="text-stone-400 hover:text-stone-700 flex items-center gap-1.5">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">›</span>
          <Link href="/category" className="text-stone-400 hover:text-stone-700 text-sm">קטגוריות</Link>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">{name}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <h1 className="font-black text-2xl text-stone-800 mb-4">{name}</h1>

        {/* סאב קטגוריות */}
        {subcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button
              onClick={() => handleSubcat(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                !activeSubcat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              הכל
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.subcategory}
                onClick={() => handleSubcat(sub.subcategory)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeSubcat === sub.subcategory
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {sub.subcategory} <span className="text-xs opacity-60">({sub.count})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition flex flex-col gap-2">
                <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="max-w-full max-h-full object-contain p-2" />
                    : <span className="text-4xl">📦</span>}
                </div>
                <div className="font-semibold text-stone-800 text-sm leading-snug line-clamp-2">{p.name}</div>
                {p.brand && <div className="text-xs text-stone-400">{p.brand}</div>}
                {p.minPrice && <div className="font-mono font-black text-emerald-600 text-lg">₪{Number(p.minPrice).toFixed(2)}</div>}
                {p.storeCount && <div className="text-xs text-stone-400">{p.storeCount} חנויות</div>}
              </Link>
            ))}
          </div>
        )}

        {products.length === 48 && (
          <div className="flex justify-center gap-3 mt-8">
            {page > 0 && (
              <button onClick={() => setPage(p => p - 1)}
                className="px-6 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-50 transition">
                הקודם
              </button>
            )}
            <button onClick={() => setPage(p => p + 1)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition">
              הבא
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
