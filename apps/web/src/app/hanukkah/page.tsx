import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import { AD_SLOTS } from "@/lib/ads";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

// חנוכה תשפ"ז: הדלקת נר ראשון ביום שישי 4.12.2026 בערב, עד 12.12.2026
const HOLIDAY_YEAR = 2026;

interface HolidayItem {
  key: string;
  he: string;
  q: string;
  emoji: string;
  inBasket: boolean; // counted in the "basic Hanukkah basket" estimate
  note?: string;
  exclude?: RegExp; // drop products whose name matches (e.g. sanitary pads matching "סופגני")
  requireCategory?: string; // fresh produce: only this category, so processed products don't win
}

const ITEMS: HolidayItem[] = [
  { key: "sufganiyot", he: "סופגניות",       q: "סופגני",        emoji: "🍩", inBasket: false, note: "סופגניות מוכנות מהמאפייה של הרשת",
    exclude: /פד|סופג(ת|ים)? (תחתון|יומי)|תחתון|מקסי|היגיינ|אינטימי|wc|אסלה/i },
  { key: "candles",    he: "נרות חנוכה",     q: "נרות חנוכה",    emoji: "🕎", inBasket: true, exclude: /ריח|נשמה|זכרון/i },
  { key: "oil",        he: "שמן לטיגון",     q: "שמן קנולה",     emoji: "🫗", inBasket: true, note: "ללביבות ולסופגניות ביתיות" },
  { key: "flour",      he: "קמח",            q: "קמח לבן",       emoji: "🌾", inBasket: true },
  { key: "potatoes",   he: "תפוחי אדמה",     q: "תפוח אדמה",     emoji: "🥔", inBasket: true, note: "הבסיס ללביבות — תפוחי אדמה טריים",
    requireCategory: "ירקות ופירות", exclude: /חטיף|צ'יפס|קפוא|ניוקי|קמח|סלט|פירה|מוכן|אפוי/i },
  { key: "eggs",       he: "ביצים",          q: "ביצים L",       emoji: "🥚", inBasket: true, exclude: /שוקולד|הפתעה|קינדר/i },
  { key: "sugar",      he: "סוכר",           q: "סוכר לבן",      emoji: "🍬", inBasket: true },
  { key: "powdered",   he: "אבקת סוכר",      q: "אבקת סוכר",     emoji: "❄️", inBasket: true },
  { key: "jam",        he: "ריבה",           q: "ריבת תות",      emoji: "🍓", inBasket: true, note: "למילוי סופגניות" },
  { key: "yeast",      he: "שמרים",          q: "שמרים",         emoji: "🍞", inBasket: true, exclude: /בירה|תוסף|כמוס/i },
  { key: "choco-coins", he: "מטבעות שוקולד", q: "מטבעות שוקולד", emoji: "🪙", inBasket: false },
  { key: "sevivon",    he: "סביבונים",       q: "סביבון",        emoji: "🔯", inBasket: false },
];

interface SearchProduct {
  id: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  minPrice: number | null;
  storeCount: number;
}

async function getProducts(q: string): Promise<SearchProduct[]> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=8`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((p: SearchProduct) => p.minPrice != null && p.storeCount > 5);
  } catch { return []; }
}

async function getAllItems() {
  const results = await Promise.all(ITEMS.map(async (item) => {
    let products = await getProducts(item.q);
    if (item.requireCategory) products = products.filter((p: any) => p.category === item.requireCategory);
    if (item.exclude) products = products.filter((p) => !item.exclude!.test(p.name));
    return { item, products };
  }));
  return results.filter((r) => r.products.length > 0);
}

function basketEstimate(sections: { item: HolidayItem; products: SearchProduct[] }[]) {
  let total = 0, counted = 0;
  for (const s of sections) {
    if (!s.item.inBasket) continue;
    const cheapest = Math.min(...s.products.map((p) => Number(p.minPrice)));
    total += cheapest; counted++;
  }
  return counted >= 5 ? { total, counted } : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const sections = await getAllItems();
  const basket = basketEstimate(sections);
  const title = `מחירי חנוכה ${HOLIDAY_YEAR} — סופגניות, נרות, שמן ולביבות | השוואת מחירים | Savy`;
  const description = basket
    ? `כמה עולה חנוכה ${HOLIDAY_YEAR}? סל בסיס לחג (שמן, קמח, נרות, ביצים ועוד) מתחיל בכ-₪${basket.total.toFixed(0)}. השוואת מחירי כל מוצרי החג בין כל רשתות הסופרמרקט — עדכון יומי.`
    : `כמה עולים סופגניות, נרות חנוכה, שמן וקמח ללביבות? השוואת מחירי כל מוצרי חנוכה ${HOLIDAY_YEAR} בין כל רשתות הסופרמרקט בישראל.`;
  return {
    title, description,
    alternates: { canonical: "https://savy.co.il/hanukkah" },
    openGraph: { title, description, url: "https://savy.co.il/hanukkah", siteName: "Savy", locale: "he_IL", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HanukkahPage() {
  const sections = await getAllItems();
  const basket = basketEstimate(sections);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const sufganiyot = sections.find((s) => s.item.key === "sufganiyot");
  const sufStats = sufganiyot && {
    low: Math.min(...sufganiyot.products.map((p) => Number(p.minPrice))),
    high: Math.max(...sufganiyot.products.map((p) => Number(p.minPrice))),
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `מתי חנוכה ${HOLIDAY_YEAR}?`,
        acceptedAnswer: { "@type": "Answer", text: `חנוכה תשפ"ז מתחיל בהדלקת נר ראשון ביום שישי, 4 בדצמבר ${HOLIDAY_YEAR} בערב, ונמשך שמונה ימים — עד 12 בדצמבר.` },
      },
      ...(sufStats ? [{
        "@type": "Question",
        name: "כמה עולות סופגניות בסופרמרקט?",
        acceptedAnswer: { "@type": "Answer", text: `נכון ל-${today}, סופגניות ברשתות הסופרמרקט נמכרות החל מ-₪${sufStats.low.toFixed(2)} — תלוי בסוג (קלאסית, מילוי מיוחד) וברשת. המחירים מתעדכנים יומית ב-Savy מנתוני שקיפות המחירים.` },
      }] : []),
      ...(basket ? [{
        "@type": "Question",
        name: "כמה עולה סל בסיס לחנוכה?",
        acceptedAnswer: { "@type": "Answer", text: `סל בסיס לחג — שמן, קמח, סוכר, אבקת סוכר, ביצים, תפוחי אדמה, ריבה, שמרים ונרות — מתחיל בכ-₪${basket.total.toFixed(0)} כשקונים כל פריט במחיר הזול ביותר. ההפרש בין הרשתות על אותו סל יכול להגיע לעשרות אחוזים.` },
      }] : []),
      {
        "@type": "Question",
        name: "איפה הכי זול לקנות למסיבת חנוכה?",
        acceptedAnswer: { "@type": "Answer", text: "המחיר משתנה בין רשתות וסניפים. בונים רשימת קניות ב-Savy עם כל מוצרי החג, והמערכת מציגה את הסניף הזול ביותר ליד הבית — כולל חישוב מבצעים שהסל עומד בתנאיהם." },
      },
    ],
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">מחירי חנוכה {HOLIDAY_YEAR}</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-3">
          🕎 מחירי חנוכה {HOLIDAY_YEAR} — סופגניות, נרות, שמן ולביבות
        </h1>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
          <p>
            חנוכה תשפ"ז מתחיל בהדלקת נר ראשון ביום שישי, <strong>4 בדצמבר {HOLIDAY_YEAR}</strong> בערב.
            {basket && (
              <> סל בסיס לחג — שמן, קמח, סוכר, ביצים, תפוחי אדמה, ריבה, שמרים ונרות — מתחיל ב
              <strong className="text-emerald-700">כ-₪{basket.total.toFixed(0)}</strong> כשקונים כל פריט במחיר הזול ביותר.</>
            )}
            {" "}המחירים למטה מתעדכנים יומית מנתוני שקיפות המחירים של כל הרשתות, נכון ל-{today}.
            לחצו על מוצר להשוואת מחירים מלאה, או{" "}
            <a href="/?tab=list" className="text-emerald-600 hover:underline font-semibold">בנו רשימת חג והשוו סל שלם</a>.
          </p>
        </section>

        {sections.map(({ item, products }, idx) => (
          <section key={item.key} className="mb-8">
            <h2 className="font-black text-lg text-stone-800 mb-1">{item.emoji} מחירי {item.he}</h2>
            {item.note && <p className="text-xs text-stone-400 mb-3">{item.note}</p>}
            {!item.note && <div className="mb-3" />}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {products.slice(0, 4).map((p) => (
                <a key={p.id} href={`/product/${p.id}`}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 hover:shadow-md transition flex flex-col gap-1.5">
                  <div className="w-full aspect-square bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-w-full max-h-full object-contain p-2" />
                      : <span className="text-3xl">{item.emoji}</span>}
                  </div>
                  <div className="font-semibold text-stone-800 text-xs leading-snug line-clamp-2">{p.name}</div>
                  {p.brand && p.brand !== "לא ידוע" && <div className="text-[11px] text-stone-400">{p.brand}</div>}
                  <div className="font-mono font-black text-emerald-600 text-sm">החל מ-₪{Number(p.minPrice).toFixed(2)}</div>
                  <div className="text-[10px] text-stone-400">{p.storeCount} חנויות</div>
                </a>
              ))}
            </div>
            {idx === 2 && <AdSlot slot={AD_SLOTS.content} />}
          </section>
        ))}

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed space-y-3">
          <h2 className="font-black text-lg text-stone-800">שאלות נפוצות — חנוכה {HOLIDAY_YEAR}</h2>
          <div>
            <h3 className="font-bold text-stone-700">מתי מדליקים נר ראשון?</h3>
            <p>יום שישי, 4 בדצמבר {HOLIDAY_YEAR} בערב (לפני כניסת השבת). החג נמשך עד 12 בדצמבר.</p>
          </div>
          {sufStats && (
            <div>
              <h3 className="font-bold text-stone-700">כמה עולות סופגניות?</h3>
              <p>ברשתות הסופרמרקט — החל מ-₪{sufStats.low.toFixed(2)}, תלוי בסוג וברשת. שווה להשוות: ההפרש בין הרשתות על אותה סופגנייה מגיע לעשרות אחוזים.</p>
            </div>
          )}
          <div>
            <h3 className="font-bold text-stone-700">איך חוסכים בקניות לחג?</h3>
            <p>
              בונים את כל רשימת החג ב-<a href="/?tab=list" className="text-emerald-600 hover:underline">השוואת הסל של Savy</a> ורואים
              באיזה סניף הסל הכי זול, כולל <a href="/deals" className="text-emerald-600 hover:underline">מבצעי החג</a> שהסל שלכם באמת עומד בתנאיהם.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <a href="/deals" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">🏷️ מבצעי החג ברשתות ←</div>
          </a>
          <a href="/compare" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">⚖️ איזו רשת הכי זולה? ←</div>
          </a>
        </section>
      </div>
    </div>
  );
}
