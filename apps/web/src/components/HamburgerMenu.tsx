'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const PushToggle = dynamic(() => import('./PushNotifications'), { ssr: false });

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconReceipt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" /><path d="M8 10h8M8 14h5" />
  </svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
const IconBasket = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IconStatus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconChevronBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 opacity-25">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── NavItem ────────────────────────────────────────────────────────────────────
function NavItem({
  icon, label, sublabel, badge, highlight, pulse, href, onClick,
}: {
  icon?: React.ReactNode; label: string; sublabel?: string; badge?: React.ReactNode;
  highlight?: boolean; pulse?: boolean; href?: string; onClick?: () => void;
}) {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
        ${highlight ? 'text-white' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
      style={highlight ? { background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.28)' } : {}}
      onClick={onClick}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
        ${highlight ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
        {pulse ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        ) : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm leading-tight ${highlight ? 'text-white' : ''}`}>{label}</div>
        {sublabel && <div className={`text-xs mt-0.5 ${highlight ? 'text-white/65' : 'text-gray-400'}`}>{sublabel}</div>}
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
      <IconChevronRight />
    </div>
  );

  return href
    ? <a href={href} onClick={onClick}>{content}</a>
    : content;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function HamburgerMenu({ listCount = 0 }: { listCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false); // controls DOM presence after close animation
  const [menuPage, setMenuPage] = useState<'about' | 'contact' | null>(null);

  useEffect(() => {
    const handler = () => {
      setVisible(true);
      // tiny delay so browser paints the initial translateX(100%) before we animate in
      requestAnimationFrame(() => requestAnimationFrame(() => setMenuOpen(true)));
    };
    document.addEventListener('open-hamburger', handler);
    return () => document.removeEventListener('open-hamburger', handler);
  }, []);

  const close = () => {
    setMenuOpen(false);
    setMenuPage(null);
    // wait for the transition to finish before removing from DOM
    setTimeout(() => setVisible(false), 320);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[55] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
        onClick={close}
      />

      {/* Drawer */}
      <div
        dir="rtl"
        className="fixed top-0 right-0 z-[56] h-full w-72 sm:w-80 flex flex-col shadow-2xl"
        style={{
          background: 'linear-gradient(160deg,#ffffff 0%,#f0fdf4 100%)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
          <img src="/icons/savy-logo.png" alt="Savy" className="h-8 object-contain" />
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-3 py-3">

          {/* ── Main nav ── */}
          {!menuPage && (
            <>
              {/* Core */}
              <NavItem icon={<IconSearch />} label="חיפוש מוצרים" href="/" onClick={close} />
              <NavItem
                icon={<IconCart />}
                label="הסל שלי"
                href="/?tab=list"
                onClick={close}
                badge={listCount > 0
                  ? <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">{listCount}</span>
                  : undefined}
              />
              <NavItem
                icon={<IconPin />}
                label="איפה הכי זול?"
                href="/?tab=list&loc=nearby"
                onClick={close}
                badge={<span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">📍</span>}
              />

              {/* Smart tools */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 pt-4 pb-1.5">כלים חכמים</p>
              <NavItem icon={<IconReceipt />} label="סריקת קבלה" sublabel="AI מנתח את הקבלה שלך" href="/receipt" onClick={close} highlight />
              <NavItem
                icon={<IconTag />}
                label="מבצעים"
                sublabel="מבצעים לפי רשת"
                href="/deals"
                onClick={close}
                badge={<span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 font-semibold">🔥</span>}
              />
              <NavItem icon={<IconBasket />} label="סל ירקות ופירות" sublabel="השווה מחירי תוצרת טרייה" href="/produce" onClick={close} />

              {/* Info */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 pt-4 pb-1.5">מידע</p>
              <NavItem pulse label="סטטוס מערכת" href="/status" onClick={close} />
              <NavItem icon={<IconInfo />} label="אודות Savy" onClick={() => setMenuPage('about')} />
              <NavItem icon={<IconMail />} label="צור קשר" onClick={() => setMenuPage('contact')} />

              {/* Divider */}
              <div className="my-3 border-t border-gray-100" />

              {/* WhatsApp share */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'rgba(37,211,102,0.09)' }}
                onClick={() => {
                  window.open(
                    'https://wa.me/?text=' + encodeURIComponent('🛒 גילית את Savy — אפליקציה שמשווה מחירים בכל הסופרים בישראל ומראה לך איפה הכי זול!\n\n👉 https://savy.co.il'),
                    '_blank'
                  );
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,211,102,0.18)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm" style={{ color: '#25D366' }}>שתף את Savy לחברים</span>
              </div>

              {/* Push notifications */}
              <div className="mt-1"><PushToggle /></div>

              {/* Social */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-3">עקבו אחרינו</p>
                <div className="flex items-center justify-center gap-2">
                  {[
                    { href: 'https://www.facebook.com/profile.php?id=61588513298725', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                    { href: 'https://www.instagram.com/savy.co.il', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#10b981" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#10b981" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="#10b981"/></svg> },
                    { href: 'https://www.tiktok.com/@savy.co.il', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/></svg> },
                    { href: 'https://www.youtube.com/@SAVYCOIL', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="#10b981" strokeWidth="2"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"/></svg> },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                      {s.svg}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── About page ── */}
          {menuPage === 'about' && (
            <div>
              <button onClick={() => setMenuPage(null)} className="flex items-center gap-1.5 text-gray-400 text-sm mb-5 hover:text-gray-600 transition-colors">
                <IconChevronBack /> חזרה
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><IconInfo /></div>
                <h3 className="font-black text-xl text-gray-800">אודות Savy</h3>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed space-y-3">
                <p><strong>Savy</strong> היא פלטפורמה ישראלית להשוואת מחירי סופרמרקט שנועדה לחסוך לכם כסף בקניות היומיומיות.</p>
                <p>אנחנו משווים מחירים מ-<strong>25+ רשתות שיווק</strong> ברחבי ישראל, כולל שופרסל, רמי לוי, ויקטורי, מגה, אושר עד, טיב טעם ועוד.</p>
                <p>המערכת מכילה <strong>מעל 7.5 מיליון מחירים</strong> שמתעדכנים באופן יומי מנתוני שקיפות המחירים של משרד הכלכלה.</p>
                <p>בנו רשימת קניות, והמערכת תמצא לכם את החנות הכי זולה — גם לפי מיקום!</p>
                <p className="text-emerald-600 font-bold">Savy — כי מגיע לכם לדעת.</p>
              </div>
            </div>
          )}

          {/* ── Contact page ── */}
          {menuPage === 'contact' && (
            <div>
              <button onClick={() => setMenuPage(null)} className="flex items-center gap-1.5 text-gray-400 text-sm mb-5 hover:text-gray-600 transition-colors">
                <IconChevronBack /> חזרה
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><IconMail /></div>
                <h3 className="font-black text-xl text-gray-800">צור קשר</h3>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed space-y-3">
                <p>נשמח לשמוע מכם! שאלות, הצעות לשיפור, או דיווח על בעיה:</p>
                <a href="mailto:info@savy.co.il"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><IconMail /></span>
                  <span className="font-bold text-gray-700">info@savy.co.il</span>
                </a>
                <a href="https://wa.me/972555635578" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ background: 'rgba(37,211,102,0.09)' }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,211,102,0.18)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  <span className="font-bold" style={{ color: '#25D366' }}>WhatsApp</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 text-center flex-shrink-0" style={{ borderTop: '1px solid rgba(16,185,129,0.12)' }}>
          <p className="text-[10px] text-gray-300">Savy © {new Date().getFullYear()} · השוואת מחירי סופרמרקט</p>
        </div>
      </div>
    </>
  );
}
