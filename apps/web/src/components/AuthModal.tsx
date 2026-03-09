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

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-300">או</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            {/* WhatsApp */}
            <button
              onClick={() => setStep('phone')}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold py-3 rounded-xl transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              המשך עם WhatsApp
            </button>

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
