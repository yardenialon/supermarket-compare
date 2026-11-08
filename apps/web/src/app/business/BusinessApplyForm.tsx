"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const STORE_TYPES = [
  "מינימרקט / סופר שכונתי",
  "סופר חברתי",
  "חנות סטוק",
  "ירקן / מעדנייה",
  "אחר",
];

export default function BusinessApplyForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [storeType, setStoreType] = useState(STORE_TYPES[0]);
  const [eligibility, setEligibility] = useState("לכולם");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      businessName: f.get("businessName"),
      storeType,
      city: f.get("city"),
      contactName: f.get("contactName"),
      phone: f.get("phone"),
      email: f.get("email"),
      message: f.get("message"),
      eligibility: storeType === "סופר חברתי" ? eligibility : "",
    };
    setState("sending");
    try {
      const res = await fetch(`${API}/partners/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrMsg(data?.error || "משהו השתבש, נסו שוב");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErrMsg("בעיית תקשורת — נסו שוב, או כתבו לנו ל-info@savy.co.il");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <div className="font-black text-stone-800 text-lg">הפנייה התקבלה!</div>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">
          נחזור אליכם תוך יום־יומיים. רוצים לזרז? שלחו כבר עכשיו מחירון
          (אקסל / צילום) ל־
          <a href="mailto:info@savy.co.il" className="text-emerald-600 hover:underline">info@savy.co.il</a>
        </p>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-stone-600 mb-1">שם העסק *</label>
        <input name="businessName" required minLength={2} maxLength={120} className={input} placeholder='למשל: "החישוק — סופר שכונתי"' />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">סוג העסק</label>
          <select value={storeType} onChange={(e) => setStoreType(e.target.value)} className={input}>
            {STORE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">עיר</label>
          <input name="city" maxLength={60} className={input} placeholder="תל אביב" />
        </div>
      </div>

      {storeType === "סופר חברתי" && (
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <label className="block text-xs font-bold text-stone-600 mb-1.5">מי יכול לקנות אצלכם?</label>
          <div className="flex gap-2">
            {["לכולם", "לזכאים בלבד"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEligibility(v)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold border transition ${
                  eligibility === v
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-stone-600 border-stone-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-stone-500 mt-1.5">
            חנות לזכאים בלבד מוצגת באתר עם תווית ברורה — שקיפות מלאה למשתמשים.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-stone-600 mb-1">איש קשר</label>
        <input name="contactName" maxLength={80} className={input} placeholder="שם מלא" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">טלפון</label>
          <input name="phone" type="tel" maxLength={40} className={input} placeholder="050-0000000" dir="ltr" style={{ textAlign: "right" }} />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">אימייל</label>
          <input name="email" type="email" maxLength={120} className={input} placeholder="you@example.com" dir="ltr" style={{ textAlign: "right" }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 mb-1">משהו שכדאי שנדע? (לא חובה)</label>
        <textarea name="message" maxLength={2000} rows={2} className={input} placeholder="כמה סניפים, איזה סוג מחירון יש לכם..." />
      </div>

      {state === "error" && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errMsg}</div>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black rounded-xl py-3 transition shadow-sm"
      >
        {state === "sending" ? "שולח..." : "הצטרפו לסאבי — בחינם"}
      </button>
      <p className="text-[11px] text-stone-400 text-center">
        חובה טלפון או אימייל כדי שנוכל לחזור אליכם. לא נשתמש בפרטים לשום דבר אחר.
      </p>
    </form>
  );
}
