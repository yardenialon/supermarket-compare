'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { id: number; phone: string; email?: string; name?: string; picture?: string }) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'main' | 'phone' | 'otp'>('main');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        use_fedcm_for_prompt: true,
      });
      (window as any).google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'continue_with', locale: 'he' }
      );
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [step]);

  async function handleGoogleResponse(response: any) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'שגיאה בהתחברות');
      if (data.token) localStorage.setItem('session_token', data.token);
      onSuccess(data.user);
    } catch {
      setError('שגיאת רשת, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

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
      if (data.token) localStorage.setItem('session_token', data.token);
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
        
        <div className="text-center mb-6">
          <img src="/icons/savy-logo.png" alt="Savy" className="h-10 mx-auto mb-3 object-contain" />
          <h2 className="text-xl font-bold text-stone-800">כניסה ל-Savy</h2>
          <p className="text-sm text-stone-500 mt-1">
            {step === 'main' && 'בחר אפשרות התחברות'}
            {step === 'phone' && 'הזן מספר טלפון'}
            {step === 'otp' && `שלחנו קוד ל-${normalizedPhone}`}
          </p>
        </div>

        {step === 'main' && (
          <div className="space-y-3">
            {/* Google */}
            <div id="google-signin-btn" className="w-full flex justify-center" />
            {!GOOGLE_CLIENT_ID && (
              <button disabled className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-xl py-3 text-stone-400 text-sm">
                Google (לא מוגדר)
              </button>
            )}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        )}

        {step === 'phone' && (
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
            <button onClick={sendOtp} disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'שולח...' : 'שלח קוד בוואטסאפ 📲'}
            </button>
            <button onClick={() => setStep('main')} className="w-full mt-2 text-sm text-stone-400 hover:text-stone-600 py-2">
              ← חזרה
            </button>
          </>
        )}

        {step === 'otp' && (
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
            <button onClick={verifyOtp} disabled={loading || otp.length !== 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'מאמת...' : 'כניסה ✓'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full mt-2 text-sm text-stone-400 hover:text-stone-600 py-2">
              ← שנה מספר
            </button>
          </>
        )}

        <p className="text-xs text-stone-300 text-center mt-4">בכניסה אתה מסכים לתנאי השימוש</p>
      </div>
    </div>
  );
}
