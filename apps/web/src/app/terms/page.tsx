import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תנאי שימוש | Savy",
  description: "תנאי השימוש של פלטפורמת Savy — השוואת מחירי סופרמרקט בישראל.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-stone-400 hover:text-stone-700 text-sm font-semibold flex items-center gap-1.5">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </a>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">תנאי שימוש</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
        <h1 className="font-black text-3xl text-emerald-700 mb-2 text-center">תנאי שימוש – פלטפורמת SAVY</h1>
        <p className="text-center text-stone-400 text-sm mb-10">עדכון אחרון: מרץ 2026</p>

        <p className="text-stone-600 mb-4">ברוכים הבאים ל-SAVY (savy.co.il). אנו שמחים שבחרתם להשתמש בפלטפורמה שלנו כדי להשוות מחירים, לחסוך כסף ולעשות קניות חכמות יותר.</p>
        <p className="text-stone-600 mb-4">לפני תחילת השימוש באתר ו/או באפליקציה (להלן: "הפלטפורמה"), אנא קראו בעיון את תנאי השימוש להלן. עצם הכניסה ל-SAVY והשימוש בשירותים ובמידע המוצגים בה, מהווים את הסכמתכם המלאה לתנאים אלו ולמדיניות הפרטיות שלנו. אם אינכם מסכימים לתנאים, הנכם מתבקשים שלא לעשות שימוש בפלטפורמה.</p>
        <p className="text-stone-400 text-sm italic mb-10">האמור בתקנון זה מנוסח בלשון זכר מטעמי נוחות בלבד, אך מתייחס באופן שווה לכל המגדרים.</p>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">1. מי אנחנו ומה אנחנו עושים?</h2>
          <p className="text-stone-600 mb-3">תנאי השימוש מסדירים את היחסים שבין SAVY בע"מ, מפעילת פלטפורמת SAVY (להלן: "החברה") לבין כל אדם או ישות העושים שימוש בפלטפורמה (להלן: "המשתמש").</p>
          <p className="text-stone-600">SAVY היא מנוע חיפוש והשוואת מחירים. אנו אוספים ומנגישים מידע ומחירים שמקורם ברשתות שיווק המזון, המחויבות לפרסם את מחיריהן ברשת על פי "חוק קידום התחרות בענף המזון" (להלן: "חוק המזון").</p>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">2. אנחנו מנגישים את המידע – אבל לא קובעים את המחיר</h2>
          <p className="text-stone-600 mb-3">המחירים, המבצעים ופרטי המוצרים המוצגים ב-SAVY נשאבים ישירות מהנתונים שרשתות המזון מפרסמות, והם מוצגים "כפי שהם" (As-Is).</p>
          <ul className="list-disc list-inside space-y-2 text-stone-600 mr-4">
            <li>SAVY אינה חנות: איננו מוכרים מוצרים, איננו ספקים, ואנחנו לא אחראים למלאי בסניפים.</li>
            <li>האחריות על רשתות המזון: קביעת המחירים, עדכונם וזמינות המוצרים על המדף הם באחריותן הבלעדית של רשתות השיווק. החברה אינה אחראית לדיוק הנתונים, לאיחור בעדכונים מצד הרשתות, או לפערים בין תמונת המוצר בפלטפורמה לבין המוצר בפועל.</li>
            <li>המחיר הקובע הוא בקופה: כל הסתמכות על המחירים המוצגים ב-SAVY נעשית על אחריות המשתמש בלבד. במידה ומצאתם פער בין המחיר ב-SAVY לבין המחיר שנדרשתם לשלם בסניף הרשת, הפנייה והדרישה צריכות להיות מופנות אל רשת המזון בלבד.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">3. שימוש אישי בלבד ואיסור על כריית נתונים (Scraping)</h2>
          <p className="text-stone-600 mb-3">המערכת של SAVY נועדה לסייע לצרכנים לחסוך כסף בשימוש אישי ופרטי בלבד.</p>
          <ul className="list-disc list-inside space-y-2 text-stone-600 mr-4">
            <li>חל איסור מוחלט לעשות שימוש מסחרי בנתונים המוצגים ב-SAVY ללא אישור מראש ובכתב מהחברה.</li>
            <li>המשתמש מתחייב שלא להפעיל תוכנות רובוטיות, כלים אוטומטיים (Bots, Scrapers) או כל אמצעי אחר כדי לאסוף, להעתיק, או לשכפל נתונים ומחירים מתוך הפלטפורמה.</li>
            <li>חל איסור לבצע כל פעולה העלולה לייצר עומס בלתי סביר על שרתי SAVY או לעקוף את אמצעי האבטחה של המערכת.</li>
            <li>הפרה של סעיף זה תוביל לחסימה מיידית, ותקים לחברה זכות לנקוט בצעדים משפטיים.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">4. זכויות יוצרים וקניין רוחני</h2>
          <p className="text-stone-600 mb-3">השקענו משאבים רבים בתכנון חוויית המשתמש, העיצוב והמערכות הטכנולוגיות של SAVY.</p>
          <p className="text-stone-600">כל זכויות הקניין הרוחני בפלטפורמה – לרבות עיצוב ה-UI/UX, קוד המקור, לוגו המותג, אלגוריתם החיפוש, בסיסי הנתונים והסודות המסחריים – שייכות באופן בלעדי לחברה. אין להעתיק, לשכפל, להפיץ, לתרגם, לבצע הנדסה לאחור (Reverse Engineering) או ליצור יצירות נגזרות מתוך הפלטפורמה ללא אישור מפורש בכתב.</p>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">5. הגבלת אחריות</h2>
          <p className="text-stone-600">החברה, מנהליה ועובדיה לא יישאו בשום אחריות, ישירה או עקיפה, לכל נזק, הפסד, הוצאה או עוגמת נפש שייגרמו למשתמש כתוצאה משימוש ב-SAVY, כתוצאה מהסתמכות על המידע המופיע בה, או כתוצאה מאי-זמינות זמנית של המערכת.</p>
        </section>

        <section className="mb-8">
          <h2 className="font-black text-xl text-emerald-700 mb-3">6. עדכונים ושינויים</h2>
          <p className="text-stone-600">אנו שומרים לעצמנו את הזכות לעדכן או לשנות את תנאי השימוש, את ממשק הפלטפורמה ואת השירותים המוצעים בה בכל עת, על פי שיקול דעתנו הבלעדי וללא הודעה מוקדמת. תנאי השימוש המעודכנים יחייבו מרגע פרסומם בפלטפורמה.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-black text-xl text-emerald-700 mb-3">7. סמכות שיפוט</h2>
          <p className="text-stone-600">על תנאי שימוש אלו יחולו דיני מדינת ישראל בלבד. מקום השיפוט הבלעדי בגין כל סכסוך או עניין הנובע משימוש ב-SAVY יהיה בבתי המשפט המוסמכים במחוז תל אביב.</p>
        </section>

        <div className="border-t border-emerald-200 pt-8 text-center">
          <p className="font-bold text-emerald-700 mb-2">יש לכם שאלות? מצאתם באג? סתם רוצים לספר לנו כמה חסכתם?</p>
          <p className="text-stone-600">נשמח לשמוע מכם: <a href="mailto:info@savy.co.il" className="font-bold text-emerald-600 hover:underline">info@savy.co.il</a></p>
        </div>
      </div>
    </div>
  );
}
