'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import AuthModal from '@/components/AuthModal';
import dynamic from 'next/dynamic';
const GuidedCapture = dynamic(() => import('@/components/GuidedCapture'), { ssr: false });

const API = 'https://supermarket-compare-production.up.railway.app';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function categoryEmoji(cat: string) {
  const map: Record<string, string> = {
    'חלב וגבינות': '🧀', 'בשר ועוף': '🥩', 'ירקות ופירות': '🥦', 'לחם ומאפים': '🍞',
    'שתייה': '🥤', 'חטיפים': '🍿', 'ניקיון': '🧹', 'טואלטיקה': '🧴', 'קפואים': '🧊',
    'שימורים': '🥫', 'כללי': '🛒',
  };
  return map[cat] || '🛍️';
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

const LOADING_STEPS = [
  { icon: '🔍', text: 'קורא את הקבלה...' },
  { icon: '🧠', text: 'מזהה מוצרים עם AI...' },
  { icon: '💰', text: 'משווה מחירים בין רשתות...' },
  { icon: '📊', text: 'מחשב חיסכון אפשרי...' },
];

function LoadingScreen({ partsCount }: { partsCount: number }) {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 3500);
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 500);
    return () => { clearInterval(t); clearInterval(d); };
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">{LOADING_STEPS[step].icon}</div>
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-800 text-base">{LOADING_STEPS[step].text}{dots}</p>
        <p className="text-gray-400 text-xs mt-1">מעבד {partsCount} תמונות · עד 20 שניות</p>
      </div>
      <div className="flex gap-2">
        {LOADING_STEPS.map((s, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= step ? 'bg-emerald-500 scale-110' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}

function SavingsHero({ savings, total }: { savings: number; total: number }) {
  const pct = total > 0 ? Math.round((savings / total) * 100) : 0;
  if (savings <= 0) return null;
  return (
    <div className="relative rounded-3xl overflow-hidden p-6 text-white"
      style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-white/70 text-sm font-medium mb-1">יכולת לחסוך</p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-5xl font-black tracking-tight">₪{savings.toFixed(2)}</span>
          <span className="text-white/70 text-sm mb-2">{pct}% מהסכום</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className="text-white/70 text-xs">מתוך ₪{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function UploadZone({ onCamera, onGallery, onScroll }: { onCamera: () => void; onGallery: () => void; onScroll: () => void }) {
  return (
    <div className="space-y-3">
      <button onClick={onScroll}
        className="w-full relative overflow-hidden rounded-3xl p-5 text-white text-right transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.35)' }}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 left-8 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">📜</div>
          <div>
            <div className="font-black text-lg leading-tight">סריקת קבלה ארוכה</div>
            <div className="text-white/75 text-sm mt-0.5">גלול לאט — AI מנתח אוטומטית</div>
          </div>
          <svg className="mr-auto flex-shrink-0 opacity-60" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onCamera}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all active:scale-95 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">📷</div>
          <span className="font-bold text-gray-700 text-sm">צלם קבלה</span>
          <span className="text-gray-400 text-xs">תמונה בודדת</span>
        </button>
        <button onClick={onGallery}
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all active:scale-95 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">🖼️</div>
          <span className="font-bold text-gray-700 text-sm">מהגלריה</span>
          <span className="text-gray-400 text-xs">מספר תמונות</span>
        </button>
      </div>
    </div>
  );
}

function PartsPreview({ parts, onAdd, onRemove, onScan, loading }: {
  parts: { url: string; base64: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onScan: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-800">{parts.length} תמונות מוכנות</h3>
          <p className="text-xs text-gray-400 mt-0.5">לחץ על ✕ להסרת תמונה</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 text-sm font-bold hover:bg-emerald-50 transition">
          + הוסף
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {parts.map((p, i) => (
          <div key={i} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-100 shadow-sm">
            <img src={p.url || ''} alt={`חלק ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button onClick={() => onRemove(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow active:scale-90">✕</button>
            <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-black shadow">{i + 1}</div>
          </div>
        ))}
        <button onClick={onAdd} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-emerald-300 hover:text-emerald-400 transition">
          <span className="text-2xl">+</span>
          <span className="text-[10px]">הוסף</span>
        </button>
      </div>
      <button onClick={onScan} disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 24px rgba(16,185,129,0.4)' }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            מעבד...
          </span>
        ) : `✅ נתח ${parts.length} תמונות עם AI`}
      </button>
    </div>
  );
}


function EditItemsView({ items, onConfirm, onCancel }: { items: any[]; onConfirm: (items: any[]) => void; onCancel: () => void }) {
  const [editedItems, setEditedItems] = useState<any[]>(items.map(i => ({ ...i })));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  function updateItem(idx: number, field: string, value: any) {
    setEditedItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }
  function deleteItem(idx: number) {
    setEditedItems(prev => prev.filter((_, i) => i !== idx));
  }
  function addItem() {
    setEditedItems(prev => [...prev, { name: '', price: 0, qty: 1, barcode: null, savings: 0, subtotal: 0 }]);
    setEditingIdx(editedItems.length);
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-3 items-start">
        <div className="text-xl">✏️</div>
        <div>
          <div className="font-bold text-amber-800 text-sm">בדוק את הפריטים</div>
          <div className="text-xs text-amber-600 mt-0.5">Claude זיהה {items.length} פריטים — תקן שגיאות לפני ההשוואה</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="font-black text-gray-900">פריטים ({editedItems.length})</h3>
          <button onClick={addItem} className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">+ הוסף</button>
        </div>
        <div className="divide-y divide-gray-50">
          {editedItems.map((item, i) => (
            <div key={i} className="px-4 py-3">
              {editingIdx === i ? (
                <div className="space-y-2">
                  <input
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 text-right"
                    value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)}
                    placeholder="שם המוצר"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 text-right"
                      type="number"
                      value={item.price}
                      onFocus={e => { if (e.target.value === "0") e.target.value = ""; }} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="מחיר"
                    />
                    <input
                      className="w-16 text-sm border border-gray-200 rounded-xl px-3 py-2 text-right"
                      type="number"
                      value={item.qty}
                      onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)}
                      placeholder="כמות"
                    />
                  </div>
                  <button onClick={() => setEditingIdx(null)} className="w-full py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold">שמור</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => deleteItem(i)} className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center flex-shrink-0">✕</button>
                  <div className="flex-1 min-w-0" onClick={() => setEditingIdx(i)}>
                    <div className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.name || 'פריט חדש'}</div>
                    {item.qty > 1 && <span className="text-xs text-gray-400">x{item.qty}</span>}
                  </div>
                  <div className="font-bold text-gray-800 text-sm flex-shrink-0 cursor-pointer" onClick={() => setEditingIdx(i)}>
                    ₪{Number(item.subtotal || item.price).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => onConfirm(editedItems)}
        className="w-full py-4 rounded-2xl font-black text-white text-base"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
        השווה מחירים ←
      </button>
      <button onClick={onCancel} className="w-full py-3 text-gray-400 text-sm font-bold">
        ביטול
      </button>
    </div>
  );
}

function ResultsView({ results, onReset }: { results: any; onReset: () => void }) {
  const [expandedStore, setExpandedStore] = useState<number | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const items = results.items || [];
  const visibleItems = showAllItems ? items : items.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>🧾</div>
          <div>
            <h2 className="font-black text-gray-900 text-lg leading-tight">{results.store || 'קבלה'}</h2>
            {results.branch && <p className="text-gray-400 text-xs">{results.branch}</p>}
            {results.date && <p className="text-gray-400 text-xs">{results.date}</p>}
          </div>
          {results.total && (
            <div className="mr-auto text-left">
              <div className="text-xs text-gray-400">שולם</div>
              <div className="font-black text-xl text-gray-900">₪{Number(results.total).toFixed(2)}</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'מוצרים', value: items.length, icon: '🛍️' },
            { label: 'נמצאו', value: results.coveredItems || 0, icon: '✅' },
            { label: 'תמונות', value: results.imagesProcessed || 1, icon: '📸' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
              <div className="text-lg">{stat.icon}</div>
              <div className="font-black text-gray-800 text-lg leading-tight">{stat.value}</div>
              <div className="text-gray-400 text-[10px]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <SavingsHero savings={results.savings || 0} total={results.total || 0} />

      {results.bestStores && results.bestStores.length > 0 && (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-black text-gray-900">השוואת רשתות 🏪</h3>
            {results.coveredItems < results.totalItems && (
              <p className="text-xs text-gray-400 mt-0.5">על בסיס {results.coveredItems} מתוך {results.totalItems} מוצרים</p>
            )}
          </div>
          <div className="px-3 pb-3 space-y-2">
            {(() => {
              // קיבוץ לפי רשת — הכי זול בכל רשת
              const byChain: Record<string, any> = {};
              for (const s of results.bestStores) {
                const key = s.chainName;
                if (!byChain[key] || s.availableCount > byChain[key].availableCount || (s.availableCount === byChain[key].availableCount && s.total < byChain[key].total))
                  byChain[key] = s;
              }
              const chains = Object.values(byChain)
                .sort((a: any, b: any) => b.availableCount - a.availableCount || a.total - b.total)
                .slice(0, 6);
              const best = chains[0];
              return chains.map((store: any, i: number) => {
                const isBest = i === 0;
                const diff = i > 0 && best ? store.total - best.total : 0;
                const saving = results.foundTotal > 0 && store.total < results.foundTotal ? results.foundTotal - store.total : 0;
                const totalItems = store.availableCount + store.missingCount;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden"
                    style={isBest ? { background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7' } : { background: '#f9fafb', border: '1.5px solid #f3f4f6' }}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      {isBest && <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">🏆</div>}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm ${isBest ? 'text-emerald-800' : 'text-gray-700'}`}>{store.chainName}</div>
                        <div className="text-xs text-gray-400">{store.availableCount}/{totalItems} מוצרים נמצאו{store.city ? ` · ${store.city}` : ''}</div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className={`font-black text-lg ${isBest ? 'text-emerald-700' : 'text-gray-800'}`}>₪{store.total.toFixed(2)}</div>
                        {diff > 0 && <div className="text-xs text-red-400 font-semibold">+₪{diff.toFixed(2)}</div>}
                        {isBest && saving > 0 && <div className="text-xs text-emerald-600 font-bold">חיסכון ₪{saving.toFixed(2)}</div>}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="font-black text-gray-900">פירוט מוצרים</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{items.length}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {visibleItems.map((item: any, i: number) => (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                {item.savings > 0 ? '💸' : '🛍️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {item.qty > 1 && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">x{item.qty}</span>}
                  {item.savings > 0 && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">חיסכון ₪{item.savings.toFixed(2)}</span>}
                  {item.minPrice && item.minPrice < item.price && <span className="text-xs text-gray-400">מינ׳ ₪{Number(item.minPrice).toFixed(2)}</span>}
                </div>
              </div>
              <div className="font-bold text-gray-800 text-sm flex-shrink-0">₪{Number(item.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        {items.length > 8 && (
          <button onClick={() => setShowAllItems(v => !v)}
            className="w-full py-3.5 text-emerald-600 font-bold text-sm border-t border-gray-50 hover:bg-emerald-50 transition">
            {showAllItems ? 'הצג פחות ▲' : `הצג עוד ${items.length - 8} מוצרים ▼`}
          </button>
        )}
        {results.total && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="font-black text-gray-700">סה״כ</span>
            <span className="font-black text-xl text-gray-900">₪{Number(results.total).toFixed(2)}</span>
          </div>
        )}
      </div>

      <button onClick={onReset}
        className="w-full py-3.5 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
        🔄 סרוק קבלה נוספת
      </button>
    </div>
  );
}

function HistorySection({ user, onLogin }: { user: any; onLogin: () => void }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [tab, setTab] = useState<'history' | 'insights'>('history');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
    const headers: any = token ? { 'x-session-token': token } : {};
    Promise.all([
      fetch(`/internal/receipt-history`, { headers }).then(r => r.json()),
      fetch(`/internal/receipt-insights`, { headers }).then(r => r.json()),
    ]).then(([h, ins]) => {
      setReceipts(h.receipts || []);
      setInsights(ins.insights || []);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">📊</div>
        <h3 className="font-black text-gray-800 mb-1">היסטוריה והמלצות</h3>
        <p className="text-gray-400 text-sm mb-5">התחבר כדי לשמור קבלות ולקבל המלצות חיסכון אישיות</p>
        <button onClick={onLogin}
          className="px-8 py-3 rounded-2xl text-white font-bold text-sm transition active:scale-95"
          style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
          התחבר / הרשם
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-2xl">
        {[
          { key: 'history', label: '🧾 קבלות', count: receipts.length },
          { key: 'insights', label: '💡 המלצות', count: insights.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
      ) : tab === 'history' ? (
        receipts.length === 0 ? (
          <div className="text-center py-10"><div className="text-4xl mb-2">🧾</div><p className="text-gray-400 text-sm">עדיין אין קבלות — סרוק את הראשונה!</p></div>
        ) : (
          <div className="space-y-2">
            {receipts.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">🧾</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{r.store_name || 'חנות לא ידועה'}</div>
                    <div className="text-xs text-gray-400">{formatDate(r.scanned_at)}</div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="font-black text-gray-800">₪{Number(r.total_paid).toFixed(2)}</div>
                    {Number(r.saved) > 0 && <div className="text-xs text-emerald-600 font-bold">חסכת ₪{Number(r.saved).toFixed(2)}</div>}
                  </div>
                  <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {expanded === r.id && r.items && (
                  <div className="border-t border-gray-50 px-4 py-3 space-y-1.5">
                    {(r.items as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500 truncate flex-1">{item.name}</span>
                        <span className="text-gray-700 font-semibold mr-3">₪{Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        insights.length === 0 ? (
          <div className="text-center py-10"><div className="text-4xl mb-2">💡</div><p className="text-gray-400 text-sm">סרוק עוד קבלות כדי לקבל המלצות</p></div>
        ) : (
          <div className="space-y-3">
            {insights.map((ins: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">{categoryEmoji(ins.category)}</div>
                <div className="flex-1">
                  <div className="font-black text-gray-800 text-sm">{ins.category}</div>
                  <div className="text-xs text-gray-500 mt-0.5">קנה ב-<span className="font-bold text-emerald-600">{ins.chain}</span> וחסוך</div>
                  <div className="text-2xl font-black text-emerald-500 leading-tight">₪{ins.potentialSaving}</div>
                  {ins.items.length > 0 && <div className="text-xs text-gray-400 mt-1">{ins.items.join(', ')}</div>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ReceiptPage() {
  const { user, setUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [parts, setParts] = useState<{ url: string; base64: string }[]>([]);
  const [showScrollCapture, setShowScrollCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  async function pdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
  }
  return images;
}


async function compressImage(base64: string, maxSizeKB = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let quality = 0.7;
      let scale = 1;
      // אם התמונה גדולה מדי — הקטן
      if (img.width > 1200) scale = 1200 / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // נסה עם quality יורד עד שהגודל מתאים
      const tryCompress = (q: number) => {
        const data = canvas.toDataURL('image/jpeg', q).split(',')[1];
        if (data.length * 0.75 < maxSizeKB * 1024 || q < 0.3) {
          resolve(data);
        } else {
          tryCompress(q - 0.1);
        }
      };
      tryCompress(quality);
    };
    img.src = 'data:image/jpeg;base64,' + base64;
  });
}
async function addFile(file: File) {
  if (file.type === 'application/pdf') {
    const imgs = await pdfToImages(file);
    imgs.forEach(base64 => setParts(prev => [...prev, { url: '', base64 }]));
    return;
  }
    let base64 = await fileToBase64(file);
    base64 = await compressImage(base64);
    const url = URL.createObjectURL(file);
    setParts(prev => [...prev, { url, base64 }]);
  }

  async function scan() {
    if (!parts.length) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
      const res = await fetch('/internal/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(sessionToken ? { 'x-session-token': sessionToken } : {}) },
        body: JSON.stringify({ parts: parts.map(p => p.base64), lat: userLoc?.lat, lng: userLoc?.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בעיבוד הקבלה');
      setEditItems(data.items || []);
      setIsEditing(true);
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() { setParts([]); setResults(null); setError(null); }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(180deg,#f0fdf4 0%,#ffffff 160px)' }} dir="rtl">
      <div className="max-w-xl mx-auto px-4 pt-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            🧾
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-xl leading-tight">סריקת קבלה</h1>
            <p className="text-gray-400 text-xs">נתח עם AI · גלה כמה חסכת</p>
          </div>
        </div>

        {!results && !loading && parts.length === 0 && (
          <UploadZone
            onCamera={() => cameraRef.current?.click()}
            onGallery={() => galleryRef.current?.click()}
            onScroll={() => setShowScrollCapture(true)}
          />
        )}

        {!results && !loading && parts.length > 0 && (
          <PartsPreview
            parts={parts}
            onAdd={() => cameraRef.current?.click()}
            onRemove={(i) => setParts(prev => prev.filter((_, j) => j !== i))}
            onScan={scan}
            loading={loading}
          />
        )}

        {loading && <LoadingScreen partsCount={parts.length} />}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-red-700 text-sm">{error}</p>
              <button onClick={reset} className="text-red-500 text-xs mt-1 underline">נסה שוב</button>
            </div>
          </div>
        )}

        {isEditing && results && <EditItemsView items={editItems} onConfirm={(confirmedItems) => { setResults((prev: any) => ({ ...prev, items: confirmedItems })); setIsEditing(false); }} onCancel={() => { setResults(null); setEditItems([]); setIsEditing(false); setParts([]); }} />}
        {!isEditing && results && <ResultsView results={results} onReset={reset} />}

        <div className="mt-8">
          <HistorySection user={user} onLogin={() => setShowAuth(true)} />
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*;capture=camera" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = ''; }} />
      <input ref={galleryRef} type="file" accept="image/*,application/pdf" multiple className="hidden"
        onChange={(e) => { Array.from(e.target.files || []).forEach(f => addFile(f)); e.target.value = ''; }} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={(u) => { setUser(u); setShowAuth(false); }} />}
      {showScrollCapture && (
        <GuidedCapture
          onCapture={(frames) => {
            setShowScrollCapture(false);
            setParts(frames.map(b => ({ url: '', base64: b })));
          }}
          onCancel={() => setShowScrollCapture(false)}
        />
      )}
    </div>
  );
}
