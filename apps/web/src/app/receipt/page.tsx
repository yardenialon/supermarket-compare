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
      // המר לbase64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      // שלח ל-API שלנו
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בעיבוד הקבלה');
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
        <a href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block">← חזרה לעמוד הראשי</a>
        <h1 className="text-2xl font-black text-stone-800 mb-2">סריקת קבלה 🧾</h1>
        <p className="text-stone-500 mb-8 text-sm">העלה קבלה מהסופר ונבדוק אם יכולת לחסוך</p>

        {/* העלאת קובץ */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setImage(URL.createObjectURL(f)); handleFile(f); } }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-stone-300 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
        >
          {image ? (
            <img src={image} alt="קבלה" className="max-h-64 mx-auto rounded-xl object-contain" />
          ) : (
            <>
              <div className="text-5xl mb-3">📷</div>
              <p className="text-stone-500 font-medium">לחץ לצלם או לבחור תמונה</p>
              <p className="text-stone-400 text-xs mt-1">JPG, PNG, PDF</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImage(URL.createObjectURL(f)); handleFile(f); } }} />

        {/* לודינג */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-8 h-8 border-[3px] border-stone-200 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
            <p className="text-stone-500 text-sm">מנתח את הקבלה...</p>
          </div>
        )}

        {/* שגיאה */}
        {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {/* תוצאות */}
        {results && (
          <div className="mt-8 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
              <h2 className="font-bold text-stone-700 mb-4">מוצרים שזוהו</h2>
              {results.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
                  <span className="text-stone-600 text-sm">{item.name}</span>
                  <span className="font-bold text-stone-800">₪{item.price}</span>
                </div>
              ))}
            </div>
            {results.savings != null && (
              <div className={`rounded-2xl p-5 ${results.savings > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                {results.savings > 0 ? (
                  <>
                    <p className="font-bold text-amber-700">יכולת לחסוך ₪{results.savings.toFixed(2)}</p>
                    <p className="text-amber-600 text-sm mt-1">בסניף {results.cheapestStore}</p>
                  </>
                ) : (
                  <p className="font-bold text-emerald-700">קנית במחיר הטוב ביותר! 🎉</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
