import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "השוואת מחירים מזון 2026 | השוואת מחירי סופרמרקט – Savy",
  description:
    "השוואת מחירים מזון בין כל רשתות הסופרמרקט בישראל: שופרסל, רמי לוי, ויקטורי, קרפור ועוד. חסכו מאות שקלים בחודש עם Savy — כלי השוואת המחירים החינמי.",
  keywords: [
    "השוואת מחירים מזון",
    "השוואת מחירי סופרמרקט",
    "מחירי מזון ישראל",
    "סופרמרקט זול",
    "השוואת מחירים שופרסל",
    "השוואת מחירים רמי לוי",
    "חיסכון בקניות",
    "savy השוואת מחירים",
  ],
  alternates: { canonical: "https://savy.co.il/hashvatat-mekhirim-mazon" },
  openGraph: {
    title: "השוואת מחירים מזון 2026 – Savy",
    description: "גלו היכן הכי זול לקנות מזון בישראל. השוואת מחירים חיה בין 29 רשתות סופרמרקט.",
    url: "https://savy.co.il/hashvatat-mekhirim-mazon",
    siteName: "Savy",
    locale: "he_IL",
    type: "article",
    images: [{ url: "https://savy.co.il/og/hashvatat-mekhirim-mazon.jpg", width: 1200, height: 630, alt: "Savy – השוואת מחירים מזון" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "השוואת מחירים מזון 2026 – Savy",
    description: "גלו היכן הכי זול לקנות מזון בישראל. השוואת מחירים חיה בין 29 רשתות.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#webpage",
      url: "https://savy.co.il/hashvatat-mekhirim-mazon",
      name: "השוואת מחירים מזון 2026 | Savy",
      description: "השוואת מחירים מזון בין כל רשתות הסופרמרקט בישראל. כלי חינמי לחיסכון בקניות.",
      inLanguage: "he",
      isPartOf: { "@id": "https://savy.co.il/#website" },
      breadcrumb: { "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#breadcrumb" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "בית", item: "https://savy.co.il" },
        { "@type": "ListItem", position: 2, name: "השוואת מחירים מזון", item: "https://savy.co.il/hashvatat-mekhirim-mazon" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "איך עושים השוואת מחירים מזון בישראל?",
          acceptedAnswer: { "@type": "Answer", text: "הדרך הפשוטה ביותר לעשות השוואת מחירים מזון היא להשתמש ב-Savy.co.il. פשוט הכניסו את רשימת הקניות שלכם, ו-Savy תשווה את המחירים בזמן אמת בין 29 רשתות סופרמרקט בישראל ותמצא לכם את הסניף הכי זול." },
        },
        {
          "@type": "Question",
          name: "כמה אפשר לחסוך עם השוואת מחירים מזון?",
          acceptedAnswer: { "@type": "Answer", text: "משפחה ממוצעת בישראל יכולה לחסוך בין 200 ל-600 שקלים בחודש על ידי השוואת מחירים מזון. ההפרש בין הרשת היקרה לזולה על סל קניות שבועי יכול להגיע ל-30%." },
        },
        {
          "@type": "Question",
          name: "אילו רשתות נכללות בהשוואת מחירים?",
          acceptedAnswer: { "@type": "Answer", text: "Savy מכסה 29 רשתות סופרמרקט בישראל: שופרסל, רמי לוי, ויקטורי, קרפור, חצי חינם, AM:PM, פרש מרקט, טיב טעם ועוד." },
        },
        {
          "@type": "Question",
          name: "האם כלי השוואת המחירים מזון בחינם?",
          acceptedAnswer: { "@type": "Answer", text: "כן, Savy הוא כלי חינמי לחלוטין. אין צורך בהרשמה, הורדת אפליקציה, או תשלום כלשהו." },
        },
        {
          "@type": "Question",
          name: "עד כמה המחירים מעודכנים?",
          acceptedAnswer: { "@type": "Answer", text: "Savy מעדכן מחירים ישירות ממאגרי הרשתות בתדירות גבוהה. המחירים משקפים את המחירים הנוכחיים בסניפים, כולל מבצעים." },
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "Savy – השוואת מחירי סופרמרקט",
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web, iOS, Android",
      offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
      url: "https://savy.co.il",
      description: "כלי חינמי להשוואת מחירים מזון בין 29 רשתות סופרמרקט בישראל.",
    },
  ],
};

const chainComparisons = [
  { chain: "שופרסל דיל", avgIndex: 100, color: "bg-red-100 text-red-700" },
  { chain: "ויקטורי", avgIndex: 97, color: "bg-emerald-100 text-emerald-700" },
  { chain: "רמי לוי", avgIndex: 93, color: "bg-blue-100 text-blue-700" },
  { chain: "קרפור", avgIndex: 102, color: "bg-purple-100 text-purple-700" },
  { chain: "חצי חינם", avgIndex: 105, color: "bg-orange-100 text-orange-700" },
  { chain: "טיב טעם", avgIndex: 91, color: "bg-teal-100 text-teal-700" },
];

const savingsExamples = [
  { product: "חלב תנובה 3% 1 ליטר", min: 5.9, max: 8.9, saving: 3.0 },
  { product: "לחם אחיד פרוס", min: 5.2, max: 7.8, saving: 2.6 },
  { product: 'שמן זית 750 מ"ל', min: 28.9, max: 44.9, saving: 16.0 },
  { product: "עוף שלם (קג)", min: 18.9, max: 28.9, saving: 10.0 },
  { product: "ביצים L × 12", min: 14.9, max: 21.9, saving: 7.0 },
  { product: "גבינה צהובה 200 גרם", min: 9.9, max: 15.9, saving: 6.0 },
];

const tips = [
  {
    icon: "🛒",
    title: "בנו רשימת קניות מראש",
    body: "השוואת מחירים מזון יעילה מתחילה ברשימה ממוקדת. רשימה של 20–30 פריטים קבועים מאפשרת לכלים כמו Savy למצוא את הסל הזול ביותר תוך שניות.",
  },
  {
    icon: "📍",
    title: "השוו לפי מיקום",
    body: "לא כל ההשוואות שוות — חשוב להשוות מחירים בין סניפים קרובים אליכם. Savy מאתר את הסניפים הקרובים ומציג מחירים מדויקים לכל סניף.",
  },
  {
    icon: "🏷️",
    title: "שימו לב למבצעים",
    body: "מבצעים יכולים להפוך רשת יקרה לזולה ביותר עבור פריטים ספציפיים. Savy כולל מחירי מבצע בחישוב הסל ומציין מתי מבצע עומד לפוג.",
  },
  {
    icon: "📊",
    title: "עקבו אחר מדד המחירים",
    body: "מחירי מזון משתנים תכופות בישראל. מדד המחירים של Savy מאפשר לכם לראות מגמות לאורך זמן ולזהות מתי עדיף לרכוש פריטים מסוימים.",
  },
  {
    icon: "🔄",
    title: "שקלו פיצול קניות",
    body: "לעיתים ניתן לחסוך יותר על ידי קנייה ב-2 סניפים שונים. Savy מחשב האם הפיצול כדאי לפי מרחק ואזור המחיר.",
  },
  {
    icon: "🤖",
    title: "השתמשו בבוט הטלגרם",
    body: "Savy זמין גם דרך Telegram Bot. שלחו רשימת קניות ישירות בצ'אט וקבלו תוצאות השוואה מיידית — בלי לפתוח דפדפן.",
  },
];

export default function FoodPriceComparisonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main dir="rtl" className="min-h-screen bg-white pb-24">

        {/* Hero */}
        <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-500">
              <ol className="flex justify-center gap-1">
                <li><Link href="/" className="hover:text-emerald-600">בית</Link></li>
                <li aria-hidden>/</li>
                <li className="text-gray-800 font-medium">השוואת מחירים מזון</li>
              </ol>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              השוואת מחירים מזון בין{" "}
              <span className="text-emerald-600">כל הסופרמרקטים</span> בישראל
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              השוואת מחירים מזון חכמה ומדויקת — בין 29 רשתות בזמן אמת.
              <br />
              גלו בדיוק איפה הכי זול לקנות את סל הקניות שלכם, וחסכו מאות שקלים בחודש.
            </p>
            <Link href="/" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-lg transition-colors">
              התחילו להשוות מחירים עכשיו ←
            </Link>
            <p className="mt-4 text-sm text-gray-400">חינם לחלוטין · ללא הורדה · ללא הרשמה</p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-emerald-600 py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: "29", label: "רשתות סופרמרקט" },
              { value: "626K+", label: "מוצרי מזון" },
              { value: "9M+", label: "מחירים במאגר" },
              { value: "עד 30%", label: "חיסכון אפשרי" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black">{s.value}</div>
                <div className="text-emerald-100 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

          {/* Intro */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">למה השוואת מחירים מזון חשובה כל כך?</h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                ישראל היא אחת המדינות עם יוקר המחייה הגבוה בעולם. מחירי המזון בישראל גבוהים משמעותית ממדינות מערביות רבות — ולכן <strong>השוואת מחירים מזון</strong> הפכה לכלי הכרחי עבור כל משק בית.
              </p>
              <p>
                ההפרש בין הסופרמרקט הזול ליקר על אותו סל קניות יכול להגיע <strong>ל-20%–30%</strong>. עבור משפחה שמוציאה 2,000 ₪ בחודש על מזון, מדובר ב-<strong>400–600 ₪ חיסכון חודשי</strong> — או <strong>כ-7,000 ₪ בשנה</strong>.
              </p>
              <p>
                הבעיה? עד לאחרונה, לא הייתה דרך נוחה לעשות השוואת מחירים מזון מקיפה בין כל הרשתות. <strong>Savy</strong> פותרת בדיוק את הבעיה הזו — ומאפשרת להשוות מחירים מזון בין 29 רשתות תוך שניות, בחינם.
              </p>
            </div>
          </section>

          {/* Price Table */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">השוואת מחירים מזון: דוגמאות מוצרים נפוצים</h2>
            <p className="text-gray-500 mb-6 text-sm">ההפרשים להלן מבוססים על נתוני מחירים אמיתיים ממאגר Savy (2026)</p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-right">
                    <th className="px-4 py-3 font-semibold">מוצר</th>
                    <th className="px-4 py-3 font-semibold text-center">מחיר מינ׳</th>
                    <th className="px-4 py-3 font-semibold text-center">מחיר מקס׳</th>
                    <th className="px-4 py-3 font-semibold text-center text-emerald-700">חיסכון אפשרי</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsExamples.map((row, i) => (
                    <tr key={row.product} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 font-bold">₪{row.min.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">₪{row.max.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">₪{row.saving.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">* מחירים לדוגמה. ייתכנו שינויים בהתאם לסניף ותאריך. לבדיקה מדויקת — השתמשו ב-Savy.</p>
          </section>

          {/* How Savy Works */}
          <section className="bg-emerald-50 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">איך Savy עושה השוואת מחירים מזון?</h2>
            <p className="text-gray-600 mb-6">Savy הוא כלי השוואת מחירים מזון החינמי והמקיף ביותר בישראל. הנה איך הוא עובד:</p>
            <ol className="space-y-5">
              {[
                { n: "1", title: "הכניסו רשימת קניות", desc: "הקלידו את המוצרים שאתם צריכים — חלב, לחם, ירקות, בשר, כל מה שרוצים. Savy מזהה מוצרים בשמות חופשיים ובלי צורך בברקוד." },
                { n: "2", title: "Savy סורקת 29 רשתות", desc: "האלגוריתם מחפש את כל המוצרים בכל רשת וסניף הקרוב אליכם, ומחשב את מחיר הסל הכולל לכל אפשרות." },
                { n: "3", title: "קבלו תוצאות מיידיות", desc: "תראו בדיוק כמה תשלמו בכל רשת, ואיפה הכי זול לקנות את כל הרשימה. כולל פירוט מחיר לפריט." },
                { n: "4", title: "חסכו כסף בכל קנייה", desc: "בחרו את הסופרמרקט הזול ביותר עבורכם, ולכו לקנות — ידע שחסך לכם כסף אמיתי." },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm">{step.n}</div>
                  <div>
                    <div className="font-bold text-gray-900">{step.title}</div>
                    <div className="text-gray-600 text-sm mt-0.5">{step.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <Link href="/" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                נסו את Savy עכשיו — חינם
              </Link>
            </div>
          </section>

          {/* Chain Index */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">מדד מחירי מזון לפי רשת סופרמרקט</h2>
            <p className="text-gray-600 mb-6 text-sm">מדד יחסי — 100 = שופרסל דיל. מתבסס על סל קניות ייצוגי של 50 מוצרים נפוצים.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {chainComparisons.map((c) => (
                <div key={c.chain} className="rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                  <div className="font-bold text-gray-800 mb-2">{c.chain}</div>
                  <div className={`text-2xl font-black ${c.color} rounded-xl py-1`}>{c.avgIndex}</div>
                  <div className="text-xs text-gray-400 mt-1">מדד מחיר יחסי</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              לנתונים מדויקים ומעודכנים ←{" "}
              <Link href="/price-index" className="text-emerald-600 underline">מדד המחירים של Savy</Link>
            </p>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6 טיפים להשוואת מחירים מזון חכמה</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {tips.map((tip) => (
                <div key={tip.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-2xl mb-2">{tip.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{tip.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why Savy */}
          <section className="bg-gray-900 rounded-3xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">למה Savy היא הפתרון הטוב ביותר להשוואת מחירים מזון?</h2>
            <ul className="space-y-4">
              {[
                { icon: "✅", title: "כיסוי מלא — 30+ רשתות", desc: "Savy מכסה יותר רשתות מכל שירות השוואת מחירים אחר בישראל. שופרסל, רמי לוי, ויקטורי, קרפור, חצי חינם, AM:PM, טיב טעם ועוד." },
                { icon: "⚡", title: "תוצאות בזמן אמת", desc: "המחירים מתעדכנים ישירות ממאגרי הרשתות. אתם רואים את המחיר שאתם ישלמו ב-checkout — לא מחיר מיושן מאיזה קובץ." },
                { icon: "📍", title: "לפי מיקום", desc: "השוואת מחירים מזון לפי הסניף הקרוב אליכם, לא ממוצע ארצי שלא רלוונטי לחייכם." },
                { icon: "🆓", title: "חינמי לגמרי", desc: "אין מנויים, אין פרסומות, אין מכירת נתונים. Savy חינמי כי אנחנו מאמינים שהמידע הזה צריך להיות נגיש לכולם." },
                { icon: "🤖", title: "AI-Friendly", desc: "עובד גם דרך Telegram Bot — שלחו רשימת קניות בשפה חופשית, קבלו תוצאות מיידית." },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <div className="font-bold text-emerald-400">{f.title}</div>
                    <div className="text-gray-300 text-sm mt-0.5">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">שאלות נפוצות על השוואת מחירים מזון</h2>
            <div className="space-y-5">
              {(jsonLd["@graph"][2] as any).mainEntity.map(
                (q: { name: string; acceptedAnswer: { text: string } }) => (
                  <details key={q.name} className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <summary className="cursor-pointer font-bold text-gray-900 p-5 list-none flex justify-between items-center">
                      {q.name}
                      <span className="text-emerald-500 font-normal text-xl group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{q.acceptedAnswer.text}</p>
                  </details>
                )
              )}
            </div>
          </section>

          {/* Internal Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">כלים נוספים להשוואת מחירי מזון</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { href: "/price-index", label: "מדד מחירים", desc: "השוואה כלכלית בין רשתות לאורך זמן" },
                { href: "/deals", label: "מבצעים", desc: "מבצעי מזון עדכניים בכל הרשתות" },
                { href: "/produce", label: "ירקות ופירות", desc: "השוואת מחירי תוצרת טרייה" },
                { href: "/supermarkets", label: "כל הרשתות", desc: "פרטים ומחירים לפי רשת" },
                { href: "/guide", label: "מדריך חיסכון", desc: "המדריך המלא לחיסכון בקניות" },
                { href: "/receipt", label: "סריקת קבלה", desc: "העלו קבלה וקבלו השוואה מיידית" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="flex items-start gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{link.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{link.desc}</div>
                  </div>
                  <span className="mr-auto text-emerald-500 text-lg">←</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-emerald-500 rounded-3xl p-10 text-center text-white">
            <h2 className="text-3xl font-black mb-3">מוכנים לעשות השוואת מחירים מזון אמיתית?</h2>
            <p className="text-emerald-50 mb-8 text-lg">
              הכניסו רשימת קניות, ו-Savy תמצא את הסופרמרקט הזול ביותר עבורכם — תוך שניות.
            </p>
            <Link href="/" className="inline-block bg-white text-emerald-700 font-extrabold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              התחילו עכשיו — זה חינם ←
            </Link>
          </section>

        </div>
      </main>
    </>
  );
}
