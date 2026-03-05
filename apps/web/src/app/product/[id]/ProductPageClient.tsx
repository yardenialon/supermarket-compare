"use client";
// apps/web/src/app/product/[id]/ProductPageClient.tsx

import { useState, useEffect } from "react";
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
};
const SUBCHAINS: Record<string, { he: string; logo: string }> = {
  "שופרסל שלי":    { he: "שופרסל שלי",    logo: "/logos/subchains/shufersal-sheli.png" },
  "שופרסל דיל":    { he: "שופרסל דיל",    logo: "/logos/subchains/shufersal-deal.png" },
  "שופרסל אקספרס": { he: "שופרסל אקספרס", logo: "/logos/subchains/shufersal-express.png" },
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
    .filter((p) => !chainFilter || p.chainName === chainFilter)
    .sort((a, b) => a.price - b.price);

  const cheap = fp.length ? Math.min(...fp.map((p) => p.price)) : 0;
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
                <CLogo name={ch} size={16} />
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
                    <CLogo name={p.chainName} subchain={p.subchainName} size={44} />
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

        {/* SEO text block - helps Google understand the page */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 mb-2 text-base">
            מחיר {name}{brand ? ` ${brand}` : ""} בסופרמרקטים
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            {name}{brand ? ` של ${brand}` : ""}
            {category ? ` בקטגוריית ${category}` : ""} —
            מחיר עדכני ב-{storeCount} חנויות ברחבי ישראל.
            {cheap > 0 && ` המחיר הזול ביותר כרגע הוא ₪${cheap.toFixed(2)}.`}
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
