'use client';
import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // הצג banner אחרי 3 שניות
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS — הצג אחרי 5 שניות אם לא dismissed
    if (ios && !localStorage.getItem('pwa-ios-dismissed')) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    }
  }

  // חשוף פונקציית install גלובלית לשימוש מבאנרים אחרים
  useEffect(() => {
    (window as any).__savyInstallPWA = install;
    (window as any).__savyShowPWABanner = () => setShowBanner(true);
    return () => {
      delete (window as any).__savyInstallPWA;
      delete (window as any).__savyShowPWABanner;
    };
  }, [deferredPrompt]);

  function dismiss() {
    setShowBanner(false);
    localStorage.setItem('pwa-ios-dismissed', '1');
  }

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-4 flex items-center gap-3">
        <img src="/icons/favicon.png" alt="Savy" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-stone-800 text-sm">הוסף את Savy למסך הבית</p>
          {isIOS ? (
            <div className="text-xs text-stone-500 mt-1 space-y-0.5">
              <p>1. לחץ על כפתור השיתוף <span className="inline-block bg-stone-100 rounded px-1 font-bold">⎙</span> בתחתית Safari</p>
              <p>2. בחר <span className="font-bold text-stone-700">״הוסף למסך הבית״</span></p>
            </div>
          ) : (
            <p className="text-xs text-stone-400 mt-0.5">גישה מהירה להשוואת מחירים</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={dismiss} className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1">סגור</button>
          {!isIOS && (
            <button onClick={install} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition">
              התקן
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
