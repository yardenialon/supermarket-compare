import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הצהרת נגישות | Savy",
  description: "הצהרת הנגישות של פלטפורמת Savy בהתאם לתקן הישראלי לנגישות אתרי אינטרנט.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-stone-400 hover:text-stone-700 text-sm font-semibold">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </a>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">הצהרת נגישות</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
        <h1 className="font-black text-3xl text-emerald-700 mb-2 text-center">הצהרת נגישות</h1>
        <p className="text-center text-stone-400 text-sm mb-10">עדכון אחרון: מרץ 2026</p>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">מחויבותנו לנגישות</h2>
          <p className="text-stone-600 mb-3">SAVY מחויבת לאפשר את השימוש בפלטפורמה לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (תשנ"ח-1998) ותקנות הנגישות.</p>
          <p className="text-stone-600">אנו שואפים לעמוד בדרישות תקן ישראלי 5568 (המבוסס על WCAG 2.1 ברמה AA).</p>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">אמצעי הנגישות באתר</h2>
          <ul className="list-disc list-inside space-y-2 text-stone-600 mr-4">
            <li>כפתור נגישות קבוע בפינת המסך</li>
            <li>אפשרות להגדלת טקסט עד 150%</li>
            <li>מצב ניגודיות גבוהה</li>
            <li>הדגשת קישורים</li>
            <li>מצב גווני אפור</li>
            <li>ניווט מלא באמצעות מקלדת</li>
            <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver)</li>
            <li>תגיות alt לכל התמונות</li>
            <li>מבנה כותרות היררכי (H1, H2, H3)</li>
            <li>תווית aria לכל האלמנטים האינטראקטיביים</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">מה לא נגיש עדיין?</h2>
          <p className="text-stone-600 mb-3">אנו עובדים באופן מתמיד על שיפור הנגישות. תחומים שעדיין בתהליך שיפור:</p>
          <ul className="list-disc list-inside space-y-2 text-stone-600 mr-4">
            <li>חלק מהתרשימים והגרפים עדיין אינם נגישים במלואם לקוראי מסך</li>
            <li>חלק מהתוכן הדינמי עשוי לדרוש שיפור</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">יצירת קשר בנושא נגישות</h2>
          <p className="text-stone-600 mb-3">נתקלתם בבעיית נגישות? אנחנו רוצים לדעת ולתקן.</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-stone-700 font-bold mb-1">רכז/ת נגישות SAVY</p>
            <p className="text-stone-600 text-sm">דוא"ל: <a href="mailto:info@savy.co.il" className="text-emerald-600 font-bold hover:underline">info@savy.co.il</a></p>
            <p className="text-stone-400 text-xs mt-2">נשתדל להשיב תוך 5 ימי עסקים</p>
          </div>
        </section>

        <section>
          <h2 className="font-black text-xl text-emerald-700 mb-3">תאריך הצהרה זו</h2>
          <p className="text-stone-600">הצהרה זו עודכנה לאחרונה במרץ 2026.</p>
        </section>
      </div>
    </div>
  );
}
