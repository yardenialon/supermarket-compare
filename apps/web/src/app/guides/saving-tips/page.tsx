import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";
import { chainByName } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("saving-tips")!;

async function getIndexGap(): Promise<{ gapPct: number; cheapHe: string } | null> {
  try {
    const res = await fetch(`${API}/price-index`, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const chains = data.chains ?? [];
    if (chains.length < 2) return null;
    const cheap = chains[0], exp = chains[chains.length - 1];
    return {
      gapPct: Math.round((Number(exp.avgPrice) / Number(cheap.avgPrice) - 1) * 100),
      cheapHe: cheap.chainHe || chainByName(cheap.chain)?.he || cheap.chain,
    };
  } catch { return null; }
}

export const metadata: Metadata = guideMetadata(g);

interface Tip { title: string; body: React.ReactNode }

export default async function SavingTipsGuide() {
  const idx = await getIndexGap();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const gap = idx?.gapPct ?? 25;

  const faq = [
    { q: "כמה אפשר לחסוך בקניות הסופר בחודש?", a: `משפחה שמוציאה כ-4,000 ₪ בחודש יכולה לחסוך 10%-20% — כלומר 400-800 ₪ בחודש — משילוב של בחירת רשת נכונה (הפרש של כ-${gap}% בין הרשתות על סל היסוד), ניצול מבצעים והשוואת מחיר ליחידה.` },
    { q: "מה הטעות הכי יקרה שצרכנים עושים בסופר?", a: "נאמנות עיוורת לרשת אחת. ההפרשים בין הרשתות על אותו סל בדיוק מגיעים לעשרות אחוזים, והרשת שהכי משתלמת לסל של משפחה אחת אינה בהכרח המשתלמת לסל של אחרת." },
    { q: "האם קניות אונליין יקרות יותר מקניות בסניף?", a: "לרוב המחירים אונליין דומים או מעט גבוהים יותר, ונוספים דמי משלוח — אבל קנייה אונליין מקטינה קניות אימפולס, ולכן בפועל משפחות רבות דווקא חוסכות. חשוב להשוות את הסל המלא לפני שמזמינים." },
  ];

  const tips: Tip[] = [
    { title: "1. תבחרו רשת לפי נתונים, לא לפי הרגל", body: <>ההפרש בין הרשת הזולה ליקרה על סל היסוד עומד היום על כ-<strong>{gap}%</strong>{idx ? <> (הזולה כרגע: {idx.cheapHe})</> : null}. זו ההחלטה הכלכלית הגדולה ביותר שלכם בסופר — <a href="/guides/cheapest-supermarket" className="text-emerald-600 hover:underline font-semibold">ראו את הדירוג המלא</a>.</> },
    { title: "2. השוו את הסל שלכם, לא סל גנרי", body: <>הרשת הזולה בממוצע אינה בהכרח הזולה לסל <em>שלכם</em>. <a href="/online" className="text-emerald-600 hover:underline font-semibold">הזינו את הרשימה שלכם ב-Savy</a> וגלו איפה היא הכי זולה — ההפרשים מפתיעים.</> },
    { title: "3. מחיר ליחידה — הכלל שהסופר מקווה שלא תכירו", body: <>אריזות בגדלים שונים נועדו לבלבל. תמיד חשבו מחיר ל-100 גרם / ליטר / יחידה (מופיע באותיות קטנות על תו המדף). אריזת ה"חיסכון" הגדולה לפעמים יקרה יותר ליחידה.</> },
    { title: "4. מבצעי מולטי-פאק — רק על מה שממילא קונים", body: <>"3 ב-100" חוסך רק אם הייתם קונים שלושה. על מוצרים שאינם מתכלים (ניקיון, שימורים, חיתולים) — מבצע טוב הוא הזדמנות הצטיידות. <a href="/deals" className="text-emerald-600 hover:underline font-semibold">כל המבצעים החיים כאן</a>.</> },
    { title: "5. דעו את מחירי הפיקוח", body: <>לחם, חלב, חמאה, ביצים וגבינה לבנה — למוצרים אלה יש מחיר מרבי בחוק, ורשתות רבות מוכרות מתחתיו. <a href="/guides/price-controlled-products" className="text-emerald-600 hover:underline font-semibold">הרשימה המלאה</a>.</> },
    { title: "6. מותג פרטי במקום מותג-על", body: <>במוצרי בסיס (קמח, סוכר, אורז, מוצרי ניקיון) המותג הפרטי של הרשת זול ב-20%-40% ולרוב מיוצר באותם מפעלים. התחילו ממוצרים שבהם ההבדל בטעם לא מורגש.</> },
    { title: "7. סרקו קבלות — הדאטה של עצמכם", body: <><a href="/receipt" className="text-emerald-600 hover:underline font-semibold">סריקת קבלה ב-Savy</a> מראה לכם כמה הייתם משלמים על אותו סל ברשתות אחרות. אחרי 2-3 קבלות תדעו בדיוק כמה הנאמנות שלכם עולה.</> },
    { title: "8. רשימה מראש — ובטן מלאה", body: <>קנייה בלי רשימה מגדילה את הסל ב-10%-30% (קניות אימפולס). הכינו <a href="/?tab=list" className="text-emerald-600 hover:underline font-semibold">רשימת קניות</a> מראש, ואל תיכנסו לסופר רעבים.</> },
    { title: "9. שימו לב לירידות מחיר עונתיות", body: <>ירקות ופירות בעונה זולים בעשרות אחוזים. <a href="/produce" className="text-emerald-600 hover:underline font-semibold">מחירי הירקות והפירות היומיים</a> יגידו לכם מה שווה השבוע.</> },
    { title: "10. אל תשלמו על מיקום עיניים", body: <>המוצרים בגובה העיניים הם היקרים ביותר במדף — המיקום הזה נמכר לספקים. הזולים למטה ולמעלה. שווה להתכופף.</> },
    { title: "11. בדקו את הקבלה ואת תו המדף", body: <>טעויות במחיר בקופה קורות. בישראל, אם המחיר בקופה גבוה מתו המדף — אתם זכאים למחיר הנמוך. צלמו תו מדף במוצרים יקרים.</> },
    { title: "12. פעם בחודש — ביקורת רשת", body: <>מבצעים ומדיניות מחירים משתנים כל הזמן. קבעו תזכורת חודשית לבדוק את <a href="/price-index" className="text-emerald-600 hover:underline font-semibold">מדד המחירים</a> — ייתכן שהרשת המשתלמת עבורכם התחלפה.</> },
  ];

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd(g, faq)) }} />
      <article className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a><span className="mx-1">›</span>
          <a href="/guides" className="hover:text-emerald-600">מדריכים</a><span className="mx-1">›</span>
          <span className="text-stone-500">{g.title}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">{g.emoji} {g.title}</h1>
        <div className="text-xs text-stone-400 mb-5">עודכן: {today} · המספרים מבוססים על נתוני מחירים חיים</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          <p>
            משפחה ממוצעת בישראל מוציאה אלפי שקלים בחודש בסופר — וההפרש בין הרשת הזולה ליקרה על סל יסוד זהה עומד היום
            על כ-<strong className="text-emerald-700">{gap}%</strong>. המשמעות: חיסכון של 400–800 ₪ בחודש הוא יעד ריאלי,
            בלי לוותר על שום מוצר. הנה 12 הטכניקות שעובדות, מסודרות לפי גודל ההשפעה.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          {tips.map((t) => (
            <div key={t.title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <h2 className="font-black text-base text-stone-800 mb-1.5">{t.title}</h2>
              <p className="text-sm text-stone-600 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-8 text-sm text-stone-600 leading-relaxed space-y-4">
          <h2 className="font-black text-xl text-stone-800">שאלות נפוצות</h2>
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-bold text-stone-700">{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <section className="text-sm">
          <h2 className="font-black text-lg text-stone-800 mb-3">להמשך קריאה</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/guides/cheapest-supermarket" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">איזה סופר הכי זול בישראל?</a>
            <a href="/guides/family-food-budget" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה מוציאה משפחה על אוכל?</a>
            <a href="/guides/basic-basket-cost" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה סל קניות בסיסי?</a>
          </div>
        </section>
      </article>
    </div>
  );
}
