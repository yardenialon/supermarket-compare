import type { Metadata } from "next";
import BusinessApplyForm from "./BusinessApplyForm";

export const metadata: Metadata = {
  title: "סאבי לעסקים קטנים — הצטרפו להשוואת המחירים | Savy",
  description:
    "מינימרקט שכונתי, סופר חברתי או חנות סטוק? חוק שקיפות המחירים מחייב רק את הרשתות הגדולות — אנחנו פותחים את הבמה לקטנים. הצטרפו בחינם והופיעו בהשוואות המחירים של Savy.",
  alternates: { canonical: "https://www.savy.co.il/business" },
  openGraph: {
    title: "סאבי לעסקים קטנים — הלקוחות משווים מחירים. תנו להם לגלות אתכם",
    description:
      "הצטרפות חינם להשוואת המחירים של Savy לסופרים עצמאיים, סופרים חברתיים וחנויות סטוק.",
    url: "https://www.savy.co.il/business",
  },
};

const STEPS = [
  {
    icon: "📝",
    title: "משאירים פרטים",
    body: "שם העסק, עיר ודרך ליצירת קשר. פחות מדקה.",
  },
  {
    icon: "📋",
    title: "שולחים מחירון — בכל פורמט",
    body: "אקסל, ייצוא מהקופה, ואפילו צילום של מחירון מודפס. אנחנו עושים את כל העבודה הטכנית.",
  },
  {
    icon: "🏆",
    title: "מופיעים בהשוואות",
    body: "כשלקוח משווה סל קניות באזורכם — המחירים שלכם מופיעים לצד הרשתות הגדולות. אם אתם זולים יותר, כולם יראו את זה.",
  },
];

const FAQ = [
  {
    q: "כמה זה עולה?",
    a: "כלום. ההצטרפות וההופעה בהשוואות חינמיות. המטרה שלנו היא שהמשתמשים יראו את התמונה המלאה של השוק — כולל העסקים שהחוק לא מחייב לפרסם מחירים.",
  },
  {
    q: "למה אנחנו לא מופיעים היום באתרי השוואת מחירים?",
    a: "חוק שקיפות המחירים מחייב רק קמעונאים גדולים לפרסם קבצי מחירים. כל אתרי ההשוואה נשענים על הקבצים האלה, ולכן עסקים קטנים — שלרוב דווקא זולים יותר — פשוט לא קיימים שם. את הפער הזה אנחנו סוגרים ידנית, בשותפות אתכם.",
  },
  {
    q: "כל כמה זמן צריך לעדכן מחירים?",
    a: "מה שנוח לכם — שליחת מחירון מעודכן אחת לשבוע או חודש מספיקה. מוצרים שהמחיר שלהם לא השתנה נשארים כמו שהם, ואנחנו מסמנים באתר מתי המחיר עודכן לאחרונה.",
  },
  {
    q: "אנחנו סופר חברתי שמוגבל לזכאים — רלוונטי אלינו?",
    a: "בהחלט, ובשקיפות מלאה: חנות שמיועדת לזכאים בלבד מסומנת אצלנו בתווית ברורה, כך שמי שרואה אתכם בהשוואה יודע בדיוק מה תנאי הקנייה. כך אתם מגיעים לקהל הנכון בלי להטעות אף אחד.",
  },
  {
    q: "אין לנו ברקודים על כל המוצרים",
    a: "לא חייבים. גם מחירון חלקי שווה הרבה — ההשוואה נעשית על המוצרים המשותפים, ואנחנו מציינים כמה מהסל כוסה. ירקות, פירות ומוצרי יסוד הם ממילא רוב סל הקניות.",
  },
];

export default function BusinessPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* hero */}
      <section className="text-center pt-4">
        <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-3 py-1 mb-4">
          סאבי לעסקים קטנים · הצטרפות חינם
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-800 leading-tight">
          הלקוחות משווים מחירים.
          <br />
          <span className="text-emerald-600">תנו להם לגלות אתכם.</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-stone-600 leading-relaxed">
          אלפי ישראלים משווים אצלנו סלי קניות בין רשתות — אבל חוק שקיפות
          המחירים מחייב רק את הגדולות לפרסם מחירים, אז הסופר השכונתי, הסופר
          החברתי וחנות הסטוק שליד הבית נשארים בחוץ.{" "}
          <strong className="text-stone-800">בדיוק בשבילכם פתחנו דלת צדדית:</strong>{" "}
          שלחו לנו מחירון, ואנחנו נכניס אתכם להשוואה.
        </p>
      </section>

      {/* why it pays off */}
      <section className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-bold text-stone-800 mb-1">חשיפה במקום הנכון</div>
          <p className="text-sm text-stone-500 leading-relaxed">
            מי שמשווה מחירים הוא בדיוק הלקוח שמחפש אתכם — רגיש למחיר ומוכן
            ללכת כמה רחובות כדי לחסוך.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="text-2xl mb-2">⚖️</div>
          <div className="font-bold text-stone-800 mb-1">מגרש משחקים הוגן</div>
          <p className="text-sm text-stone-500 leading-relaxed">
            לרשתות הגדולות יש פרסום בפריים־טיים. לכם יש מחירים טובים יותר —
            וכאן זה כל מה שנמדד.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="text-2xl mb-2">🤝</div>
          <div className="font-bold text-stone-800 mb-1">בלי מחלקת IT</div>
          <p className="text-sm text-stone-500 leading-relaxed">
            אקסל, ייצוא קופה או צילום מחירון — כל פורמט מתאים. את ההמרה
            והעדכונים אנחנו עושים.
          </p>
        </div>
      </section>

      {/* how it works */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-xl font-black text-stone-800 text-center mb-6">
          איך זה עובד?
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100">
              <div className="absolute -top-3 right-5 bg-emerald-600 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                {i + 1}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-bold text-stone-800 mb-1">{s.title}</div>
              <p className="text-sm text-stone-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* form */}
      <section id="join" className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-black text-stone-800 mb-1">מצטרפים כאן</h2>
          <p className="text-sm text-stone-500 mb-5">
            נחזור אליכם תוך יום־יומיים עם ההסבר הקצר על שליחת המחירון.
          </p>
          <BusinessApplyForm />
        </div>
      </section>

      {/* faq */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-xl font-black text-stone-800 text-center mb-4">
          שאלות נפוצות
        </h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="bg-white rounded-xl border border-stone-200 p-4 group">
              <summary className="font-bold text-stone-800 cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-stone-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="text-sm text-stone-600 leading-relaxed mt-2">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-center text-xs text-stone-400 mt-6">
          מעדיפים לדבר? כתבו לנו: <a href="mailto:info@savy.co.il" className="text-emerald-600 hover:underline">info@savy.co.il</a>
        </p>
      </section>
    </div>
  );
}
