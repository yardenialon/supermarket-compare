"use client";
// apps/web/src/app/product/[id]/ProductPageClient.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─── Constants (copied from page.tsx to keep in sync) ─────────────

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  Shufersal:    { he: "שופרסל",      color: "#e11d48", logo: "/logos/shufersal.png" },
  "Rami Levy":  { he: "רמי לוי",     color: "#2563eb", logo: "/logos/rami-levy.png" },
  Victory:      { he: "ויקטורי",     color: "#f59e0b", logo: "/logos/victory.png" },
  Mega:         { he: "מגה",         color: "#16a34a", logo: "/logos/mega.png" },
  "Osher Ad":   { he: "אושר עד",     color: "#8b5cf6", logo: "/logos/osher-ad.png" },
  "Tiv Taam":   { he: "טיב טעם",     color: "#ec4899", logo: "/logos/tiv-taam.png" },
  Yochananof:   { he: "יוחננוף",     color: "#0891b2", logo: "/logos/yochananof.png" },
  "Hazi Hinam": { he: "חצי חינם",    color: "#ea580c", logo: "/logos/hazi-hinam.png" },
  Freshmarket:  { he: "פרשמרקט",     color: "#6366f1", logo: "/logos/freshmarket.png" },
  "Yayno Bitan":{ he: "יינות ביתן",  color: "#dc2626", logo: "/logos/yayno-bitan.png" },
  "Dor Alon":   { he: "דור אלון",    color: "#0d9488", logo: "/logos/alunit.png" },
  "AM-PM":      { he: "AM-PM",       color: "#e67e00", logo: "/logos/ampm.png" },
  "אלונית":     { he: "אלונית",      color: "#0d9488", logo: "/logos/alunit.png" },
  "דוכן":       { he: "דוכן",        color: "#5b6b7c", logo: "/logos/dohan.png" },
  Bareket:      { he: "סופר ברקת",   color: "#a855f7", logo: "/logos/bareket.png" },
  Yellow:       { he: "ילו (כרפור)", color: "#eab308", logo: "/logos/yellow.png" },
  Carrefour:    { he: "קרפור",       color: "#004e9f", logo: "/logos/Carrefour.png" },
  "Mahsani Ashuk": { he: "מחסני השוק", color: "#f97316", logo: "/logos/mahsani-ashuk.png" },
  "Stop Market":        { he: "סטופ מרקט",    color: "#dc2626", logo: "/logos/stopmarket.png" },
  "Shuk Ahir":          { he: "שוק אחיר",     color: "#16a34a", logo: "/logos/shuk-haeir.png" },
  "Shefa Barcart Ashem":{ he: "שפע ברכת השם", color: "#7c3aed", logo: "/logos/Shefa-Barcart-Ashem.png" },
  "Wolt":               { he: "וולט",         color: "#00c2e0", logo: "/logos/wolt.png" },
  "Super Pharm":        { he: "סופר-פארם",    color: "#e11d48", logo: "/logos/Good-Pharm.png" },
  "Quik":               { he: "קוויק",        color: "#004e9f", logo: "/logos/Carrefour.png" },
  "Super Yuda":         { he: "סופר יודה",    color: "#0369a1", logo: "/logos/super-yuda.png" },
  "City Market":        { he: "סיטי מרקט",    color: "#0891b2", logo: "/logos/city-market.png" },
  "Maayan 2000":        { he: "מעיין 2000",   color: "#0d9488", logo: "/logos/maian2000.png" },
  "Polizer":            { he: "פוליצר",       color: "#7c3aed", logo: "/logos/polizer.png" },
  "Salach Dabach":      { he: "צאלח דבח",     color: "#16a34a", logo: "/logos/salach-dabach.png" },
  "Zol Vebegadol":      { he: "זול ובגדול",   color: "#ea580c", logo: "/logos/zol-vebegadol.png" },
  "Netiv Hased":        { he: "נתיב החסד",    color: "#15803d", logo: "/logos/Netiv-Hased.png" },
  "Het Cohen":          { he: "חט כהן",       color: "#b45309", logo: "/logos/Het-Cohen.png" },
  "King Store":         { he: "קינג סטור",    color: "#1d4ed8", logo: "/logos/king-store.png" },
  "Keshet Taamim":      { he: "קשת טעמים",    color: "#9333ea", logo: "/logos/keshet-taamim.png" },
};
const SUBCHAINS: Record<string, { he: string; logo: string }> = {
  "שופרסל שלי":    { he: "שופרסל שלי",    logo: "/logos/subchains/shufersal-sheli.png" },
  "שופרסל דיל":    { he: "שופרסל דיל",    logo: "/logos/subchains/shufersal-deal.png" },
  "שופרסל אקספרס": { he: "שופרסל אקספרס", logo: "/logos/subchains/shufersal-express.png" },
  "יש חסד":        { he: "יש חסד",        logo: "/logos/subchains/yesh-hesed.png" },
  Be:              { he: "BE",             logo: "/logos/subchains/be.png" },
  "AM-PM":         { he: "AM-PM",           logo: "/logos/ampm.png" },
  "אלונית":        { he: "אלונית",          logo: "/logos/alunit.png" },
  "דוכן":          { he: "דוכן",            logo: "/logos/dohan.png" },
};

const chainHe = (n: string) => CHAINS[n]?.he || n;
const chainClr = (n: string) => CHAINS[n]?.color || "#6b7280";
const chainLogo = (n: string) => CHAINS[n]?.logo || "";
const subchainLogo = (s?: string) => (s ? SUBCHAINS[s]?.logo || "" : "");
const subchainHe = (s?: string) => (s ? SUBCHAINS[s]?.he || s : "");


function NutritionCard({ product }: { product: any }) {
  const { energyKcal, proteinG, carbsG, sugarsG, fatG, saturatedFatG,
          transFatG, sodiumMg, fiberG, cholesterolMg, ingredients, allergens,
          highSaturatedFat, highSugars, highSodium } = product;

  if (!energyKcal && !ingredients) return null;

  const round = (v: any) => Math.round(Number(v) * 10) / 10;
  const pct = (v: any, daily: number) => Math.min(100, Math.round((Number(v) / daily) * 100));

  const macros = [
    {
      label: 'קלוריות', value: energyKcal, unit: 'קק"ל', daily: 2000,
      color: '#059669', bg: '#ecfdf5',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#059669"><path d="M12.5 2C12.5 2 10 5.5 10 9c0 1.1.4 2 1 2.7C11 10 11.5 8.5 12.5 7c0 2 .5 4 2 5.5.3-1 .5-2 .5-3 1 1.5 1.5 3.2 1.5 5a4.5 4.5 0 01-9 0C7.5 9 12.5 2 12.5 2zm0 13c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.5 2-4 2-4s2 2.5 2 4z"/></svg>
    },
    {
      label: 'חלבון', value: proteinG, unit: 'g', daily: 50,
      color: '#2563eb', bg: '#eff6ff',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#2563eb"><path d="M12 3C9.5 3 7 5 7 8c0 2 1 3.5 2.5 4.5L8 18h8l-1.5-5.5C16 11.5 17 10 17 8c0-3-2.5-5-5-5zm-1 5.5c-.8 0-1.5-.7-1.5-1.5S10.2 5.5 11 5.5s1.5.7 1.5 1.5S11.8 8.5 11 8.5z"/></svg>
    },
    {
      label: 'פחמימות', value: carbsG, unit: 'g', daily: 260,
      color: '#ca8a04', bg: '#fefce8',
      icon: <svg width="20" height="20" viewBox="0 0 32 32" fill="#ca8a04"><path d="M16 2c-1 0-2 .5-2 1.5 0 .7.3 1.3.7 1.8C13 6 12 7.5 12 9c0 1 .3 2 .8 2.7C11 12.5 10 14 10 16c0 1.2.4 2.3 1 3.2C9.5 20 9 21.3 9 22.7V28h2v-5.3c0-1 .5-2 1.3-2.6.5.8 1.1 1.5 1.7 2V28h4v-5.9c.6-.5 1.2-1.2 1.7-2 .8.6 1.3 1.6 1.3 2.6V28h2v-5.3c0-1.4-.5-2.7-1-3.5.6-.9 1-2 1-3.2 0-2-1-3.5-2.8-4.3.5-.7.8-1.7.8-2.7 0-1.5-1-3-2.5-3.7.4-.5.7-1.1.7-1.8C18 2.5 17 2 16 2zm0 3c.6 0 1 .4 1 .8 0 1.2-1 2.5-1 2.5S15 7 15 5.8c0-.4.4-.8 1-.8zm0 5c.8 0 1.5 1 1.5 2.2 0 1-.5 2-1.5 2s-1.5-1-1.5-2c0-1.2.7-2.2 1.5-2.2zm0 6c1 0 1.8 1.2 1.8 2.7 0 1.2-.5 2.2-1.3 2.7h-1c-.8-.5-1.3-1.5-1.3-2.7 0-1.5.8-2.7 1.8-2.7z"/></svg>
    },
    {
      label: 'שומן', value: fatG, unit: 'g', daily: 78,
      color: '#9333ea', bg: '#faf5ff',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9333ea"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2zm0 18a5 5 0 01-5-5c0-3.5 3.5-9 5-11.5 1.5 2.5 5 8 5 11.5a5 5 0 01-5 5z"/><path d="M9 15.5c0-1.5 1.5-4 1.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/></svg>
    },
  ].filter(m => m.value != null);

  const detailRows = [
    { label: 'שומן רווי', value: saturatedFatG, unit: 'g', flag: highSaturatedFat },
    { label: 'שומן טראנס', value: transFatG, unit: 'g' },
    { label: 'סוכרים', value: sugarsG, unit: 'g', flag: highSugars },
    { label: 'נתרן', value: sodiumMg, unit: 'מ"ג', flag: highSodium },
    { label: 'סיבים', value: fiberG, unit: 'g' },
    { label: 'כולסטרול', value: cholesterolMg, unit: 'מ"ג' },
  ].filter(r => r.value !== null && r.value !== undefined);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">

      {/* כותרת */}
      <div className="px-5 py-5 border-b border-stone-100">
        <h2 className="font-bold text-xl text-stone-800">ערכים תזונתיים</h2>
        <p className="text-sm text-stone-400 mt-1">לכל 100 גרם מוצר</p>
      </div>

      {/* מאקרו גריד */}
      {macros.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-stone-100">
          {macros.map((m, i) => {
            const p = pct(m.value, m.daily);
            return (
              <div key={i} className="rounded-2xl p-3.5 flex flex-col gap-2" style={{background: m.bg}}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background: 'white'}}>
                  {m.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{color: m.color, lineHeight:1}}>
                    {m.label === 'קלוריות' ? Math.round(Number(m.value)) : round(m.value)}
                    <span className="text-xs font-normal text-stone-400 mr-1">{m.unit}</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{m.label}</div>
                </div>
                <div>
                  <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width: `${p}%`, background: m.color}} />
                  </div>
                  <div className="text-[9px] mt-1" style={{color: m.color}}>{p}% מהצריכה היומית</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* פירוט */}
      {detailRows.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-stone-100">
          {detailRows.map((row, i) => (
            <div key={i} className="bg-stone-50 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                {row.flag && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 inline-block" />}
                <span className="text-[10px] text-stone-400 leading-tight">{row.label}</span>
              </div>
              <div className="text-base font-bold text-stone-800">
                {round(row.value)}<span className="text-[10px] font-normal text-stone-400 mr-0.5">{row.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* סימוני מזון */}
      {(highSaturatedFat || highSugars || highSodium) && (
        <div className="flex gap-5 justify-center px-5 py-5 border-b border-red-100 bg-red-50/30">
          {highSaturatedFat && (
            <div className="flex flex-col items-center gap-1.5">
              <img src="/icons/food-marking/shoman.png" alt="שומן רווי בכמות גבוהה" className="w-14 h-14 object-contain" />
              <span className="text-[10px] text-red-700 font-medium text-center leading-tight max-w-[64px]">שומן רווי בכמות גבוהה</span>
            </div>
          )}
          {highSugars && (
            <div className="flex flex-col items-center gap-1.5">
              <img src="/icons/food-marking/suger.png" alt="סוכר בכמות גבוהה" className="w-14 h-14 object-contain" />
              <span className="text-[10px] text-red-700 font-medium text-center leading-tight max-w-[64px]">סוכר בכמות גבוהה</span>
            </div>
          )}
          {highSodium && (
            <div className="flex flex-col items-center gap-1.5">
              <img src="/icons/food-marking/natran.png" alt="נתרן בכמות גבוהה" className="w-14 h-14 object-contain" />
              <span className="text-[10px] text-red-700 font-medium text-center leading-tight max-w-[64px]">נתרן בכמות גבוהה</span>
            </div>
          )}
        </div>
      )}

      {/* רכיבים */}
      {ingredients && (
        <div className="px-5 py-4 border-b border-stone-100">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">רכיבים</p>
          <p className="text-xs text-stone-600 leading-relaxed">{ingredients}</p>
        </div>
      )}

      {/* אזהרת אלרגנים */}
      {allergens && (
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/40">
          <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            אזהרת אלרגנים
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">{allergens}</p>
        </div>
      )}

      {/* דיסקליימר */}
      <div className="px-5 py-3 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          הנתונים המדויקים מופיעים על גבי המוצר. אין להסתמך על הפירוט המופיע באתר — יתכנו טעויות או אי התאמות. יש לקרוא את המופיע על גבי אריזת המוצר לפני השימוש. התמונות והתאריכים המופיעים הינם להמחשה בלבד ואין להסתמך עליהם.
        </p>
      </div>
    </div>
  );
}

function distToKm(d: number) {
  return Math.sqrt(d) * 111;
}

// ─── CLogo ────────────────────────────────────────────────────────

function CLogo({ name, subchain, size = 40 }: { name: string; subchain?: string; size?: number }) {
  const sLogo = subchainLogo(subchain);
  const logo = sLogo || chainLogo(name);
  const color = chainClr(name);
  const he = subchain ? subchainHe(subchain) : chainHe(name);
  const [err, setErr] = useState(false);
  if (logo && !err)
    return (
      <div style={{ width: size, height: size, borderRadius: size > 40 ? 16 : 10, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src={logo} alt={he} width={size} height={size} onError={() => setErr(true)} className="object-contain p-1" style={{ width: size, height: size }} />
      </div>
    );
  return (
    <span className="flex items-center justify-center text-white font-black" style={{ backgroundColor: color, width: size, height: size, borderRadius: size > 40 ? 16 : 10, fontSize: size * 0.42 }}>
      {he.charAt(0)}
    </span>
  );
}

// ─── ProductImg ───────────────────────────────────────────────────

function ProductImg({ name, imageUrl, size = 80 }: { name: string; imageUrl?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err)
    return (
      <div className="rounded-2xl bg-stone-100 flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <span className="text-stone-300" style={{ fontSize: size * 0.45 }}>📦</span>
      </div>
    );
  return (
    <div className="rounded-2xl bg-stone-50 shrink-0 overflow-hidden flex items-center justify-center border border-stone-100" style={{ width: size, height: size }}>
      <img src={imageUrl} alt={name} onError={() => setErr(true)} className="max-w-full max-h-full object-contain p-2" />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────

interface Price {
  price: number;
  isPromo: boolean;
  storeId: number;
  storeName: string;
  city: string;
  chainName: string;
  subchainName?: string;
  dist?: number;
}

interface Product {
  id: number;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  unitQty?: string;
  unitMeasure?: string;
  min_price?: number;
  minPrice?: number;
  store_count?: number;
  storeCount?: number;
  image_url?: string;
  imageUrl?: string;
}

// ─── Main client component ────────────────────────────────────────

const API = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api")
  : (process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api");

function SavyPromoBanner() {
  function handleInstall() {
    if ((window as any).__savyInstallPWA) {
      (window as any).__savyInstallPWA();
    } else if ((window as any).__savyShowPWABanner) {
      (window as any).__savyShowPWABanner();
    } else {
      window.location.href = '/';
    }
  }
  return (
    <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: 20, padding: "20px 18px", position: "relative", overflow: "hidden", direction: "rtl" }}>
      <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", bottom: -20, left: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div className="inline-block bg-white/20 rounded-xl px-3 py-1 mb-3">
        <span className="text-white text-xs font-bold">Savy — השוואת מחירי סופרמרקט</span>
      </div>
      <div className="text-white font-black text-lg leading-snug mb-2">
        חוסכים יותר, קונים חכם יותר
      </div>
      <div className="text-white/85 text-sm leading-relaxed mb-4">
        בנו רשימת קניות משותפת, השוו סל קניות מלא ומצאו את הסופר הזול ביותר — 25+ רשתות, מתעדכן 24/7.
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: "🛒", title: "רשימת קניות", sub: "משותפת" },
          { icon: "💰", title: "השוואת סל", sub: "מי הזול?" },
          { icon: "📸", title: "סריקת קבלה", sub: "כמה שילמת?" },
        ].map(({ icon, title, sub }) => (
          <div key={title} className="bg-white/15 rounded-2xl p-2.5 text-center">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-white text-xs font-bold leading-tight">{title}</div>
            <div className="text-white/75 text-[10px] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleInstall}
          className="flex-1 bg-white text-emerald-600 font-black text-sm rounded-xl py-3 hover:bg-emerald-50 transition active:scale-95">
          הוסף למסך הבית
        </button>
        <a href="/"
          className="bg-white/20 text-white font-bold text-sm rounded-xl py-3 px-4 hover:bg-white/30 transition active:scale-95 whitespace-nowrap">
          נסה עכשיו
        </a>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-white/80 text-xs">25+ רשתות</span>
        <div className="w-px h-3 bg-white/30" />
        <span className="text-white/80 text-xs">615K מוצרים</span>
        <div className="w-px h-3 bg-white/30" />
        <span className="text-white/80 text-xs">עדכון יומי</span>
      </div>
    </div>
  );
}

function RelatedProducts({ category, currentId }: { category: string; currentId: number }) {
  const [related, setRelated] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API}/category/${encodeURIComponent(category)}/products?page=0`)
      .then(r => r.json())
      .then(d => {
        const filtered = (d.products || []).filter((p: any) => p.id !== currentId).slice(0, 6);
        setRelated(filtered);
      })
      .catch(() => {});
  }, [category, currentId]);
  if (!related.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <h2 className="font-bold text-stone-800 mb-3 text-base">מוצרים נוספים ב{category}</h2>
      <div className="grid grid-cols-3 gap-2">
        {related.map(p => (
          <a key={p.id} href={`/product/${p.id}`}
            className="flex flex-col gap-1.5 p-2 rounded-xl border border-stone-100 hover:border-emerald-300 hover:shadow-sm transition">
            <div className="w-full aspect-square bg-stone-50 rounded-lg flex items-center justify-center overflow-hidden">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} className="max-w-full max-h-full object-contain p-1" />
                : <span className="text-2xl">📦</span>}
            </div>
            <div className="text-xs font-medium text-stone-700 leading-snug line-clamp-2">{p.name}</div>
            {p.minPrice && <div className="text-xs font-black text-emerald-600">₪{Number(p.minPrice).toFixed(2)}</div>}
          </a>
        ))}
      </div>
      <a href={`/category/${encodeURIComponent(category)}`}
        className="block text-center text-xs text-emerald-600 hover:underline mt-3 font-medium">
        כל המוצרים ב{category} ←
      </a>
    </div>
  );
}

export default function ProductPageClient({
  product,
  initialPrices,
  id,
}: {
  product: Product;
  initialPrices: Price[];
  id: string;
}) {
  const [prices, setPrices] = useState<Price[]>(initialPrices);
  const [imageUrl, setImageUrl] = useState<string | null>(
    product.image_url ?? product.imageUrl ?? null
  );
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locMode, setLocMode] = useState<"cheapest" | "nearby">("cheapest");
  const [radius, setRadius] = useState<number>(10);
  const prevRadius = React.useRef(10);
  React.useEffect(() => {
    if (locMode === "nearby" && userLoc && radius !== prevRadius.current) {
      prevRadius.current = radius;
      fetchPrices(userLoc.lat, userLoc.lng);
    }
  }, [radius]);
  const [locLoading, setLocLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  // Try to get image if missing
  useEffect(() => {
    if (!imageUrl) {
      api.image(product.id ?? Number(id))
        .then((d: any) => { if (d.imageUrl) setImageUrl(d.imageUrl); })
        .catch(() => {});
    }
  }, []);

  // Re-fetch prices when mode changes
  const fetchPrices = (lat?: number, lng?: number) => {
    setLoading(true);
    api.prices(product.id ?? Number(id), lat, lng)
      .then((d: any) => { setPrices(d.prices ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleNearby = () => {
    if (userLoc) {
      setLocMode("nearby");
      fetchPrices(userLoc.lat, userLoc.lng);
      return;
    }
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setLocMode("nearby");
        setLocLoading(false);
        fetchPrices(loc.lat, loc.lng);
      },
      () => setLocLoading(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  const handleCheapest = () => {
    setLocMode("cheapest");
    fetchPrices();
  };

  const addToList = () => {
    try {
      const saved = localStorage.getItem("savy-list");
      const list = saved ? JSON.parse(saved) : [];
      if (!list.find((i: any) => i.product?.id === (product.id ?? Number(id)))) {
        list.push({ product: { id: product.id ?? Number(id), name: product.name, barcode: product.barcode, brand: product.brand, minPrice: product.min_price ?? product.minPrice }, qty: 1 });
        localStorage.setItem("savy-list", JSON.stringify(list));
      }
      setToast("נוסף לרשימה ✓");
      setTimeout(() => setToast(""), 2000);
    } catch {}
  };

  const fp = prices
    .filter((p) => {
      if (chainFilter && p.chainName !== chainFilter) return false;
      if (locMode === "nearby" && p.dist !== undefined && p.dist !== null) {
        const km = Math.sqrt(p.dist) * 111;
        if (km > radius) return false;
      }
      return true;
    })
    .sort((a, b) => a.price - b.price);

  const cheap = fp.length ? Math.min(...fp.map((p) => p.price)) : 0;
  const expensive = fp.length ? Math.max(...fp.map((p) => p.price)) : 0;
  const priceDiff = cheap > 0 && expensive > 0 ? Math.round((expensive - cheap) / cheap * 100) : 0;
  const cheapestEntry = fp.length ? fp.reduce((a, b) => a.price < b.price ? a : b) : null;
  const cheapestChain = cheapestEntry ? (cheapestEntry.subchainName || cheapestEntry.chainName) : null;
  const exp   = fp.length ? Math.max(...fp.map((p) => p.price)) : 0;
  const uChains = [...new Set(prices.map((p) => p.chainName))].sort();

  const name     = product.name;
  const brand    = product.brand;
  const category = product.category;
  const barcode  = product.barcode;
  const unitQty  = product.unitQty;
  const unitMeasure = product.unitMeasure;
  const storeCount = product.store_count ?? product.storeCount ?? fp.length;

  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</span>
            {toast}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700 transition text-sm font-semibold flex items-center gap-1.5">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">›</span>
          {category && (
            <>
              <Link href={`/category/${encodeURIComponent(category)}`} className="text-stone-400 hover:text-emerald-600 transition text-sm font-medium">
                {category}
              </Link>
              <span className="text-stone-200">›</span>
            </>
          )}
          <span className="text-stone-600 text-sm font-semibold truncate max-w-[180px]">{name}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">

        {/* Product header card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <ProductImg name={name} imageUrl={imageUrl} size={96} />
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-2xl text-stone-800 leading-snug">{name}</h1>
              <div className="text-sm text-stone-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {brand && <span>{brand}</span>}
                {unitQty && unitQty !== "0" && <span>{unitQty} {unitMeasure}</span>}
                {barcode && <span>ברקוד: {barcode}</span>}
                {category && (
                  <Link href={`/category/${encodeURIComponent(category)}`} className="text-emerald-600 hover:underline font-medium">
                    {category}
                  </Link>
                )}
              </div>

              {cheap > 0 && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono font-black text-3xl text-emerald-600">₪{cheap.toFixed(2)}</span>
                  {exp > cheap && (
                    <span className="text-sm text-stone-400">— ₪{exp.toFixed(2)} <span className="text-red-400">({((exp - cheap) / cheap * 100).toFixed(0)}% הפרש)</span></span>
                  )}
                </div>
              )}
              <div className="text-xs text-stone-400 mt-1">{storeCount} חנויות</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={addToList} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-100">
              🛒 הוסף לרשימה
            </button>
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-sm font-bold hover:bg-stone-200 transition">
              🔍 חפש מוצר נוסף
            </Link>
          </div>
        </div>

        <NutritionCard product={product} />
        {/* Location mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={handleCheapest}
            className={"flex-1 py-3 rounded-xl text-sm font-bold transition " + (locMode === "cheapest" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border border-stone-200 text-stone-400 hover:border-stone-300")}
          >
            💰 הכי זול בארץ
          </button>
          <button
            onClick={handleNearby}
            className={"flex-1 py-3 rounded-xl text-sm font-bold transition " + (locMode === "nearby" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : locLoading ? "bg-amber-50 border border-amber-300 text-amber-600 animate-pulse" : "bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50")}
          >
            {locLoading ? "📍 מאתר..." : "📍 הכי זול ליד"}
          </button>
        </div>

        {/* Radius slider */}
        {locMode === "nearby" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-400">📍 רדיוס חיפוש</span>
              <span className="font-mono font-black text-lg text-emerald-600">{radius} <span className="text-xs font-semibold text-stone-400">ק״מ</span></span>
            </div>
            <div className="relative">
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" style={{width: `${(([1,3,5,10,15,20,30,50].indexOf(radius) + 1) / 8) * 100}%`}} />
              </div>
              <input
                type="range" min={0} max={7} dir="ltr"
                value={[1,3,5,10,15,20,30,50].indexOf(radius)}
                onChange={e => setRadius([1,3,5,10,15,20,30,50][7 - parseInt(e.target.value)])}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{height: '36px', top: '-14px'}}
              />
              <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full shadow-md transition-all duration-300 pointer-events-none"
                style={{right: `calc(${([1,3,5,10,15,20,30,50].indexOf(radius) / 7) * 100}% - 10px)`, left: 'auto'}} />
            </div>
            <div className="flex justify-between mt-2 px-0.5">
              {[1,3,5,10,15,20,30,50].map(v => (
                <button key={v} onClick={() => setRadius(v)} className={"text-[10px] font-bold transition-colors " + (radius === v ? "text-emerald-600" : "text-stone-400 hover:text-stone-600")}>{v}</button>
              ))}
            </div>
          </div>
        )}
        {/* Chain filter */}
        {uChains.length > 1 && (
          <div className="bg-white rounded-xl border border-stone-100 px-4 py-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setChainFilter(null)}
              className={"px-3 py-1 rounded text-xs font-semibold transition " + (!chainFilter ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600")}
            >
              הכל
            </button>
            {uChains.map((ch) => (
              <button
                key={ch}
                onClick={() => setChainFilter(chainFilter === ch ? null : ch)}
                className={"px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 " + (chainFilter === ch ? "text-white" : "text-stone-400 hover:text-stone-600")}
                style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}
              >
                <CLogo name={ch} size={22} />
                {chainHe(ch)}
              </button>
            ))}
          </div>
        )}

        {/* Price list */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between">
            <h2 className="font-bold text-stone-700 text-sm">מחירים לפי חנות</h2>
            {loading && <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />}
          </div>

          {!fp.length ? (
            <div className="p-12 text-center text-stone-300 text-sm">אין מחירים</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {fp.map((p, i) => (
                <div
                  key={i}
                  className={"flex items-center justify-between px-5 py-4 transition hover:bg-stone-50 " + (i === 0 ? "bg-emerald-50/40" : "")}
                >
                  <div className="flex items-center gap-3">
                    <CLogo name={p.chainName} subchain={p.subchainName} size={52} />
                    <div>
                      <div className="font-bold text-sm text-stone-700">
                        {p.subchainName ? subchainHe(p.subchainName) : chainHe(p.chainName)}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {p.storeName}
                        {p.city && p.city !== "0" && !p.city.match(/^\d+$/) && ` · ${p.city}`}
                        {p.dist != null && <span className="text-blue-400 mr-1"> · {distToKm(p.dist).toFixed(1)} ק״מ</span>}
                        {cheap > 0 && p.price > cheap && (
                          <span className="text-red-400 mr-1"> +{((p.price - cheap) / cheap * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={"font-mono font-black text-lg " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>
                      ₪{Number(p.price).toFixed(2)}
                    </span>
                    {p.isPromo && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">🔥 מבצע</span>
                    )}
                    {i === 0 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">הכי זול</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        <SavyPromoBanner />
        {category && <RelatedProducts category={category} currentId={product.id} />}

        {/* SEO text block - helps Google understand the page */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 mb-2 text-base">
            מחיר {name}{brand ? ` ${brand}` : ""} בסופרמרקטים
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            {name}{brand ? ` של ${brand}` : ""}
            {category ? ` בקטגוריית ${category}` : ""} —
            מחיר עדכני ב-{storeCount} חנויות ברחבי ישראל.
            {cheap > 0 && ` המחיר הזול ביותר כרגע הוא ₪${cheap.toFixed(2)}`}
            {cheap > 0 && expensive > 0 && cheapestChain ? ` ב${cheapestChain}.` : "."}
            {cheap > 0 && expensive > 0 && priceDiff > 0 && ` הפרש המחיר בין הזול ליקר ביותר הוא ${priceDiff}% — חיסכון של עד ₪${(expensive - cheap).toFixed(2)}.`}
            {" "}Savy משווה מחירים מכל רשתות הסופרמרקטים ומתעדכן יומית.
          </p>
          {barcode && (
            <p className="text-xs text-stone-400 mt-2">ברקוד: {barcode}</p>
          )}
        </div>

      </div>
    </div>
  );
}
