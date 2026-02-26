'use client';
import { useState, useRef, useEffect } from 'react';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

export default function ReceiptPage() {
  const [parts, setParts] = useState<{ url: string; base64: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  // בקש מיקום בשקט
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function addFile(file: File) {
    const base64 = await fileToBase64(file);
    const url = URL.createObjectURL(file);
    setParts(prev => [...prev, { url, base64 }]);
  }

  async function scan() {
    if (!parts.length) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: parts.map(p => p.base64), lat: userLoc?.lat, lng: userLoc?.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בעיבוד הקבלה');
      setResults(data);
      console.log('DEBUG:', JSON.stringify({total: data.total, totalType: typeof data.total, bestStores: data.bestStores?.length, firstStore: data.bestStores?.[0]?.total}));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() { setParts([]); setResults(null); setError(null); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto px-4 py-8">
        <a href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block">← חזרה</a>
        <h1 className="text-2xl font-black text-stone-800 mb-2">סריקת קבלה 🧾</h1>
        <p className="text-stone-500 mb-6 text-sm">צלמו את הקבלה — גם כמה חלקים — ונבדוק אם יכולתם לחסוך</p>

        {!results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
                <span className="text-3xl">📷</span><span>צלם קבלה</span>
              </button>
              <button onClick={() => galleryRef.current?.click()} className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white border-2 border-stone-200 text-stone-600 font-bold hover:border-emerald-400 hover:bg-emerald-50 transition">
                <span className="text-3xl">🖼️</span><span>בחר מגלריה</span>
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = ''; }} />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(f => addFile(f)); e.target.value = ''; }} />

            {parts.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-stone-500">{parts.length} חלקים צולמו</div>
                <div className="grid grid-cols-3 gap-2">
                  {parts.map((p, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-stone-100">
                      <img src={p.url} alt={`חלק ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => setParts(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow">✕</button>
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">{i + 1}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => cameraRef.current?.click()} className="flex-1 py-3 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition">+ הוסף חלק</button>
                  <button onClick={scan} disabled={loading} className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition disabled:opacity-50">✅ סיים וסרוק</button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-8 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-[3px] border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-stone-500 text-sm">מנתח {parts.length} חלקי קבלה עם AI...</p>
            <p className="text-stone-400 text-xs">10-20 שניות</p>
          </div>
        )}

        {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {results && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
              <h2 className="font-black text-stone-800 text-lg mb-4">פרטי הקבלה</h2>
              <div className="grid grid-cols-2 gap-3">
                {results.store && <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">רשת</div><div className="font-bold text-stone-700">{results.store}</div></div>}
                {results.branch && <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">סניף</div><div className="font-bold text-stone-700">{results.branch}</div></div>}
                {results.receipt_number && <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">מספר קבלה</div><div className="font-bold text-stone-700 font-mono">{results.receipt_number}</div></div>}
                {results.date && <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">תאריך</div><div className="font-bold text-stone-700">{results.date}</div></div>}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <h2 className="font-black text-stone-800">מוצרים שזוהו</h2>
                <span className="text-xs text-stone-400">{results.items?.length} מוצרים</span>
              </div>
              <div className="divide-y divide-stone-50">
                {results.items?.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-800 text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.barcode && <span className="text-xs text-stone-400 font-mono">{item.barcode}</span>}
                          {item.qty > 1 && <span className="text-xs text-stone-400">x{item.qty}</span>}
                          {item.savings > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">חיסכון ₪{item.savings.toFixed(2)}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="font-bold text-stone-800">₪{Number(item.price).toFixed(2)}</div>
                        {item.minPrice && item.minPrice < item.price && <div className="text-xs text-emerald-600">מינימום ₪{Number(item.minPrice).toFixed(2)}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {results.total && (
                <div className="px-5 py-4 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                  <span className="font-black text-stone-700">סך הכל ששילמת</span>
                  <span className="font-mono font-black text-xl text-stone-800">₪{Number(results.total).toFixed(2)}</span>
                </div>
              )}
            </div>
            {results.savings != null && (
              <div className={`rounded-2xl p-5 ${results.savings > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                {results.savings > 0 ? (
                  <div className="flex items-center gap-3"><span className="text-3xl">💸</span><div><p className="font-black text-amber-700 text-lg">יכולת לחסוך ₪{results.savings.toFixed(2)}</p><p className="text-amber-600 text-sm mt-0.5">על ידי קנייה בחנויות הזולות יותר</p></div></div>
                ) : (
                  <div className="flex items-center gap-3"><span className="text-3xl">🎉</span><p className="font-black text-emerald-700 text-lg">קנית במחיר הטוב ביותר!</p></div>
                )}
              </div>
            )}
{results.bestStores && results.bestStores.length > 0 && results.bestStores[0]?.total > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="font-black text-stone-800">השוואת מחירים לסל זה 🏪</h2>
                </div>
                <div className="divide-y divide-stone-50">
                  {results.bestStores.map((store: any, i: number) => (
                    <div key={i} className={"flex items-center justify-between px-5 py-4 " + (i === 0 ? "bg-emerald-50/40" : "")}>
                      <div>
                        <div className="font-bold text-stone-800">{i === 0 && "🏆 "}{store.subchainName || store.chainName}</div>
                        <div className="text-xs text-stone-400">{store.storeName}{store.city && " · " + store.city}</div>
                      </div>
                      <div className="text-left">
                        <div className={"font-mono font-black text-lg " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                        {i === 0 && results.total && store.total < results.total && <div className="text-xs text-emerald-600 font-bold">חיסכון ₪{(results.total - store.total).toFixed(2)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.bestStores && results.bestStores.length > 0 && results.bestStores[0]?.total > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="font-black text-stone-800">השוואת מחירים לסל זה 🏪</h2>
                </div>
                <div className="divide-y divide-stone-50">
                  {results.bestStores.map((store: any, i: number) => (
                    <div key={i} className={"flex items-center justify-between px-5 py-4 " + (i === 0 ? "bg-emerald-50/40" : "")}>
                      <div>
                        <div className="font-bold text-stone-800">{i === 0 && "🏆 "}{store.subchainName || store.chainName}</div>
                        <div className="text-xs text-stone-400">{store.storeName}{store.city && " · " + store.city}</div>
                      </div>
                      <div className="text-left">
                        <div className={"font-mono font-black text-lg " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                        {i === 0 && results.total && store.total < Number(results.total) && <div className="text-xs text-emerald-600 font-bold">חיסכון ₪{(Number(results.total) - store.total).toFixed(2)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={reset} className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-bold hover:bg-stone-100 transition">סרוק קבלה נוספת</button>
          </div>
        )}
      </div>
    </div>
  );
}
