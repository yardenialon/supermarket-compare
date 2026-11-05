"use client";
import { useEffect, useState } from "react";
import { getPushSubscription, subscribeToPush, syncWatchList, watchItemsFromList } from "@/components/PushNotifications";

// Inline opt-in shown next to the basket comparison results: turn the list
// the user just built into personal price-drop alerts. If already subscribed
// it quietly confirms the list is being watched.
export default function AlertsOptIn({ list }: { list: any[] }) {
  const [state, setState] = useState<"hidden" | "offer" | "working" | "active">("hidden");

  useEffect(() => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return;
      getPushSubscription().then((sub) => setState(sub ? "active" : "offer"));
    } catch {}
  }, []);

  const enable = async () => {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("offer"); return; }
      const ok = await subscribeToPush();
      if (ok) {
        await syncWatchList(watchItemsFromList(list));
        setState("active");
      } else setState("offer");
    } catch { setState("offer"); }
  };

  if (state === "hidden") return null;

  if (state === "active") {
    return (
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-emerald-600 px-1">
        🔔 נעדכן אתכם בפוש כשמוצר מהרשימה יירד במחיר
      </div>
    );
  }

  return (
    <button onClick={enable} disabled={state === "working"}
      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-100 rounded-xl px-3 py-2.5 transition">
      🔔 {state === "working" ? "רגע..." : "קבלו התראה כשמוצר מהרשימה יורד במחיר"}
    </button>
  );
}
