'use client';
import { usePathname } from 'next/navigation';

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
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

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
        </div>
      </nav>
    </>
  );
}
