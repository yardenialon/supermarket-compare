"use client";
import { useEffect, useState } from "react";
import { subscribeToPush } from "@/components/PushNotifications";

// Smart opt-in banner for the weekly "best-value recipe" push.
// Shows only when it can actually work: push supported, permission not
// denied, not already subscribed, and not dismissed in the last 30 days.
const DISMISS_KEY = "savy-recipe-push-dismissed";
const DISMISS_FOR_MS = 30 * 24 * 3600 * 1000;

export default function RecipePushBanner() {
  const [state, setState] = useState<"hidden" | "show" | "working" | "done" | "error">("hidden");

  useEffect(() => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return;
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - Number(dismissed) < DISMISS_FOR_MS) return;
      const timeout = setTimeout(() => setState("show"), 3000); // SW slow? show anyway
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => { clearTimeout(timeout); if (!sub) setState("show"); })
        .catch(() => { clearTimeout(timeout); setState("show"); });
      return () => clearTimeout(timeout);
    } catch {}
  }, []);

  if (state === "hidden") return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setState("hidden");
  };

  const signUp = async () => {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("hidden"); return; }
      const ok = await subscribeToPush();
      setState(ok ? "done" : "error");
    } catch { setState("error"); }
  };

  if (state === "done") {
    return (
      <div dir="rtl" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-center">
        <div className="text-2xl mb-1">🎉</div>
        <div className="font-bold text-sm text-emerald-800">נרשמתם! נתראה ביום חמישי בבוקר עם המתכון המשתלם של השבוע 🍳</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative bg-gradient-to-l from-emerald-50 to-white border border-emerald-100 rounded-2xl p-4 mb-6 shadow-sm">
      <button onClick={dismiss} aria-label="סגירה"
        className="absolute top-2 left-2 w-7 h-7 rounded-full text-stone-300 hover:text-stone-500 hover:bg-stone-100 transition text-sm">
        ✕
      </button>
      <div className="flex items-center gap-3">
        <div className="text-3xl shrink-0">🔔</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm text-stone-800 leading-snug">המתכון המשתלם של השבוע — ישר לנייד</div>
          <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            פוש אחד בשבוע, ביום חמישי בבוקר: המתכון שהכי שווה לבשל לפי מבצעי השבוע, עם המחיר והרשת הזולה.
          </div>
          {state === "error" && <div className="text-[11px] text-rose-500 mt-1">ההרשמה לא הצליחה — נסו שוב</div>}
        </div>
        <button onClick={signUp} disabled={state === "working"}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl px-4 py-2.5 transition shadow-sm">
          {state === "working" ? "רגע..." : "הרשמה"}
        </button>
      </div>
    </div>
  );
}
