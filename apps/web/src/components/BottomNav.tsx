'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

const tabs = [
  {
    href: '/',
    label: 'בית',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#d1fae5' : 'none'} />
      </svg>
    ),
  },
  {
    href: '/?tab=list',
    label: 'חיפוש',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" />
        <path d="M21 21L16.65 16.65"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/receipt',
    label: 'סריקה',
    icon: (_active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 7V5C4 4.45 4.45 4 5 4H7M17 4H19C19.55 4 20 4.45 20 5V7M20 17V19C20 19.55 19.55 20 19 20H17M7 20H5C4.45 20 4 19.55 4 19V17"
          stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="7" y="9" width="2" height="6" rx="1" fill="white" />
        <rect x="11" y="7" width="2" height="10" rx="1" fill="white" />
        <rect x="15" y="10" width="2" height="4" rx="1" fill="white" />
      </svg>
    ),
    isFab: true,
  },
  {
    href: '/deals',
    label: 'מבצעים',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#d1fae5' : 'none'} />
      </svg>
    ),
  },
  {
    href: '/receipt#history',
    label: 'קבלות',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? '#d1fae5' : 'none'} />
        <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
          stroke={active ? '#059669' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* spacer כדי שהתוכן לא יוסתר */}
      <div className="h-20 md:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir="rtl">
        {/* רקע עם blur */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-stone-100" />

        <div className="relative flex items-end justify-around px-2 pb-safe pt-2 h-16">
          {tabs.map((tab) => {
            const isActive = tab.isFab
              ? pathname === '/receipt'
              : pathname === '/' && tab.href === '/'
              ? true
              : pathname.startsWith(tab.href.split('?')[0]) && tab.href !== '/';

            if (tab.isFab) {
              return (
                <a key={tab.href} href={tab.href}
                  className="flex flex-col items-center -mt-5 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
                    {tab.icon(true)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">{tab.label}</span>
                </a>
              );
            }

            return (
              <a key={tab.href} href={tab.href}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 active:scale-95 transition-transform">
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                  {tab.icon(isActive)}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-600' : 'text-stone-400'}`}>
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
