'use client';
import { useState, useRef } from 'react';

export default function ReceiptPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '׳©׳’׳™׳׳” ׳‘׳¢׳™׳‘׳•׳“ ׳”׳§׳‘׳׳”');
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto px-4 py-8">
        <a href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block">ג† ׳—׳–׳¨׳” ׳׳¢׳׳•׳“ ׳”׳¨׳׳©׳™</a>
        <h1 className="text-2xl font-black text-stone-800 mb-2">׳¡׳¨׳™׳§׳× ׳§׳‘׳׳” נ§¾</h1>
        <p className="text-stone-500 mb-6 text-sm">׳”׳¢׳׳” ׳§׳‘׳׳” ׳׳”׳¡׳•׳₪׳¨ ׳•׳ ׳‘׳“׳•׳§ ׳׳ ׳™׳›׳•׳׳× ׳׳—׳¡׳•׳</p>

        {/* ׳”׳¢׳׳׳× ׳§׳•׳‘׳¥ */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setImage(URL.createObjectURL(f)); handleFile(f); } }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
        >
          {image ? (
            <img src={image} alt="׳§׳‘׳׳”" className="max-h-56 mx-auto rounded-xl object-contain" />
          ) : (
            <>
              <div className="text-5xl mb-3">נ“·</div>
              <p className="text-stone-500 font-medium">׳׳—׳¥ ׳׳¦׳׳ ׳׳• ׳׳‘׳—׳•׳¨ ׳×׳׳•׳ ׳”</p>
              <p className="text-stone-400 text-xs mt-1">JPG, PNG, HEIC</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImage(URL.createObjectURL(f)); handleFile(f); } }} />

        {/* ׳׳•׳“׳™׳ ׳’ */}
        {loading && (
          <div className="mt-8 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-[3px] border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-stone-500 text-sm">׳׳ ׳×׳— ׳׳× ׳”׳§׳‘׳׳” ׳¢׳ AI...</p>
            <p className="text-stone-400 text-xs">׳–׳” ׳¢׳©׳•׳™ ׳׳§׳—׳× 10-20 ׳©׳ ׳™׳•׳×</p>
          </div>
        )}

        {/* ׳©׳’׳™׳׳” */}
        {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {/* ׳×׳•׳¦׳׳•׳× */}
        {results && (
          <div className="mt-6 space-y-4">

            {/* ׳₪׳¨׳˜׳™ ׳”׳§׳‘׳׳” */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
              <h2 className="font-black text-stone-800 text-lg mb-4">׳₪׳¨׳˜׳™ ׳”׳§׳‘׳׳”</h2>
              <div className="grid grid-cols-2 gap-3">
                {results.store && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="text-xs text-stone-400 mb-1">׳¨׳©׳×</div>
                    <div className="font-bold text-stone-700">{results.store}</div>
                  </div>
                )}
                {results.branch && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="text-xs text-stone-400 mb-1">׳¡׳ ׳™׳£</div>
                    <div className="font-bold text-stone-700">{results.branch}</div>
                  </div>
                )}
                {results.receipt_number && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="text-xs text-stone-400 mb-1">׳׳¡׳₪׳¨ ׳§׳‘׳׳”</div>
                    <div className="font-bold text-stone-700 font-mono">{results.receipt_number}</div>
                  </div>
                )}
                {results.date && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="text-xs text-stone-400 mb-1">׳×׳׳¨׳™׳</div>
                    <div className="font-bold text-stone-700">{results.date}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ׳׳•׳¦׳¨׳™׳ */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="font-black text-stone-800">׳׳•׳¦׳¨׳™׳ ׳©׳–׳•׳”׳•</h2>
              </div>
              <div className="divide-y divide-stone-50">
                {results.items?.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-800 text-sm">{item.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          {item.barcode && <span className="text-xs text-stone-400 font-mono">{item.barcode}</span>}
                          {item.qty > 1 && <span className="text-xs text-stone-400">ֳ—{item.qty}</span>}
                          {item.savings > 0 && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              ׳—׳™׳¡׳›׳•׳ ג‚×{item.savings.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="font-bold text-stone-800">ג‚×{Number(item.price).toFixed(2)}</div>
                        {item.qty > 1 && <div className="text-xs text-stone-400">׳¡׳”׳´׳› ג‚×{Number(item.subtotal || item.price * item.qty).toFixed(2)}</div>}
                        {item.minPrice && item.minPrice < item.price && (
                          <div className="text-xs text-emerald-600">׳׳™׳ ׳™׳׳•׳ ג‚×{Number(item.minPrice).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* ׳¡׳ ׳”׳›׳ */}
              {results.total && (
                <div className="px-5 py-4 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                  <span className="font-black text-stone-700">׳¡׳ ׳”׳›׳ ׳©׳©׳™׳׳׳×</span>
                  <span className="font-mono font-black text-xl text-stone-800">ג‚×{Number(results.total).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* ׳—׳™׳¡׳›׳•׳ */}
            {results.savings != null && (
              <div className={`rounded-2xl p-5 ${results.savings > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                {results.savings > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">נ’¸</span>
                    <div>
                      <p className="font-black text-amber-700 text-lg">׳™׳›׳•׳׳× ׳׳—׳¡׳•׳ ג‚×{results.savings.toFixed(2)}</p>
                      <p className="text-amber-600 text-sm mt-0.5">׳¢׳ ׳™׳“׳™ ׳§׳ ׳™׳™׳” ׳‘׳—׳ ׳•׳™׳•׳× ׳”׳–׳•׳׳•׳× ׳™׳•׳×׳¨</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">נ‰</span>
                    <p className="font-black text-emerald-700 text-lg">׳§׳ ׳™׳× ׳‘׳׳—׳™׳¨ ׳”׳˜׳•׳‘ ׳‘׳™׳•׳×׳¨!</p>
                  </div>
                )}
              </div>
            )}

            {/* ׳¡׳¨׳•׳§ ׳©׳•׳‘ */}
            <button
              onClick={() => { setResults(null); setImage(null); setError(null); }}
              className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-bold hover:bg-stone-100 transition"
            >
              ׳¡׳¨׳•׳§ ׳§׳‘׳׳” ׳ ׳•׳¡׳₪׳×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
