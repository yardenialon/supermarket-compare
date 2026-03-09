'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const PushToggle = dynamic(() => import('./PushNotifications'), { ssr: false });

export default function HamburgerMenu({ listCount = 0 }: { listCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handler = () => setMenuOpen(true);
    document.addEventListener('open-hamburger', handler);
    return () => document.removeEventListener('open-hamburger', handler);
  }, []);
  const [menuPage, setMenuPage] = useState<"about"|"privacy"|"contact"|null>(null);

  const close = () => { setMenuOpen(false); setMenuPage(null); };

  return (
    <>
      <button onClick={() => setMenuOpen(!menuOpen)} className="fixed top-3 right-3 z-[60] w-10 h-10 rounded-xl bg-white/90 backdrop-blur border border-stone-200 shadow-md flex flex-col items-center justify-center gap-1 hover:bg-stone-50 transition-all">
        {menuOpen ? <span className="text-stone-600 text-xl font-bold">✕</span> : <><span className="w-5 h-0.5 bg-stone-600 rounded-full"></span><span className="w-5 h-0.5 bg-stone-600 rounded-full"></span><span className="w-5 h-0.5 bg-stone-600 rounded-full"></span></>}
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={close}>
          <div className="absolute top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="pt-16 px-5 pb-6">
              <div className="flex justify-center mb-6"><img src="/icons/savy-logo.png" alt="Savy" className="h-14 object-contain" /></div>

              {!menuPage ? (
                <nav className="space-y-1">
                  <a href="/" onClick={close} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">🔍</span><span className="font-bold text-stone-700">חיפוש מוצרים</span>
                  </a>
                  <a href="/?tab=list" onClick={close} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">🛒</span><span className="font-bold text-stone-700">הסל שלי</span>
                    {listCount > 0 && <span className="mr-auto bg-emerald-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">{listCount}</span>}
                  </a>
                  <a href="/?tab=list&loc=nearby" onClick={close} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right hover:bg-emerald-50 transition-colors">
                    <span className="text-xl">📍</span><span className="font-bold text-emerald-700">איפה הכי זול?</span>
                  </a>

                  <div className="border-t border-stone-100 my-3"></div>

                  <a href="/receipt" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">🧾</span><span className="text-stone-600">סריקת קבלה</span>
                  </a>
                  <a href="/deals" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-lg">🏷️</span>
                    <div className="text-right"><div className="text-sm font-semibold text-stone-700">מבצעים</div><div className="text-xs text-stone-400">מבצעים לפי רשת</div></div>
                  </a>
                  <a href="/online" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">🛒</span><span className="text-stone-600">קניות אונליין</span>
                  </a>
                  <a href="/status" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="relative flex h-5 w-5 items-center justify-center"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                    <span className="text-stone-600">סטטוס מערכת</span>
                  </a>
                  <button onClick={() => setMenuPage('about')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">ℹ️</span><span className="text-stone-600">אודות Savy</span>
                  </button>
                  <button onClick={() => setMenuPage('privacy')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">🔒</span><span className="text-stone-600">מדיניות פרטיות</span>
                  </button>
                  <button onClick={() => setMenuPage('contact')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">✉️</span><span className="text-stone-600">צור קשר</span>
                  </button>
                  <a href="/terms" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">📄</span><span className="text-stone-600">תנאי שימוש</span>
                  </a>
                  <a href="/accessibility" onClick={close} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
                    <span className="text-xl">♿</span><span className="text-stone-600">הצהרת נגישות</span>
                  </a>

                  <div className="border-t border-stone-100 my-3"></div>

                  <button onClick={() => { window.open('https://wa.me/?text=' + encodeURIComponent('🛒 גילית את Savy — אפליקציה שמשווה מחירים בכל הסופרים בישראל ומראה לך איפה הכי זול!\n\n👉 https://savy.co.il'), '_blank'); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="font-bold text-[#25D366]">שתף את Savy לחברים</span>
                  </button>

                  <PushToggle />

                  <div className="border-t border-stone-100 mt-3 pt-4">
                    <p className="text-xs text-stone-400 text-center mb-3">עקבו אחרינו</p>
                    <div className="flex items-center justify-center gap-3">
                      <a href="https://www.facebook.com/profile.php?id=61588513298725" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                      <a href="https://www.instagram.com/savy.co.il" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#10b981" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#10b981" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="#10b981"/></svg>
                      </a>
                      <a href="https://www.tiktok.com/@savy.co.il" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/></svg>
                      </a>
                      <a href="https://www.youtube.com/@SAVYCOIL" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="#10b981" strokeWidth="2"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"/></svg>
                      </a>
                    </div>
                  </div>
                </nav>
              ) : menuPage === 'about' ? (
                <div>
                  <button onClick={() => setMenuPage(null)} className="flex items-center gap-2 text-stone-400 text-sm mb-4 hover:text-stone-600"><span>→</span> חזרה</button>
                  <h3 className="font-black text-xl text-stone-800 mb-3">אודות Savy</h3>
                  <div className="text-stone-600 text-sm leading-relaxed space-y-3">
                    <p><strong>Savy</strong> היא פלטפורמה ישראלית להשוואת מחירי סופרמרקט שנועדה לחסוך לכם כסף בקניות היומיומיות.</p>
                    <p>אנחנו משווים מחירים מ-<strong>17+ רשתות שיווק</strong> ברחבי ישראל, כולל שופרסל, רמי לוי, ויקטורי, מגה, אושר עד, טיב טעם ועוד.</p>
                    <p>המערכת מכילה <strong>מעל 6.5 מיליון מחירים</strong> שמתעדכנים באופן יומי מנתוני שקיפות המחירים של משרד הכלכלה.</p>
                    <p>בנו רשימת קניות, והמערכת תמצא לכם את החנות הכי זולה — גם לפי מיקום!</p>
                    <p className="text-emerald-600 font-bold">Savy — כי מגיע לכם לדעת.</p>
                  </div>
                </div>
              ) : menuPage === 'privacy' ? (
                <div>
                  <button onClick={() => setMenuPage(null)} className="flex items-center gap-2 text-stone-400 text-sm mb-4 hover:text-stone-600"><span>→</span> חזרה</button>
                  <h3 className="font-black text-xl text-stone-800 mb-3">מדיניות פרטיות</h3>
                  <div className="text-stone-600 text-sm leading-relaxed space-y-3">
                    <p><strong>איסוף נתונים:</strong> Savy אוספת נתוני מיקום רק כשאתם מאשרים, ורק לצורך חיפוש חנויות קרובות.</p>
                    <p><strong>רשימת קניות:</strong> הרשימה שלכם נשמרת מקומית במכשיר בלבד (localStorage).</p>
                    <p><strong>רשימות משותפות:</strong> כשאתם משתפים רשימה בוואטסאפ, היא נשמרת בשרת עם מזהה ייחודי.</p>
                    <p><strong>אנליטיקס:</strong> אנו משתמשים ב-Google Analytics לשיפור השירות. המידע אנונימי.</p>
                    <p><strong>מקורות מידע:</strong> כל המחירים מגיעים מנתוני שקיפות מחירים שרשתות השיווק מחויבות לפרסם על פי חוק.</p>
                  </div>
                </div>
              ) : menuPage === 'contact' ? (
                <div>
                  <button onClick={() => setMenuPage(null)} className="flex items-center gap-2 text-stone-400 text-sm mb-4 hover:text-stone-600"><span>→</span> חזרה</button>
                  <h3 className="font-black text-xl text-stone-800 mb-3">צור קשר</h3>
                  <div className="text-stone-600 text-sm leading-relaxed space-y-4">
                    <p>נשמח לשמוע מכם! אם יש לכם שאלות, הצעות לשיפור, או דיווח על בעיה:</p>
                    <a href="mailto:info@savy.co.il" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                      <span className="text-xl">📧</span><span className="font-bold text-stone-700">info@savy.co.il</span>
                    </a>
                    <a href="https://wa.me/972555635578" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors">
                      <span className="text-xl">💬</span><span className="font-bold text-[#25D366]">WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
