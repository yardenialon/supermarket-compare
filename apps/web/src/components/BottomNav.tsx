'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });

const tabs = [
  {
    href: '/',
    label: 'בית',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#d1fae5' : 'none'} />
      </svg>
    ),
  },
  {
    href: '/?tab=search',
    label: 'חיפוש',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" />
        <path d="M21 21L16.65 16.65"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/deals',
    label: 'מבצעים',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#d1fae5' : 'none'} />
        <circle cx="7" cy="7" r="1.5"
          fill={active ? '#059669' : '#9ca3af'} />
      </svg>
    ),
  },
  {
    href: '/?tab=list',
    label: 'רשימה',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 6h11M9 12h11M9 18h11"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="6" r="1.5" fill={active ? '#059669' : '#9ca3af'} />
        <circle cx="4" cy="12" r="1.5" fill={active ? '#059669' : '#9ca3af'} />
        <circle cx="4" cy="18" r="1.5" fill={active ? '#059669' : '#9ca3af'} />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const handleScan = (barcode: string) => {
    setScannerOpen(false);
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
    fetch(`${API}/search?q=${barcode}&limit=20`)
      .then(r => r.json())
      .then(d => {
        const results = d.results || [];
        const match = results.find((p: any) => p.barcode === barcode) || results[0];
        if (match) router.push(`/product/${match.id}`);
        else router.push(`/?q=${barcode}`);
      })
      .catch(() => router.push(`/?q=${barcode}`));
  };

  return (
    <>
      {/* spacer */}
      <div className="h-20 md:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir="rtl">
        {/* רקע */}
        <div className="absolute inset-0 bg-white/92 backdrop-blur-xl border-t border-gray-100" />

        <div className="relative flex items-end justify-around px-1 pb-safe pt-2 h-16">
          {tabs.map((tab) => {
            const isActive =
              tab.href === '/'
              ? pathname === '/' && !searchParams?.get('tab')
              : tab.href.includes('?tab=')
              ? pathname === '/' && searchParams?.get('tab') === tab.href.split('tab=')[1]
              : pathname.startsWith(tab.href.split('?')[0]) && tab.href !== '/';

            return (
              <a key={tab.href} href={tab.href}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 active:scale-95 transition-transform">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-emerald-50' : 'bg-transparent'
                }`}>
                  {tab.icon(isActive)}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-600 font-semibold' : 'text-gray-400'
                }`}>
                  {tab.label}
                </span>
              </a>
            );
          })}
          {/* כפתור סריקה בולט — חמישי */}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1 active:scale-95 transition-transform"
            style={{marginTop: '-20px'}}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200 border-4 border-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 5h2v14H3zM7 5h1v14H7zM10 5h2v14h-2zM14 5h1v14h-1zM17 5h1v14h-1zM20 5h1v14h-1z"/>
                <path d="M1 3h4v3" strokeWidth="2"/>
                <path d="M23 3h-4v3" strokeWidth="2"/>
                <path d="M1 21h4v-3" strokeWidth="2"/>
                <path d="M23 21h-4v-3" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600">סריקה</span>
          </button>
        </div>
        {scannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}
      </nav>
    </>
  );
}
