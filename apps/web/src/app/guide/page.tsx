import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "המדריך המלא להשוואת מחירי סופרמרקט בישראל 2026 | Savy",
  description: "איך לחסוך אלפי שקלים בשנה על קניות סופרמרקט? מדריך מקיף להשוואת מחירים בין שופרסל, רמי לוי, ויקטורי ועוד 25 רשתות. נתונים עדכניים לשנת 2026.",
  alternates: { canonical: "https://savy.co.il/guide" },
  openGraph: {
    title: "המדריך המלא להשוואת מחירי סופרמרקט בישראל 2026",
    description: "איך לחסוך אלפי שקלים בשנה על קניות סופרמרקט? נתונים עדכניים מ-25+ רשתות.",
    url: "https://savy.co.il/guide",
    siteName: "Savy",
    locale: "he_IL",
    type: "article",
  },
};

export default function GuidePage() {
  const shekel = "\u20AA";
  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700 text-sm font-semibold">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">{">"}</span>
          <span className="text-stone-600 text-sm font-semibold">מדריך השוואת מחירים</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h1 className="font-black text-2xl text-stone-800 leading-tight mb-3">
            המדריך המלא להשוואת מחירי סופרמרקט בישראל 2026
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            משפחה ממוצעת בישראל מוציאה כ-4,000-6,000 שח בחודש על מצרכים. הפרש המחירים בין הרשת היקרה לזולה יכול להגיע ל-30% — חיסכון של עד 1,800 שח בחודש. במדריך זה נסביר איך לעשות את זה נכון.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-stone-800 mb-4">מי הכי זול? מדד מחירי סופרמרקט 2026</h2>
          <p className="text-stone-500 text-sm mb-4">על בסיס סל של 24 מוצרי יסוד, נתונים עדכניים מ-Savy:</p>
          <div className="space-y-3">
            {[
              { rank: "1", emoji: "gold", name: "אושר עד", price: "291.70", note: "הכי זול", color: "text-yellow-600 bg-yellow-50" },
              { rank: "2", emoji: "silver", name: "רמי לוי", price: "298.40", note: "", color: "text-slate-500 bg-slate-50" },
              { rank: "3", emoji: "bronze", name: "שופרסל", price: "302.60", note: "", color: "text-amber-600 bg-amber-50" },
              { rank: "4", emoji: "", name: "יינות ביתן", price: "320.99", note: "", color: "text-stone-500 bg-stone-50" },
              { rank: "5", emoji: "", name: "חצי חינם", price: "268.59", note: "מוצרים נבחרים", color: "text-stone-500 bg-stone-50" },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100">
                <span className="font-black text-stone-400 w-6 text-center text-sm">{r.rank}</span>
                <div className="flex-1">
                  <div className="font-bold text-stone-800 text-sm">{r.name}</div>
                  {r.note && <div className="text-xs text-stone-400">{r.note}</div>}
                </div>
                <div className={"font-mono font-black text-sm px-2 py-1 rounded-lg " + r.color}>
                  {shekel}{r.price}
                </div>
              </div>
            ))}
          </div>
          <Link href="/price-index" className="mt-4 block text-center text-sm text-emerald-600 font-bold hover:underline">
            לדוח המדד המלא עם כל הרשתות
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-stone-800 mb-4">5 טיפים לחיסכון בסופרמרקט</h2>
          <div className="space-y-4">
            {[
              { icon: "🛒", title: "בנה רשימת קניות מראש", text: "קניות ספונטניות עולות בממוצע 20% יותר. הכן רשימה מסודרת לפני שאתה יוצא." },
              { icon: "📊", title: "השווה מחירים לפני הקנייה", text: "מחיר מוצר יכול להשתנות עד 50% בין רשתות שונות. Savy מאפשר להשוות בשניות." },
              { icon: "🏷️", title: "עקוב אחרי מבצעים", text: "רשתות הסופרמרקט מחליפות מבצעים כל שבוע. חיתולים, קפה ומוצרי ניקיון יכולים להיות זולים בהרבה." },
              { icon: "📍", title: "בדוק מה יש קרוב אליך", text: "לפעמים הסניף הקרוב ביותר הוא גם הזול ביותר. חפש לפי מיקום ב-Savy." },
              { icon: "📱", title: "השתמש באפליקציה", text: "שמור את רשימת הקניות ב-Savy וקבל השוואה מיידית בין כל הרשתות." },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <div className="font-bold text-stone-800 text-sm">{tip.title}</div>
                  <div className="text-stone-500 text-sm mt-0.5">{tip.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-stone-800 mb-4">השוואת רשתות סופרמרקט גדולות בישראל</h2>
          <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
            <div>
              <h3 className="font-bold text-stone-800 mb-1">שופרסל — הרשת הגדולה בישראל</h3>
              <p>עם 498 סניפים, שופרסל היא הנגישה ביותר. מחירים ממוצעים עם מגוון רחב. <Link href="/chain/Shufersal" className="text-emerald-600 hover:underline">לדף שופרסל</Link></p>
            </div>
            <div>
              <h3 className="font-bold text-stone-800 mb-1">רמי לוי — המחיר הנמוך תמיד</h3>
              <p>ידועה במחירים נמוכים ומבצעים אגרסיביים. עם 100 סניפים, הבחירה הפופולרית לחיסכון. <Link href="/chain/Rami%20Levy" className="text-emerald-600 hover:underline">לדף רמי לוי</Link></p>
            </div>
            <div>
              <h3 className="font-bold text-stone-800 mb-1">אושר עד — הזול ביותר לפי המדד שלנו</h3>
              <p>לפי מדד Savy 2026, אושר עד היא הרשת הזולה ביותר בסל מוצרי הבסיס. <Link href="/chain/Osher%20Ad" className="text-emerald-600 hover:underline">לדף אושר עד</Link></p>
            </div>
            <div>
              <h3 className="font-bold text-stone-800 mb-1">ויקטורי — איכות במחיר סביר</h3>
              <p>מתמקמת בנישת האיכות-מחיר, עם דגש על מוצרים טריים. <Link href="/chain/Victory" className="text-emerald-600 hover:underline">לדף ויקטורי</Link></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-stone-800 mb-4">השווה מחירים לפי קטגוריה</h2>
          <div className="flex flex-wrap gap-2">
            {["מוצרי חלב","לחם ומאפה","ירקות ופירות","בשר ועוף","חטיפים וממתקים","משקאות","ניקיון ובית","מוצרי תינוקות","היגיינה ויופי","שימורים ומזון יבש"].map(cat => (
              <Link key={cat} href={"/category/" + encodeURIComponent(cat)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-xs text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition">
                {cat}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-emerald-500 rounded-2xl p-6 text-center text-white">
          <h2 className="font-black text-lg mb-2">מוכן להתחיל לחסוך?</h2>
          <p className="text-emerald-100 text-sm mb-4">בנה רשימת קניות ומצא את הסניף הזול ביותר קרוב אליך</p>
          <Link href="/" className="bg-white text-emerald-600 font-black px-6 py-3 rounded-xl text-sm hover:bg-emerald-50 transition inline-block">
            התחל להשוות מחירים
          </Link>
        </div>
      </div>
    </div>
  );
}
