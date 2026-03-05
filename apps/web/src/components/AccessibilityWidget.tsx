"use client";
import { useState, useEffect } from "react";

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [linksHighlight, setLinksHighlight] = useState(false);
  const [grayscale, setGrayscale] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSize + "%";
    if (highContrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");
    if (linksHighlight) root.classList.add("links-highlight");
    else root.classList.remove("links-highlight");
    if (grayscale) root.classList.add("grayscale-mode");
    else root.classList.remove("grayscale-mode");
  }, [fontSize, highContrast, linksHighlight, grayscale]);

  const reset = () => {
    setFontSize(100);
    setHighContrast(false);
    setLinksHighlight(false);
    setGrayscale(false);
  };

  return (
    <>
      <style>{`
        .high-contrast { filter: contrast(1.5) !important; }
        .grayscale-mode { filter: grayscale(1) !important; }
        .links-highlight a { text-decoration: underline !important; outline: 2px solid #059669 !important; outline-offset: 2px !important; }
        *:focus-visible { outline: 3px solid #059669 !important; outline-offset: 2px !important; }
      `}</style>

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="פתח תפריט נגישות"
        className="fixed bottom-6 left-4 z-50 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all"
        title="נגישות"
      >
        ♿
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="תפריט נגישות"
          className="fixed bottom-20 left-4 z-50 bg-white rounded-2xl shadow-2xl border border-stone-100 w-64 p-4"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-stone-800 text-sm">הגדרות נגישות</h2>
            <button onClick={() => setOpen(false)} aria-label="סגור" className="text-stone-400 hover:text-stone-600 text-lg">✕</button>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <p className="text-xs font-bold text-stone-500 mb-2">גודל טקסט</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontSize(f => Math.max(80, f - 10))} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-600 text-sm">A-</button>
              <span className="flex-1 text-center text-sm font-mono font-bold text-stone-600">{fontSize}%</span>
              <button onClick={() => setFontSize(f => Math.min(150, f + 10))} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-600 text-sm">A+</button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 mb-4">
            {[
              { label: "ניגודיות גבוהה", value: highContrast, set: setHighContrast },
              { label: "הדגשת קישורים", value: linksHighlight, set: setLinksHighlight },
              { label: "גווני אפור", value: grayscale, set: setGrayscale },
            ].map(({ label, value, set }) => (
              <button
                key={label}
                onClick={() => set(v => !v)}
                className={"w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition " + (value ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100")}
              >
                {label}
                <span className={"w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs " + (value ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300")}>
                  {value ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>

          <button onClick={reset} className="w-full py-2 rounded-xl bg-stone-100 text-stone-500 text-xs font-bold hover:bg-stone-200 transition">
            איפוס הגדרות
          </button>

          <a href="/accessibility" className="block text-center text-xs text-emerald-600 hover:underline mt-3">
            הצהרת נגישות
          </a>
        </div>
      )}
    </>
  );
}
