'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { id: number; phone: string; name?: string }) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setError('');
    if (!phone.trim()) return setError('נא להזין מספר טלפון');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'שגיאה בשליחה');
      setNormalizedPhone(data.phone);
      setStep('otp');
    } catch {
      setError('שגיאת רשת, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    if (otp.length !== 6) return setError('קוד חייב להיות 6 ספרות');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalizedPhone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'קוד שגוי');
      onSuccess(data.user);
    } catch {
      setError('שגיאת רשת, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🛒</div>
          <h2 className="text-xl font-bold text-stone-800">כניסה ל-Savy</h2>
          <p className="text-sm text-stone-500 mt-1">
            {step === 'phone' ? 'נשלח לך קוד אימות בוואטסאפ' : `שלחנו קוד ל-${normalizedPhone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <>
            <div className="mb-4">
              <input
                type="tel"
                placeholder="מספר טלפון (05X-XXXXXXX)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-stone-800"
                dir="ltr"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'שולח...' : 'שלח קוד בוואטסאפ 📲'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-400 text-stone-800"
                dir="ltr"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'מאמת...' : 'כניסה ✓'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full mt-2 text-sm text-stone-400 hover:text-stone-600 py-2"
            >
              ← שנה מספר
            </button>
          </>
        )}

        <p className="text-xs text-stone-300 text-center mt-4">
          בכניסה אתה מסכים לתנאי השימוש
        </p>
      </div>
    </div>
  );
}
