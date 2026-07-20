import type { Metadata } from "next";
import { guideBySlug, guideJsonLd, guideMetadata } from "@/lib/guides";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const g = guideBySlug("online-groceries-compare")!;

interface Breakdown { products: { product_id: number }[]; chains: { chain: string; total: number }[] }

async function getBasketGap(): Promise<{ shufersal?: number; ramiLevy?: number; products: number } | null> {
  try {
    const res = await fetch(`${API}/savy-basket/breakdown`, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const data: Breakdown = await res.json();
    return {
      shufersal: data.chains.find((c) => c.chain === "Shufersal")?.total,
      ramiLevy: data.chains.find((c) => c.chain === "Rami Levy")?.total,
      products: data.products.length,
    };
  } catch { return null; }
}

export const metadata: Metadata = guideMetadata(g);

export default async function OnlineGroceriesGuide() {
  const gap = await getBasketGap();
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const diff = gap?.shufersal && gap?.ramiLevy ? Math.abs(gap.shufersal - gap.ramiLevy) : null;
  const cheaperName = gap?.shufersal && gap?.ramiLevy ? (gap.ramiLevy < gap.shufersal ? "רמי לוי" : "שופרסל") : null;

  const faq = [
    { q: "מה יותר זול — שופרסל אונליין או רמי לוי אונליין?", a: `על סל מוצרי היסוד בסניפים${diff ? `, ההפרש בין הרשתות עומד היום על כ-₪${diff.toFixed(0)} לטובת ${cheaperName}` : " יש הפרש קבוע בין הרשתות"} — אבל התשובה האמיתית תלויה בסל שלכם: לכל רשת מוצרים שהיא זולה בהם. הדרך הבטוחה היא להשוות את הרשימה המלאה שלכם לפני ההזמנה.` },
    { q: "האם קניות אונליין יקרות יותר מאשר בסניף?", a: "המחירים אונליין בדרך כלל דומים למחירי הסניפים, ולעיתים מעט גבוהים, ובנוסף יש דמי משלוח (משתנים לפי רשת, אזור, מועד וגובה ההזמנה — בדקו בקופה). מנגד, קנייה אונליין חוסכת קניות אימפולס, שמנפחות סל ב-10%-30% — ולכן משפחות רבות דווקא חוסכות בסך הכול." },
    { q: "איך משווים סל קניות שלם בין רשתות אונליין?", a: "בונים את רשימת הקניות פעם אחת ב-Savy, והמערכת מתמחרת אותה בכל הרשתות במקביל — כולל זמינות מוצרים. כך רואים את ההפרש האמיתי על הסל שלכם לפני שמתחייבים להזמנה." },
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
        <div className="text-xs text-stone-400 mb-5">עודכן: {today}</div>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm text-stone-700 leading-relaxed">
          <p>
            שופרסל אונליין, רמי לוי אונליין, ויקטורי, קרפור או וולט מרקט — למי למסור את הקנייה החודשית?
            {diff && cheaperName ? <> על סל מוצרי היסוד, ההפרש בין שופרסל לרמי לוי עומד היום על כ-<strong className="text-emerald-700">₪{diff.toFixed(0)}</strong> לטובת {cheaperName} —</> : null}{" "}
            אבל התשובה הנכונה תלויה <strong>בסל שלכם</strong>, בדמי המשלוח באזורכם ובזמינות המוצרים.
            הנה איך מחליטים נכון, בלי לנחש.
          </p>
        </section>

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">שלושת הגורמים שקובעים מה משתלם</h2>
          <p>
            <strong>1. מחירי הסל שלכם.</strong> זה הגורם הגדול, והוא שונה ממשפחה למשפחה: רשת אחת זולה במוצרי חלב ותינוקות,
            אחרת בבשר ובמותגים פרטיים. השוואה של הרשימה המלאה — לא של מוצר-שניים — היא הדרך היחידה לדעת.
          </p>
          <p>
            <strong>2. דמי משלוח ומינימום הזמנה.</strong> אלה משתנים בין רשתות, אזורים, שעות משלוח ומועדוני לקוחות,
            ומתעדכנים תדיר — בדקו את הסכום המדויק בקופת האתר לפני אישור. כלל אצבע: ככל שההזמנה גדולה יותר, משקל
            המשלוח בעלות הכוללת קטן — ריכוז קנייה חודשית אחת גדולה עדיף על פיצול.
          </p>
          <p>
            <strong>3. זמינות והתחליפים.</strong> מוצר חסר שמוחלף בתחליף יקר שוחק את החיסכון. ברשימות עם מוצרים ייחודיים
            (תרכובות ספציפיות, מוצרים ללא גלוטן) שווה לבדוק זמינות לפני שבוחרים רשת.
          </p>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-6 text-center">
            <h2 className="font-black text-xl text-stone-800 mb-2">אל תנחשו — תשוו את הסל האמיתי שלכם</h2>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              הזינו את רשימת הקניות שלכם פעם אחת, וקבלו את המחיר שלה בכל הרשתות במקביל — כולל חוסרים.
              חינם, בלי הרשמה.
            </p>
            <a href="/online" className="inline-block px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-100">
              להשוואת סל קניות אונליין ←
            </a>
          </div>
        </section>

        <section className="mb-8 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-xl text-stone-800">אונליין מול סניף — האמת המפתיעה</h2>
          <p>
            המחיר על המדף הוא רק חצי מהסיפור. מחקרי צריכה מראים שקניות אימפולס — מה שנכנס לעגלה בלי תכנון — מנפחות
            סל פיזי ב-10%-30%. בקנייה אונליין עם רשימה קבועה, האפקט הזה כמעט נעלם. משפחות רבות מגלות שגם אחרי
            דמי המשלוח, הקנייה אונליין זולה יותר בשורה התחתונה — בתנאי שמשווים רשתות לפני שמתמסרים לאחת.
          </p>
          <p>
            רוצים לדעת איך הרשתות משתוות בסניפים הפיזיים? ראו את ההשוואה הישירה:{" "}
            <a href="/compare/shufersal-vs-rami-levy" className="text-emerald-600 hover:underline font-semibold">שופרסל מול רמי לוי</a>{" "}
            או את <a href="/guides/cheapest-supermarket" className="text-emerald-600 hover:underline font-semibold">הדירוג המלא</a>.
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
            <a href="/compare/shufersal-vs-rami-levy" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">שופרסל מול רמי לוי</a>
            <a href="/guides/saving-tips" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">12 טכניקות לחיסכון בסופר</a>
            <a href="/online" className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition">השוואת סל אונליין</a>
          </div>
        </section>
      </article>
    </div>
  );
}
