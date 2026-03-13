'use client';
import { useRef, useState } from 'react';

interface Props {
  onCapture: (frames: string[]) => void;
  onCancel: () => void;
}

type Phase = 'intro' | 'capturing' | 'analyzing' | 'anchor' | 'done';

const QUALITY_TIPS = [
  'וודא שהטקסט חד וברור',
  'תאורה טובה — אל תצלם בצל',
  'החזק את הטלפון ישר מעל הקבלה',
  'כל הטקסט חייב להיות בתוך המסגרת',
];

async function checkBlur(base64: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      resolve(sum / (data.length / 4) > 20);
    };
    img.src = 'data:image/jpeg;base64,' + base64;
  });
}

export default function GuidedCapture({ onCapture, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [frames, setFrames] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [anchorImg, setAnchorImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [shotCount, setShotCount] = useState(0);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setError(null);
    setAnalyzing(true);
    setPhase('analyzing');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      // בדיקת טשטוש
      const ok = await checkBlur(base64);
      if (!ok) {
        setError('התמונה מטושטשת — נסה שוב עם תאורה טובה יותר');
        setPhase(shotCount === 0 ? 'intro' : 'anchor');
        setAnalyzing(false);
        return;
      }

      const newFrames = [...frames, base64];
      setFrames(newFrames);
      setShotCount(c => c + 1);

      // שלח ל-Claude לניתוח מהיר
      try {
        const res = await fetch('/internal/receipt-anchor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();

        if (data.done || data.hasTotal) {
          // זיהה סה"כ — סיים
          setPhase('done');
          onCapture(newFrames);
        } else if (data.lastItem) {
          // יש עוד קבלה — הצג עוגן
          setAnchor(data.lastItem);
          setAnchorImg('data:image/jpeg;base64,' + base64);
          setPhase('anchor');
        } else {
          // לא זיהה כלום — בקש לצלם שוב
          setError('לא זיהינו טקסט ברור — נסה שוב');
          setPhase(shotCount === 0 ? 'intro' : 'anchor');
        }
      } catch {
        setError('שגיאה בניתוח — נסה שוב');
        setPhase(shotCount === 0 ? 'intro' : 'anchor');
      }

      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }

  function triggerCamera() {
    setPhase('capturing');
    setTimeout(() => inputRef.current?.click(), 100);
  }

  if (phase === 'intro' || phase === 'capturing') return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handlePhoto} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="text-6xl">📄</div>
        <div>
          <div className="text-white font-black text-2xl">צלם את הקבלה</div>
          <div className="text-gray-400 text-sm mt-2">
            {shotCount === 0 ? 'התחל מהחלק העליון של הקבלה' : 'צלם את החלק הבא'}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2">
          {QUALITY_TIPS.map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-right">
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-gray-300 text-xs">{tip}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-2xl px-4 py-3 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button onClick={triggerCamera}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          📷 {shotCount === 0 ? 'צלם תמונה ראשונה' : 'צלם תמונה נוספת'}
        </button>
        <button onClick={onCancel} className="w-full py-3 text-gray-500 text-sm">ביטול</button>
      </div>
    </div>
  );

  if (phase === 'analyzing') return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-white font-bold">מנתח את התמונה...</div>
      <div className="text-gray-400 text-sm">בודק איכות וזיהוי טקסט</div>
    </div>
  );

  if (phase === 'anchor') return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handlePhoto} />

      <div className="flex-1 flex flex-col px-6 pt-8 gap-4">
        <div className="text-center">
          <div className="text-white font-black text-xl">המשך מכאן ↓</div>
          <div className="text-gray-400 text-sm mt-1">צלם את חלק הקבלה שמתחיל מ:</div>
        </div>

        <div className="bg-emerald-900/50 border border-emerald-500 rounded-2xl px-5 py-4 text-center">
          <div className="text-emerald-300 text-xs mb-1">פריט אחרון שזוהה</div>
          <div className="text-white font-black text-lg">{anchor}</div>
          <div className="text-emerald-400 text-xs mt-2">↓ צלם מכאן והלאה</div>
        </div>

        {anchorImg && (
          <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: '200px' }}>
            <img src={anchorImg} className="w-full object-cover object-bottom opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 h-16"
              style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
            <div className="absolute bottom-2 left-0 right-0 text-center text-emerald-400 text-xs font-bold">
              ↓ המשך מתחת לשורה זו
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-2xl px-4 py-3 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="text-center text-gray-500 text-xs">
          {shotCount} תמונות צולמו עד כה
        </div>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button onClick={triggerCamera}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          📷 צלם המשך
        </button>
        <button onClick={() => onCapture(frames)}
          className="w-full py-3 rounded-2xl border border-gray-700 text-gray-300 text-sm font-bold">
          ✅ זה הכל — עבד עכשיו ({frames.length} תמונות)
        </button>
        <button onClick={onCancel} className="w-full py-2 text-gray-600 text-xs">ביטול</button>
      </div>
    </div>
  );

  return null;
}
