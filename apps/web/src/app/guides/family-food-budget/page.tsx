import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";
import { chainByName } from "@/lib/chains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("family-food-budget")!;

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

export default async function FamilyFoodBudgetGuide() {
  const idx = await getIndexGap();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const gap = idx?.gapPct ?? 25;

  const faq = [
    { q: "כמה מוציאה משפחה בישראל על אוכל בחודש?", a: "על פי סקר הוצאות משק הבית של הלמ\"ס, ההוצאה החודשית הממוצעת של משק בית על מזון (ללא ארוחות בחוץ) היא כ-2,700 ₪, ומשפחות עם ילדים מוציאות לרוב 3,500-5,000 ₪ ויותר. מזון הוא אחד משלושת סעיפי ההוצאה הגדולים של משק הבית." },
    { q: "האם ההוצאה שלנו על אוכל גבוהה מדי?", a: "המדד הפשוט: חלקו את הוצאת המזון בהכנסה נטו של משק הבית. מעל 20%-25% למשפחה עם הכנסה ממוצעת — כנראה שיש מקום לחיסכון. הדרך המדויקת ביותר לבדוק: לסרוק כמה קבלות ב-Savy ולראות כמה אותו סל היה עולה ברשתות אחרות." },
    { q: "איך מקטינים את הוצאות המזון בלי לוותר על כלום?", a: `שלושת המנופים הגדולים: בחירת רשת לפי נתונים (הפרש של כ-${gap}% בין הרשתות על סל זהה), קנייה לפי רשימה שמנטרלת קניות אימפולס, וניצול מבצעים על מוצרים שממילא נקנים. שילוב של שלושתם מגיע בקלות ל-15%-20% חיסכון.` },
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
        <div className="text-xs text-stone-400 mb-5">עודכן: {today} · נתוני למ"ס לצד מחירים חיים</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          <p>
            משק בית ממוצע בישראל מוציא <strong>כ-2,700 ₪ בחודש על מזון</strong> (ללא ארוחות בחוץ, לפי סקר הוצאות
            משק הבית של הלמ"ס) — ומשפחות עם ילדים מגיעות בקלות ל-4,000–5,000 ₪. זה אחד משלושת סעיפי ההוצאה הגדולים
            של כל משפחה, ולכן גם ההזדמנות הגדולה ביותר לחיסכון: הפרש של כ-{gap}% בין הרשת הזולה ליקרה פירושו
            שחלק ניכר מהסכום הזה — בשליטתכם.
          </p>
        </section>

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">ממה מורכבת ההוצאה — ואיפה החיסכון?</h2>
          <p>
            סל המזון המשפחתי מתחלק בגסות לשלושה: <strong>מוצרי יסוד</strong> (חלב, לחם, ביצים, דגנים — כשליש מהסל),{" "}
            <strong>מוצרים טריים</strong> (ירקות, פירות, בשר ודגים — כשליש נוסף) ו<strong>מותגים ומעובדים</strong>{" "}
            (חטיפים, משקאות, קפואים והשאר). לכל שליש מנוף חיסכון משלו:
          </p>
          <p>
            <strong>במוצרי היסוד</strong> — בחירת הרשת עושה את ההבדל: אלה מוצרים זהים בכל מקום, וההפרש הוא טהור.
            חלקם גם <a href="/guides/price-controlled-products" className="text-emerald-600 hover:underline font-semibold">בפיקוח מחירים</a>.{" "}
            <strong>בטריים</strong> — עונתיות ומקום הקנייה (שוק/רשת דיסקאונט) שווים עשרות אחוזים —{" "}
            <a href="/produce" className="text-emerald-600 hover:underline font-semibold">בדקו את מחירי היום</a>.{" "}
            <strong>במותגים</strong> — מבצעים ומותג פרטי הם המלכים: זה החלק שבו ההפרשים בין קנייה חכמה לרגילה הכי גדולים.
          </p>

          <h2 className="font-black text-xl text-stone-800">איך לדעת אם אתם משלמים יותר מדי?</h2>
          <p>
            במקום לנחש — מדדו. <a href="/receipt" className="text-emerald-600 hover:underline font-semibold">סרקו קבלה אחת מהשבוע האחרון ב-Savy</a>{" "}
            והמערכת תראה לכם כמה בדיוק אותו סל היה עולה בכל רשת אחרת. שתיים-שלוש קבלות מציירות תמונה מדויקת:
            אם ההפרש המצטבר עובר 10% — אתם משלמים "מס נאמנות" של מאות שקלים בחודש.
          </p>

          <h2 className="font-black text-xl text-stone-800">יעד ריאלי: 15%-20% פחות, בלי לוותר על כלום</h2>
          <p>
            משפחה שמוציאה 4,000 ₪ בחודש וחוסכת 15% שומרת בכיס <strong>7,200 ₪ בשנה</strong> — בלי לשנות את מה
            שהיא אוכלת. השילוב המנצח: רשת נכונה ({idx ? `הזולה כרגע: ${idx.cheapHe} — ` : ""}
            <a href="/guides/cheapest-supermarket" className="text-emerald-600 hover:underline font-semibold">הדירוג המלא</a>),
            רשימת קניות קבועה, ו-<a href="/guides/saving-tips" className="text-emerald-600 hover:underline font-semibold">12 הטכניקות שפירטנו במדריך החיסכון</a>.
          </p>
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
            <a href="/guides/basic-basket-cost" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">כמה עולה סל קניות בסיסי?</a>
            <a href="/guides/saving-tips" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">12 טכניקות לחיסכון</a>
            <a href="/receipt" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">סריקת קבלה — בדקו כמה יכולתם לחסוך</a>
          </div>
        </section>
      </article>
    </div>
  );
}
