"use client";
import { useMemo, useState } from "react";

// Widget generator for recipe bloggers: paste ingredients, get an iframe
// snippet with a live preview. The embed itself lives at /embed/recipe.
const SITE = "https://savy.co.il";

// strip leading quantity/unit tokens: "500 גרם קמח" -> {amount:"500 גרם", q:"קמח"}
const UNIT = /^(\d+([.,/]\d+)?|חצי|רבע|שליש|שלושת|קורט|מעט|גרם|ג'?|קילו|ק"ג|קג|מ"ל|מל|ליטר|כוסות?|כפות|כף|כפיות?|כפית|יחידות|יחיד(ה|ות)|יח'?|חבילות|חבילה|גביעי?ם?|גביע|קופס(ה|ת|אות)|שקיות?|שקית|בקבוקי?ם?|בקבוק|פרוסות|שיני|שן|ראש|צרור|אגד)$/;

function parseLine(line: string): { q: string; amount: string } | null {
  const clean = line.replace(/\(.*?\)/g, " ").replace(/[•\-–*·]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const tokens = clean.split(" ");
  let i = 0;
  while (i < tokens.length - 1 && UNIT.test(tokens[i])) i++;
  const amount = tokens.slice(0, i).join(" ");
  const q = tokens.slice(i).join(" ").replace(/^(של|עם)\s+/, "").trim();
  if (!q) return null;
  return { q: q.slice(0, 60), amount: amount.slice(0, 40) };
}

export default function WidgetGeneratorPage() {
  const [name, setName] = useState("עוגת גבינה אפויה");
  const [src, setSrc] = useState("");
  const [raw, setRaw] = useState("500 גרם גבינה לבנה 5%\nגביע שמנת חמוצה\n4 ביצים\nכוס סוכר\nחבילה ביסקוויטים פתי בר\n100 גרם חמאה");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => raw.split("\n").map(parseLine).filter(Boolean) as { q: string; amount: string }[], [raw]);

  const embedUrl = useMemo(() => {
    const ing = parsed.map((p) => `${p.q}${p.amount ? ":" + p.amount : ""}`).join(",");
    const params = new URLSearchParams({ n: name || "המתכון", ing });
    if (src.trim()) params.set("src", src.trim().replace(/^https?:\/\//, "").split("/")[0]);
    return `${SITE}/embed/recipe?${params.toString()}`;
  }, [name, src, parsed]);

  const snippet = `<iframe src="${embedUrl}"\n  style="width:100%;max-width:640px;height:340px;border:0;border-radius:16px;overflow:hidden"\n  loading="lazy" title="כמה עולה המתכון? — Savy"></iframe>`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <div className="max-w-3xl mx-auto px-4">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a><span className="mx-1">›</span>
          <span className="text-stone-500">ווידג'ט לבלוגים</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">
          🧩 הוסיפו "כמה עולה המתכון?" לבלוג שלכם — בחינם
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-6">
          ווידג'ט קטן שמציג לקוראים שלכם <strong className="text-stone-700">כמה עולים המצרכים של המתכון, ובאיזו רשת הכי זול</strong> —
          עם מחירים חיים שמתעדכנים לבד, לנצח. מדביקים פעם אחת, והפוסט שלכם עונה על השאלה שכל קוראת שואלת.
          בלי התקנות, בלי חשבון, בלי תחזוקה.
        </p>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-5">
          <h2 className="font-black text-lg text-stone-800 mb-3">1️⃣ מלאו את פרטי המתכון</h2>
          <label className="block text-xs font-bold text-stone-500 mb-1">שם המתכון</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-emerald-400" />
          <label className="block text-xs font-bold text-stone-500 mb-1">המצרכים — שורה לכל מצרך, בדיוק כמו במתכון</label>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:border-emerald-400" />
          <div className="text-[11px] text-stone-400 mt-1">זוהו {parsed.length} מצרכים: {parsed.map((p) => p.q).join(" · ")}</div>
          <label className="block text-xs font-bold text-stone-500 mt-3 mb-1">כתובת הבלוג (לא חובה)</label>
          <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="myfoodblog.co.il" dir="ltr" maxLength={100}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-5">
          <h2 className="font-black text-lg text-stone-800 mb-3">2️⃣ ככה זה ייראה בפוסט שלכם</h2>
          <div className="rounded-2xl overflow-hidden border border-stone-100 bg-stone-50">
            <iframe key={embedUrl} src={embedUrl} title="תצוגה מקדימה" loading="lazy"
              style={{ width: "100%", maxWidth: 640, height: 340, border: 0, display: "block", margin: "0 auto" }} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-5">
          <h2 className="font-black text-lg text-stone-800 mb-3">3️⃣ העתיקו את הקוד והדביקו בפוסט</h2>
          <pre dir="ltr" className="bg-stone-800 text-emerald-300 text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
          <button onClick={copy}
            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl py-3 text-sm transition">
            {copied ? "הועתק! ✓" : "📋 העתקת הקוד"}
          </button>
          <div className="text-xs text-stone-500 leading-relaxed mt-4 space-y-1">
            <p><strong>וורדפרס:</strong> בעורך הפוסט הוסיפו בלוק <strong>Custom HTML</strong> והדביקו.</p>
            <p><strong>Wix:</strong> הוסף אלמנט ← Embed ← <strong>Embed HTML</strong> והדביקו.</p>
            <p><strong>כל פלטפורמה אחרת:</strong> כל עורך שמקבל HTML — אותו דבר.</p>
          </div>
        </section>

        <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-sm text-emerald-900 leading-relaxed">
          <h2 className="font-black text-lg mb-2">למה שווה לכם?</h2>
          <ul className="space-y-1 list-disc pr-5">
            <li>הפוסט עונה על "כמה זה יעלה לי?" — השאלה הראשונה של כל קוראת</li>
            <li>המחירים מתעדכנים אוטומטית כל יום — גם בפוסטים ישנים</li>
            <li>תוכן אינטראקטיבי = זמן שהייה גבוה יותר בדף = SEO טוב יותר לכם</li>
            <li>בחינם, ללא הגבלה. שאלות? <a href="mailto:info@savy.co.il" className="underline">info@savy.co.il</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
