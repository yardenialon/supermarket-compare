"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { api, dealsApi } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { DealModal, HotDealsSlider } from "@/components/DealModal";

interface Product { id: number; barcode: string; name: string; brand: string; unitQty: string; unitMeasure: string; matchScore: number; minPrice: number | null; maxPrice: number | null; storeCount: number; imageUrl?: string | null; }
interface Price { price: number; isPromo: boolean; storeId: number; storeName: string; city: string; chainName: string; subchainName?: string; dist?: number; }
interface ListItem { product: Product; qty: number; }
interface StoreResult { storeId: number; storeName: string; chainName: string; subchainName?: string; city: string; total: number; availableCount: number; missingCount: number; dist?: number; breakdown: { productId: number; price: number; qty: number; subtotal: number }[]; }

const CHAINS: Record<string, { he: string; color: string; logo: string }> = {
  'Shufersal':    { he: 'שופרסל',        color: '#e11d48', logo: '/logos/shufersal.png' },
  'Rami Levy':    { he: 'רמי לוי',       color: '#2563eb', logo: '/logos/rami-levy.png' },
  'Victory':      { he: 'ויקטורי',       color: '#f59e0b', logo: '/logos/victory.png' },
  'Mega':         { he: 'מגה',           color: '#16a34a', logo: '/logos/mega.png' },
  'Osher Ad':     { he: 'אושר עד',       color: '#8b5cf6', logo: '/logos/osher-ad.png' },
  'Tiv Taam':     { he: 'טיב טעם',       color: '#ec4899', logo: '/logos/tiv-taam.png' },
  'Yochananof':   { he: 'יוחננוף',       color: '#0891b2', logo: '/logos/yochananof.png' },
  'Hazi Hinam':   { he: 'חצי חינם',      color: '#ea580c', logo: '/logos/hazi-hinam.png' },
  'Keshet Taamim':{ he: 'קשת טעמים',     color: '#059669', logo: '/logos/keshet-taamim.png' },
  'Freshmarket':  { he: 'פרשמרקט',       color: '#6366f1', logo: '/logos/freshmarket.png' },
  'Yayno Bitan':  { he: 'יינות ביתן',    color: '#dc2626', logo: '/logos/yayno-bitan.png' },
  'Dor Alon':     { he: 'דור אלון',      color: '#0d9488', logo: '/logos/alunit.png' },
  'AM-PM':         { he: 'AM-PM',         color: '#e67e00', logo: '/logos/ampm.png' },
  'אלונית':        { he: 'אלונית',        color: '#0d9488', logo: '/logos/alunit.png' },
  'דוכן':          { he: 'דוכן',          color: '#5b6b7c', logo: '/logos/dohan.png' },
  'Bareket':      { he: 'סופר ברקת',     color: '#a855f7', logo: '/logos/bareket.png' },
  'Yellow':       { he: 'ילו (כרפור)',   color: '#eab308', logo: '/logos/yellow.png' },
  'King Store':   { he: 'קינג סטור',     color: '#3b82f6', logo: '/logos/king-store.png' },
  'Mahsani Ashuk':{ he: 'מחסני השוק',    color: '#f97316', logo: '/logos/mahsani-ashuk.png' },
  'Zol Vebegadol':{ he: 'זול ובגדול',    color: '#22c55e', logo: '/logos/zol-vebegadol.png' },
  'Polizer':      { he: 'פוליצר',        color: '#14b8a6', logo: '/logos/polizer.png' },
  'City Market':  { he: 'סיטי מרקט',     color: '#6b7280', logo: '/logos/city-market.png' },
  'Good Pharm':   { he: 'גוד פארם',      color: '#10b981', logo: '/logos/Good-Pharm.png' },
  'Het Cohen':    { he: 'חט כהן',        color: '#7c3aed', logo: '/logos/Het-Cohen.png' },
  'Maayan 2000':  { he: 'מעיין 2000',    color: '#0ea5e9', logo: '/logos/maian2000.png' },
  'Meshmat Yosef':{ he: 'משמת יוסף',     color: '#d97706', logo: '' },
  'Netiv Hased':  { he: 'נתיב החסד',     color: '#be185d', logo: '/logos/Netiv-Hased.png' },
  'Salach Dabach':{ he: 'סאלח דבאח',     color: '#b45309', logo: '/logos/salach-dabach.png' },
  'Shefa Barcart Ashem': { he: 'שפע ברכת השם', color: '#7c3aed', logo: '/logos/Shefa-Barcart-Ashem.png' },
  'Shuk Ahir':     { he: 'שוק העיר',       color: '#dc2626', logo: '/logos/shuk-haeir.png' },
  'Stop Market':  { he: 'סטופ מרקט',     color: '#dc2626', logo: '/logos/stopmarket.png' },
  'Super Sapir':   { he: 'סופר ספיר',     color: '#f59e0b', logo: '/logos/Super-Sapir.png' },
  'Super Yuda':   { he: 'סופר יודה',     color: '#15803d', logo: '/logos/super-yuda.png' },
  'Wolt':         { he: 'וולט',          color: '#00c2e8', logo: '/logos/wolt.png' },
  'Super Dosh':   { he: 'סופר דוש',      color: '#7e22ce', logo: '' },
  'Carrefour':    { he: 'קרפור',         color: '#004e9f', logo: '/logos/Carrefour.png' },
};
const SUBCHAINS: Record<string, { he: string; logo: string }> = {
  'שופרסל שלי':    { he: 'שופרסל שלי',    logo: '/logos/subchains/shufersal-sheli.png' },
  'שופרסל דיל':    { he: 'שופרסל דיל',    logo: '/logos/subchains/shufersal-deal.png' },
  'שופרסל אקספרס': { he: 'שופרסל אקספרס', logo: '/logos/subchains/shufersal-express.png' },
  'Be':            { he: 'BE',             logo: '/logos/subchains/be.png' },
  'יש חסד':        { he: 'יש חסד',         logo: '/logos/subchains/yesh-hesed.png' },
  'יוניברס':       { he: 'יוניברס',        logo: '/logos/subchains/universe.png' },
  'יש בשכונה':     { he: 'יש בשכונה',      logo: '/logos/subchains/yesh-bashchuna.png' },
  'יש Good':       { he: 'יש Good',        logo: '/logos/subchains/yesh-good.png' },
  'שערי רווחה':    { he: 'שערי רווחה',     logo: '/logos/subchains/shaarei-revaha.png' },
  'Cash&Carry':    { he: 'Cash & Carry',   logo: '/logos/subchains/cash-carry.png' },
  'AM-PM':         { he: 'AM-PM',           logo: '/logos/ampm.png' },
  'אלונית':        { he: 'אלונית',          logo: '/logos/alunit.png' },
  'דוכן':          { he: 'דוכן',            logo: '/logos/dohan.png' },
};
const chainHe = (n: string) => CHAINS[n]?.he || n;

const chainUrl = (chainName: string): string | null => {
  const n = (chainName || '').toLowerCase();
  if (n.includes('shufersal')) return 'https://www.shufersal.co.il';
  if (n.includes('rami')) return 'https://www.rami-levy.co.il';
  if (n.includes('victory')) return 'https://www.victoryonline.co.il';
  if (n.includes('yochananof')) return 'https://www.yochananof.co.il';
  if (n.includes('tiv')) return 'https://www.tivtaam.co.il';
  if (n.includes('keshet')) return 'https://www.keshet-teamim.co.il';
  if (n.includes('hazi') || n.includes('half')) return 'https://www.half-price.co.il';
  if (n.includes('mahsani')) return 'https://www.mahsaniashuk.co.il';
  if (n.includes('osher')) return 'https://www.osherad.co.il';
  if (n.includes('mega')) return 'https://www.mega.co.il';
  return null;
};

const chainClr = (n: string) => CHAINS[n]?.color || '#6b7280';
const chainLogo = (n: string) => CHAINS[n]?.logo || '';
const subchainLogo = (sub?: string) => sub ? (SUBCHAINS[sub]?.logo || '') : '';
const subchainHe = (sub?: string) => sub ? (SUBCHAINS[sub]?.he || sub) : '';

/* ---- Logo component with fallback initial ---- */
function CLogo({ name, subchain, size = 40 }: { name: string; subchain?: string; size?: number }) {
  const sLogo = subchainLogo(subchain);
  const logo = sLogo || chainLogo(name);
  const color = chainClr(name);
  const he = subchain ? subchainHe(subchain) : chainHe(name);
  const [err, setErr] = useState(false);
  if (logo && !err) return <div style={{ width: size, height: size, borderRadius: size > 40 ? 16 : 10, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src={logo} alt={he} width={size} height={size} onError={() => setErr(true)} className="object-contain p-1" style={{ width: size, height: size }} /></div>;
  return <span className="flex items-center justify-center text-white font-black" style={{ backgroundColor: color, width: size, height: size, borderRadius: size > 40 ? 16 : 10, fontSize: size * 0.42 }}>{he.charAt(0)}</span>;
}

/* ---- Product image with lightbox ---- */
function ProductImg({ barcode, name, size = 48, imageUrl, clickable = true }: { barcode: string; name: string; size?: number; imageUrl?: string | null; clickable?: boolean }) {
  const [err, setErr] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const url = imageUrl && !err ? imageUrl : '';

  if (!url) return (
    <div className="rounded-xl bg-stone-100 flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <span className="text-stone-300" style={{ fontSize: size * 0.45 }}>📦</span>
    </div>
  );
  return (
    <>
      <div
        onClick={clickable ? (e) => { e.stopPropagation(); setShowModal(true); } : undefined}
        className={"rounded-xl bg-stone-50 shrink-0 overflow-hidden flex items-center justify-center " + (clickable ? "cursor-zoom-in hover:ring-2 hover:ring-emerald-400/50 transition-all" : "")}
        style={{ width: size, height: size }}
      >
        <img src={url} alt={name} onError={() => setErr(true)} className="max-w-full max-h-full object-contain" />
      </div>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="relative max-w-[90vw] max-h-[85vh] animate-scaleIn" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-500 hover:text-stone-800 text-lg font-bold z-10 transition">✕</button>
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center gap-3">
              <img src={url} alt={name} className="max-w-[80vw] max-h-[65vh] object-contain rounded-xl" />
              <div className="text-center">
                <div className="font-bold text-stone-800 text-sm">{name}</div>
                {barcode && <div className="text-[11px] text-stone-400 mt-0.5">ברקוד: {barcode}</div>}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
            .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
          `}</style>
        </div>
      )}
    </>
  );
}

/* ---- Distance helper ---- */
function distToKm(dist: number): number {
  // dist is (dlat^2 + dlng^2), approximate km using 111km per degree
  return Math.sqrt(dist) * 111;
}

/* ---- Logo scroll strip ---- */
const LOGO_LIST = Object.entries(CHAINS).filter(([k, v]) => v.logo && k !== 'Mega' && k !== 'Yellow').map(([k, v]) => ({ key: k, ...v }));
function LogoMarquee() {
  return (
    <div className="w-full overflow-x-auto py-4 -mt-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-3 sm:gap-4 px-4 w-max mx-auto">
        {LOGO_LIST.map((c) => (
          <div key={c.key} className="shrink-0 flex flex-col items-center gap-1.5 group cursor-default">
            <div className="rounded-xl sm:rounded-2xl bg-white shadow-md border border-stone-100 p-2 sm:p-2.5 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <img src={c.logo} alt={c.he} className="object-contain w-20 h-20 sm:w-24 sm:h-24" />
            </div>
            <span className="text-[10px] sm:text-xs text-stone-400 group-hover:text-stone-600 font-semibold transition-colors">{c.he}</span>
          </div>
        ))}
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>


    </div>
  );
}

const CATS = [
  { emoji: '🥛', label: 'חלב', q: 'חלב' }, { emoji: '🍞', label: 'לחם', q: 'לחם' },
  { emoji: '🥩', label: 'בשר', q: 'עוף' }, { emoji: '🥬', label: 'ירקות', q: 'עגבניה' },
  { emoji: '🥫', label: 'שימורים', q: 'טונה' }, { emoji: '🧃', label: 'משקאות', q: 'מים מינרליים' },
  { emoji: '🍫', label: 'חטיפים', q: 'במבה' }, { emoji: '☕', label: 'קפה', q: 'קפה' },
  { emoji: '🧹', label: 'ניקיון', q: 'אקונומיקה' }, { emoji: '🧴', label: 'טיפוח', q: 'שמפו' },
  { emoji: '👶', label: 'תינוקות', q: 'חיתול' }, { emoji: '🐕', label: 'חיות', q: 'מזון כלבים' },
];



export default function Home() {
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  async function scanBarcode(file: File) {
    setBarcodeScanning(true);
    try {
      const url = URL.createObjectURL(file);
      try {
        const Quagga = (await import('quagga')).default;
        await new Promise<void>((resolve, reject) => {
          Quagga.decodeSingle({
            decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader'] },
            locate: true,
            src: url,
          }, (result: any) => {
            if (result?.codeResult?.code) {
              resolve();
              const barcode = result.codeResult.code;
              URL.revokeObjectURL(url);
              fetch(`${API}/api/search?q=${barcode}&limit=1`)
                .then(r => r.json())
                .then(searchData => {
                  const product = searchData.results?.[0];
                  if (product) {
                    addToList(product);
                  } else {
                    alert('המוצר לא נמצא במאגר (ברקוד: ' + barcode + ')');
                  }
                  setBarcodeScanning(false);
                });
            } else {
              reject(new Error('no barcode'));
            }
          });
        });
      } catch {
        URL.revokeObjectURL(url);
        alert('לא זוהה ברקוד — נסה לצלם מקרוב, ברקוד ישר ותאורה טובה');
        setBarcodeScanning(false);
      }
      return;
    } catch {
      setBarcodeScanning(false);
      alert('שגיאה בסריקה');
    }
  }

  const [tab, setTab] = useState<'search' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'list') return 'list';
    }
    return 'search';
  });
  const [q, setQ] = useState(""); const [results, setResults] = useState<Product[]>([]); const [sel, setSel] = useState<Product | null>(null);
  const [prices, setPrices] = useState<Price[]>([]); const [loading, setLoading] = useState(false); const [pLoading, setPLoading] = useState(false);
  const [showCats, setShowCats] = useState(false); const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'stores' | 'name'>('stores'); const db = useRef<any>(null);
  const { user, syncCartToCloud, loadCartFromCloud } = useAuth();
  const [list, setList] = useState<ListItem[]>([]); const [listResults, setListResults] = useState<StoreResult[]>([]);

  // Load list from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savy-list');
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length > 0) setList(parsed); }
    } catch {}
    // Warm up API + DB connection
    api.search('x').catch(() => {});
  }, []);
  // Sync cart with cloud after auth
  const cloudSynced = useRef(false);
  useEffect(() => {
    if (!user || cloudSynced.current) return;
    cloudSynced.current = true;
    loadCartFromCloud().then(cloudItems => {
      if (cloudItems && cloudItems.length > 0) {
        setList(cloudItems);
        localStorage.setItem('savy-list', JSON.stringify(cloudItems));
      } else if (list.length > 0) {
        syncCartToCloud(list);
      }
    });
  }, []);

  // Save list to localStorage on change
  const listLoaded = useRef(false);
  useEffect(() => {
    if (!listLoaded.current) { listLoaded.current = true; return; }
    try { localStorage.setItem('savy-list', JSON.stringify(list)); } catch {}
    if (user) syncCartToCloud(list);
  }, [list]);
  const [selImage, setSelImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<number, string>>({});
  // Load productImages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savy-images');
      if (saved) setProductImages(JSON.parse(saved));
    } catch {}
  }, []);
  // Save productImages to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('savy-images', JSON.stringify(productImages)); } catch {}
  }, [productImages]);
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(() => {
    try {
      const saved = localStorage.getItem('savy-loc');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [promoModal, setPromoModal] = useState<any>(null);
  const [locStatus, setLocStatus] = useState<'idle'|'loading'|'granted'|'denied'>('idle');
  const [locMode, setLocMode] = useState<'nearby'|'cheapest'|'bychain'>('nearby');
  const [chainResults, setChainResults] = useState<any[]>([]);
  const [chainLoading, setChainLoading] = useState(false);
  const [radius, setRadius] = useState<number>(10);
  const [toast, setToast] = useState(""); const [sharing, setSharing] = useState(false); const [listLoading, setListLoading] = useState(false); const [expandedStore, setExpandedStore] = useState<number | null>(null);

  // Re-fetch prices when mode changes
  useEffect(() => {
    if (sel) pick(sel);
  }, [locMode]);

  // Request geolocation on mount - silently, don't auto-switch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserLoc(loc); setLocStatus('granted'); try { localStorage.setItem('savy-loc', JSON.stringify(loc)); } catch {} },
        () => { setLocStatus('idle'); },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    }
  }, []);

  // ✅ FIXED: AbortError is ignored — only the last search request wins
  const search = useCallback((v: string) => {
    if (!v.trim()) { setResults([]); return; }
    setLoading(true);
    setSortBy('stores');
    api.search(v)
      .then((d: any) => setResults(d.results || []))
      .catch((err: any) => {
        // Ignore abort errors — they're intentional (new search started)
        if (err?.name !== 'AbortError') {
          setResults([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const onInput = (v: string) => { setQ(v); clearTimeout(db.current); db.current = setTimeout(() => search(v), 300); };
  const pick = (p: Product) => {
    setSel(p); setPLoading(true); setChainFilter(null);
    setSelImage(productImages[p.id] || p.imageUrl || null);
    const useLoc = locMode === 'nearby' && userLoc;
    api.prices(p.id, useLoc ? userLoc.lat : undefined, useLoc ? userLoc.lng : undefined).then((d: any) => {
      // Fallback: if no results with location, retry without
      if ((!d.prices || d.prices.length === 0) && useLoc) {
        api.prices(p.id).then((d2: any) => {
          setPrices(d2.prices || []);
          if (d2.imageUrl) { setSelImage(d2.imageUrl); setProductImages(prev => ({ ...prev, [p.id]: d2.imageUrl })); }
        }).catch(() => {});
      } else {
        setPrices(d.prices || []);
        if (d.imageUrl) { setSelImage(d.imageUrl); setProductImages(prev => ({ ...prev, [p.id]: d.imageUrl })); }
        else if (!p.imageUrl) {
          api.image(p.id).then((img: any) => {
            if (img.imageUrl) { setSelImage(img.imageUrl); setProductImages(prev => ({ ...prev, [p.id]: img.imageUrl })); }
          }).catch(() => {});
        }
      }
    }).catch(() => {}).finally(() => setPLoading(false));
  };
  const addToList = (p: Product) => { setList(prev => { const ex = prev.find(i => i.product.id === p.id); if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { product: p, qty: 1 }]; }); setToast(p.name); setTimeout(() => setToast(""), 2000); };
  const removeFromList = (id: number) => setList(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => { if (qty <= 0) { removeFromList(id); return; } setList(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i)); };

  const shareList = async () => {
    if (!list.length) return;
    setSharing(true);
    // פתח חלון מיד (לפני async) כדי לעבוד ב-iOS Safari
    const win = window.open('', '_blank');
    try {
      const API = process.env.NEXT_PUBLIC_API || 'https://supermarket-compare-production.up.railway.app';
      const res = await fetch(`${API}/api/shared-list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: list.map(i => ({ productId: i.product.id, name: i.product.name, barcode: i.product.barcode, brand: i.product.brand, qty: i.qty, minPrice: i.product.minPrice })) }) });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/list/${data.id}`;
        const cheapest = listResults[0];
        const chainHe = (name: string) => CHAINS[name]?.he || name;
        const cheapestText = cheapest ? `\n─────────────────────\n🏆 הכי זול: ₪${cheapest.total.toFixed(0)} ב${chainHe(cheapest.subchainName || cheapest.chainName)}` : '';
        const text = `🛒 *רשימת קניות - סאבי*\n─────────────────────\n${list.map(i => `☐ ${i.product.name}${i.qty > 1 ? ` (x${i.qty})` : ''}`).join('\n')}${cheapestText}\n─────────────────────\n👉 ${url}`;
        if (win) win.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
        else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } else { win?.close(); }
    } catch { win?.close(); setToast('שגיאה בשיתוף'); setTimeout(() => setToast(''), 2000); }
    setSharing(false);
  };

  useEffect(() => {
    if (locMode !== 'bychain') return;
    if (!list.length) { setChainResults([]); return; }
    setChainLoading(true);
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api') + '/list/by-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: list.map(i => ({ productId: i.product.id, qty: i.qty })) })
    }).then(r => r.json()).then(d => setChainResults(d.chains || [])).catch(() => {}).finally(() => setChainLoading(false));
  }, [list, locMode]);

  useEffect(() => { if (!list.length) { setListResults([]); return; } setListLoading(true); const useLoc = locMode === 'nearby' && userLoc; api.list(list.map(i => ({ productId: i.product.id, qty: i.qty })), useLoc ? userLoc.lat : undefined, useLoc ? userLoc.lng : undefined, locMode === 'nearby' ? radius : undefined).then((d: any) => setListResults(d.bestStoreCandidates || [])).catch(() => {}).finally(() => setListLoading(false)); }, [list, locMode, radius, userLoc]);

  const fp = prices.filter((p: Price) => {
    if (chainFilter && p.chainName !== chainFilter) return false;
    if (locMode === 'nearby' && p.dist !== undefined && p.dist !== null) {
      const km = distToKm(p.dist);
      if (km > radius) return false;
    }
    return true;
  }).sort((a, b) => a.price - b.price);
  const uChains = [...new Set(prices.map((p: Price) => p.chainName))].sort();
  const sorted = [...results].sort((a, b) => sortBy === 'price' ? (a.minPrice || 999) - (b.minPrice || 999) : sortBy === 'stores' ? (b.storeCount || 0) - (a.storeCount || 0) : a.name.localeCompare(b.name, 'he'));
  const cheap = fp.length ? Math.min(...fp.map(p => p.price)) : 0;
  const exp = fp.length ? Math.max(...fp.map(p => p.price)) : 0;

  return (
    <div className="pb-24">
      {/* Toast */}
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50"><div className="bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</span>{toast} נוסף לרשימה</div></div>}

      {/* Hamburger Menu Button */}
      {/* Hero */}
      <section className="relative overflow-hidden pt-6 pb-4 px-4">
        {/* רקע דקורטיבי */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-100/60 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-20 w-48 h-48 bg-teal-100/40 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-lg mx-auto">
          {/* לוגו */}
          <div className="flex justify-center mb-3">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-20 sm:h-24 object-contain drop-shadow-sm" />
          </div>

          {/* כותרת */}
          <h1 className="font-black text-3xl sm:text-4xl tracking-tight text-stone-800 leading-tight mb-2">
            כמה אתם <span className="relative inline-block">
              <span className="bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent">באמת</span>
              <svg className="absolute -bottom-1 right-0 left-0 w-full" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
                <path d="M0,3 Q50,0 100,3" stroke="url(#g)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#059669"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
              </svg>
            </span> משלמים?
          </h1>
          <p className="text-stone-400 text-sm mt-1">25+ רשתות · 7.5 מיליון מחירים · מתעדכן יומיומית</p>

          {/* סטטיסטיקות */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="bg-white/80 backdrop-blur-sm border border-stone-100 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="font-black text-lg text-emerald-600 leading-none">25+</div>
              <div className="text-[10px] text-stone-400 mt-0.5">רשתות</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-stone-100 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="font-black text-lg text-emerald-600 leading-none">7.5M</div>
              <div className="text-[10px] text-stone-400 mt-0.5">מחירים</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-stone-100 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="font-black text-lg text-emerald-600 leading-none">חינם</div>
              <div className="text-[10px] text-stone-400 mt-0.5">לגמרי</div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Tabs */}
      <div className="flex justify-center px-4 mb-5 mt-2">
        <div className="flex bg-stone-100 rounded-2xl p-1 gap-1 w-full max-w-sm">
          <button onClick={() => setTab('search')}
            className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 " +
              (tab === 'search' ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            חיפוש מוצר
          </button>
          <button onClick={() => setTab('list')}
            className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative " +
              (tab === 'list' ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21M16 10C16 11.1 15.6 12.2 14.8 13C14.1 13.8 13 14 12 14C11 14 9.9 13.8 9.2 13C8.4 12.2 8 11.1 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            רשימת קניות
            {list.length > 0 && <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow">{list.length}</span>}
          </button>
        </div>
      </div>

      {/* ==================== SEARCH TAB ==================== */}
      {tab === 'search' && (<div>
        <HotDealsSlider userLat={userLoc?.lat} userLng={userLoc?.lng} onAddToList={(deal) => { try { const saved = localStorage.getItem("savy-list"); const list = saved ? JSON.parse(saved) : []; if (!list.find((i: any) => i.product?.id === deal.productId)) { list.push({ product: { id: deal.productId, name: deal.productName, barcode: deal.barcode }, qty: deal.minQty || 1 }); localStorage.setItem("savy-list", JSON.stringify(list)); } } catch {} }} />
        <div className="max-w-2xl mx-auto px-4">
          <div className="relative">
    <input value={q} onChange={e => onInput(e.target.value)} placeholder="חלב, במבה, שמפו, או ברקוד..." className="w-full px-4 sm:px-5 py-4 sm:py-5 pr-12 pl-12 rounded-xl bg-white border border-stone-200 shadow-sm text-lg sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-stone-300" />
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-2xl sm:text-xl">🔍</span>
    <input ref={barcodeInputRef} type="file" accept="image/*" capture="environment" className="hidden"
      onChange={e => { const f = e.target.files?.[0]; if (f) scanBarcode(f); e.target.value = ''; }} />
    <button onClick={() => barcodeInputRef.current?.click()} disabled={barcodeScanning}
      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition disabled:opacity-50 shadow-sm"
      title="סרוק ברקוד">
      {barcodeScanning ? (
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
          <rect x="3" y="16" width="5" height="5"/>
          <line x1="16" y1="16" x2="21" y2="16"/><line x1="21" y1="16" x2="21" y2="21"/>
          <line x1="16" y1="21" x2="21" y2="21"/><line x1="16" y1="16" x2="16" y2="18"/>
          <line x1="9" y1="3" x2="9" y2="9"/><line x1="3" y1="9" x2="9" y2="9"/>
          <line x1="9" y1="16" x2="9" y2="21"/>
        </svg>
      )}
    </button>
  </div>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => setLocMode('cheapest')} className={"flex-1 max-w-[180px] px-4 py-3 rounded-xl text-sm font-bold transition-all " + (locMode === 'cheapest' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-white border border-stone-200 text-stone-400 hover:border-stone-300")}>💰 הכי זול בארץ</button>
            <button onClick={() => { if (userLoc) { setLocStatus('granted'); setLocMode('nearby'); } else { setLocStatus('loading'); setLocMode('nearby'); navigator.geolocation?.getCurrentPosition((pos) => { setUserLoc({lat: pos.coords.latitude, lng: pos.coords.longitude}); setLocStatus('granted'); }, () => { setLocStatus('denied'); setLocMode('cheapest'); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }); } }} className={"flex-1 max-w-[180px] px-4 py-3 rounded-xl text-sm font-bold transition-all " + (locMode === 'nearby' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : locStatus === 'loading' ? "bg-amber-50 border border-amber-300 text-amber-600 animate-pulse" : "bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 shadow-sm")}>
              {locStatus === 'loading' ? '📍 מאתר...' : '📍 הכי זול ליד'}
            </button>
            <button onClick={() => setLocMode('bychain')} className={"flex-1 max-w-[180px] px-4 py-3 rounded-xl text-sm font-bold transition-all " + (locMode === 'bychain' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-white border border-stone-200 text-stone-400 hover:border-stone-300")}>🏪 לפי רשת</button>
          </div>
          {locMode === 'bychain' && list.length > 0 && (
            <div className="mt-4 space-y-2">
              {chainLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-stone-200 border-t-emerald-600 rounded-full animate-spin" /></div>
              ) : chainResults.length === 0 ? (
                <div className="text-center text-stone-400 text-sm py-6">לא נמצאו תוצאות</div>
              ) : chainResults.map((c: any, i: number) => (
                <div key={c.chainName} className={"bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 " + (i === 0 ? "border-emerald-300 bg-emerald-50/40" : "border-stone-100")}>
                  <div className="shrink-0">{(() => { const logo = CHAINS[c.chainName]?.logo; return logo ? <img src={logo} alt={c.chainName} className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display='none')} /> : <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: CHAINS[c.chainName]?.color || '#6b7280'}}>{(CHAINS[c.chainName]?.he || c.chainName).charAt(0)}</span>; })()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm">{CHAINS[c.chainName]?.he || c.chainName}</div>
                    <div className="text-xs text-stone-400">{c.storeName} · {c.city}</div>
                    {c.missingCount > 0 && <div className="text-xs text-red-400">חסרים {c.missingCount} מוצרים</div>}
                  </div>
                  <div className="shrink-0 text-left">
                    <div className={"font-mono font-black text-xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{c.total.toFixed(2)}</div>
                    {i === 0 && chainResults[1] && <div className="text-xs text-emerald-600">חיסכון ₪{(chainResults[1].total - c.total).toFixed(2)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {locMode !== 'bychain' && locMode === 'nearby' && (
            <div className="mt-3 mx-auto max-w-sm">
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-400">📍 רדיוס חיפוש</span>
                  <span className="font-mono font-black text-lg text-emerald-600">{radius} <span className="text-xs font-semibold text-stone-400">ק״מ</span></span>
                </div>
                <div className="relative">
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 mr-auto" style={{ width: `${(([1,3,5,10,15,20,30,50].indexOf(radius) + 1) / 8) * 100}%`, marginRight: 0, marginLeft: 'auto' }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={7}
                    value={[1,3,5,10,15,20,30,50].indexOf(radius)}
                    onChange={e => setRadius([1,3,5,10,15,20,30,50][7 - parseInt(e.target.value)])} dir="ltr"
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    style={{ height: '36px', top: '-14px' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full shadow-md transition-all duration-300 pointer-events-none"
                    style={{ right: `calc(${([1,3,5,10,15,20,30,50].indexOf(radius) / 7) * 100}% - 10px)`, left: 'auto' }}
                  />
                </div>
                <div className="flex justify-between mt-2 px-0.5">
                  {[1,3,5,10,15,20,30,50].map((v, i) => (
                    <button key={v} onClick={() => setRadius(v)} className={"text-[10px] font-bold transition-colors " + (radius === v ? "text-emerald-600" : "text-stone-300 hover:text-stone-400")}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <button onClick={() => setShowCats(p => !p)} className={"px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-xs font-bold transition border " + (showCats ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300")}>📂 קטגוריות</button>
            {[{e:'🥛',l:'חלב',q:'חלב'},{e:'🍞',l:'לחם',q:'לחם'},{e:'🥚',l:'ביצים',q:'ביצים'},{e:'🍫',l:'במבה',q:'במבה'},{e:'☕',l:'קפה',q:'קפה'},{e:'🧴',l:'שמפו',q:'שמפו'}].map(qs => (
              <button key={qs.q} onClick={() => { setQ(qs.q); search(qs.q); setSortBy('stores'); }} className="px-4 py-2.5 sm:py-2 rounded-lg bg-white border border-stone-200 text-sm sm:text-xs hover:border-emerald-400 hover:bg-emerald-50 transition">{qs.e} {qs.l}</button>
            ))}
          </div>
          {showCats && <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">{CATS.map(c => (<button key={c.label} onClick={() => { setQ(c.q); search(c.q); setShowCats(false); setSortBy('stores'); }} className="flex flex-col items-center gap-1.5 p-3.5 sm:p-3 rounded-xl bg-white border border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition"><span className="text-2xl">{c.emoji}</span><span className="text-xs sm:text-[11px] font-semibold text-stone-500">{c.label}</span></button>))}</div>}
        </div>

        {results.length > 0 && <div className="max-w-2xl mx-auto mt-4 flex items-center gap-2 px-4">
          <span className="text-stone-300 text-sm sm:text-xs">מיון:</span>
          {([['price','מחיר'],['stores','חנויות'],['name','א-ב']] as const).map(([k,l]) => (<button key={k} onClick={() => setSortBy(k)} className={"px-4 sm:px-3 py-2 sm:py-1.5 rounded-lg text-sm sm:text-xs font-semibold transition " + (sortBy === k ? "bg-stone-900 text-white" : "bg-white text-stone-400 border border-stone-200")}>{l}</button>))}
          <span className="text-stone-300 text-sm sm:text-xs mr-auto">{results.length} תוצאות</span>
        </div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 px-4">
          {/* Results */}
          <div className="space-y-2">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex flex-col items-center gap-3">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src="/icons/savy-logo.png" alt="" className="w-8 h-8 object-contain" />
                    </div>
                  </div>
                  <p className="text-sm text-stone-400 font-medium animate-pulse">מחפש את המחיר הטוב ביותר...</p>
                </div>
              </div>
            )}
            {sorted.map((p: Product) => (
              <div key={p.id} className={"group rounded-xl transition-all bg-white border " + (sel?.id === p.id ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20" : "border-stone-100 hover:border-stone-200 hover:shadow-sm")}>
                <button onClick={() => pick(p)} className="w-full text-right p-4 sm:p-3.5">
                  <div className="flex items-center gap-3">
                    <ProductImg barcode={p.barcode} name={p.name} size={60} imageUrl={productImages[p.id] || p.imageUrl} />
                    <div className="flex-1"><div className="font-bold text-stone-800 text-base sm:text-sm leading-snug">{p.name}</div><div className="text-sm sm:text-xs text-stone-400 mt-0.5">{p.brand}{p.unitQty && p.unitQty !== '0' ? ` · ${p.unitQty} ${p.unitMeasure}` : ''}</div></div>
                    <div className="text-left shrink-0 flex items-center gap-2 sm:gap-3">
                      <div>{p.minPrice && <div className="font-mono font-black text-xl sm:text-lg text-emerald-600 leading-none">₪{Number(p.minPrice).toFixed(2)}</div>}{p.storeCount > 0 && <div className="text-xs sm:text-[11px] text-stone-300 mt-0.5">{p.storeCount} חנויות</div>}</div>
                      <span className="text-stone-200 group-hover:text-stone-400 transition text-lg">‹</span>
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-3 -mt-1"><button onClick={() => addToList(p)} className="text-sm sm:text-xs px-5 sm:px-4 py-2 sm:py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition">+ לרשימה</button></div>
              </div>
            ))}
            {!loading && !q.trim() && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#059669" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-stone-400 text-sm font-medium">חפשו מוצר לפי שם או ברקוד</p>
                <p className="text-stone-300 text-xs mt-1">למשל: חלב, במבה, שמפו...</p>
              </div>
            )}
            {!loading && q.trim() && !results.length && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#d1d5db" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 11H14" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-stone-400 text-sm font-medium">לא מצאנו תוצאות עבור "{q}"</p>
                <p className="text-stone-300 text-xs mt-1">נסו לחפש בשם אחר או ברקוד</p>
              </div>
            )}
          </div>

          {/* Price panel - desktop: side panel, mobile: bottom sheet */}
          <div className="hidden lg:block">{sel ? (<div className="rounded-xl bg-white border border-stone-100 shadow-sm overflow-hidden sticky top-16">
            <div className="p-5 border-b border-stone-100">
              <div className="flex items-start gap-4">
                <ProductImg barcode={sel.barcode} name={sel.name} size={72} imageUrl={selImage} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-xl text-stone-800 leading-snug">{sel.name}</div>
                  <div className="text-sm text-stone-400 mt-1">{sel.brand}{sel.barcode && ` · ${sel.barcode}`}</div>
                  {fp.length > 0 && <div className="mt-2 flex items-baseline gap-2"><span className="font-mono font-black text-3xl text-emerald-600">₪{cheap.toFixed(2)}</span>{exp > cheap && <span className="text-sm text-stone-400">— ₪{exp.toFixed(2)} ({((exp - cheap) / cheap * 100).toFixed(0)}% הפרש)</span>}</div>}
                </div>
              </div>
            </div>
            {uChains.length > 1 && <div className="px-4 py-3 bg-stone-50/80 border-b flex flex-wrap gap-1.5">
              <button onClick={() => setChainFilter(null)} className={"px-3 py-1 rounded text-xs font-semibold transition " + (!chainFilter ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600")}>הכל</button>
              {uChains.map((ch: string) => (<button key={ch} onClick={() => setChainFilter(chainFilter === ch ? null : ch)} className={"px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 " + (chainFilter === ch ? "text-white" : "text-stone-400 hover:text-stone-600")} style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}>
                <CLogo name={ch} size={18} />{chainHe(ch)}
              </button>))}
            </div>}
            <div className="max-h-[52vh] overflow-y-auto divide-y divide-stone-50">
              {pLoading ? <div className="p-10 text-center">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src="/icons/savy-logo.png" alt="" className="w-7 h-7 object-contain" />
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 mt-3 animate-pulse">משווה מחירים...</p>
                </div> :
              !fp.length ? <div className="p-10 text-center text-stone-300 text-sm">אין מחירים</div> :
              fp.map((p: Price, i: number) => (
                <div key={i} className={"flex items-center justify-between px-5 py-4 transition hover:bg-stone-50 " + (i === 0 ? "bg-emerald-50/40" : "")}>
                  <div className="flex items-center gap-3">
                    <CLogo name={p.chainName} subchain={p.subchainName} size={80} />
                    <div>
                      <div className="font-bold text-base text-stone-700">{p.subchainName ? subchainHe(p.subchainName) : chainHe(p.chainName)}</div>
                      <div className="text-sm text-stone-400">
                        {p.storeName}{p.city && p.city !== '0' && !p.city.match(/^\d+$/) && ` · ${p.city}`}
                        {p.dist !== undefined && p.dist !== null && <span className="text-blue-400 mr-1"> · {distToKm(p.dist).toFixed(1)} ק״מ</span>}
                        {cheap > 0 && p.price > cheap && <span className="text-red-400 mr-1"> +{((p.price - cheap) / cheap * 100).toFixed(0)}%</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5"><div className={"font-mono font-black text-xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{Number(p.price).toFixed(2)}</div>{p.isPromo && <button onClick={(e) => { e.stopPropagation(); fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals?chain=${encodeURIComponent(p.chainName)}&limit=5`).then(r=>r.json()).then(data=>{ const deal = data.deals?.[0]; if(deal) setPromoModal(deal); else alert('לא נמצאו מבצעים לרשת זו'); }); }} className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none hover:bg-red-600 transition-colors cursor-pointer">🔥 מבצע</button>}</div>
                </div>
              ))}
            </div>
          </div>) : <div className="text-center py-24"><div className="text-3xl mb-2 opacity-20">📊</div><div className="text-stone-300 text-sm">בחרו מוצר</div></div>}</div>
        </div>

        {/* Mobile bottom sheet for price panel */}
        {promoModal && <DealModal deal={promoModal} onClose={() => setPromoModal(null)} onAddToList={() => {}} />}
      {sel && <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSel(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-stone-300" /></div>
            <div className="p-4 border-b border-stone-100">
              <div className="flex items-start gap-3">
                <ProductImg barcode={sel.barcode} name={sel.name} size={56} imageUrl={selImage} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-base text-stone-800 leading-snug">{sel.name}</div>
                  <div className="text-xs text-stone-400 mt-1">{sel.brand}</div>
                  {fp.length > 0 && <div className="mt-1.5 flex items-baseline gap-2"><span className="font-mono font-black text-2xl text-emerald-600">₪{cheap.toFixed(2)}</span>{exp > cheap && <span className="text-xs text-stone-400">— ₪{exp.toFixed(2)}</span>}</div>}
                </div>
                <button onClick={() => setSel(null)} className="text-stone-400 text-xl p-1">✕</button>
              </div>
            </div>
            {uChains.length > 1 && <div className="px-4 py-2 bg-stone-50/80 border-b flex flex-wrap gap-1.5">
              <button onClick={() => setChainFilter(null)} className={"px-2.5 py-1 rounded text-xs font-semibold transition " + (!chainFilter ? "bg-stone-900 text-white" : "text-stone-400")}>הכל</button>
              {uChains.map((ch: string) => (<button key={ch} onClick={() => setChainFilter(chainFilter === ch ? null : ch)} className={"px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 " + (chainFilter === ch ? "text-white" : "text-stone-400")} style={chainFilter === ch ? { backgroundColor: chainClr(ch) } : {}}>
                <CLogo name={ch} size={16} />{chainHe(ch)}
              </button>))}
            </div>}
            <div className="overflow-y-auto divide-y divide-stone-50" style={{ maxHeight: 'calc(85vh - 200px)' }}>
              {pLoading ? <div className="p-10 text-center">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src="/icons/savy-logo.png" alt="" className="w-7 h-7 object-contain" />
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 mt-3 animate-pulse">משווה מחירים...</p>
                </div> :
              !fp.length ? <div className="p-10 text-center text-stone-300 text-sm">אין מחירים</div> :
              fp.map((p: Price, i: number) => (
                <div key={i} className={"flex items-center justify-between px-4 py-3.5 " + (i === 0 ? "bg-emerald-50/40" : "")}>
                  <div className="flex items-center gap-3">
                    <CLogo name={p.chainName} subchain={p.subchainName} size={76} />
                    <div>
                      <div className="font-bold text-sm text-stone-700">{p.subchainName ? subchainHe(p.subchainName) : chainHe(p.chainName)}</div>
                      <div className="text-xs text-stone-400">
                        {p.storeName}{p.city && p.city !== '0' && !p.city.match(/^\d+$/) && ` · ${p.city}`}
                        {p.dist !== undefined && p.dist !== null && <span className="text-blue-400 mr-1"> · {distToKm(p.dist).toFixed(1)} ק״מ</span>}
                        {cheap > 0 && p.price > cheap && <span className="text-red-400 mr-1"> +{((p.price - cheap) / cheap * 100).toFixed(0)}%</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1"><div className={"font-mono font-black text-lg " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{Number(p.price).toFixed(2)}</div>{p.isPromo && <button onClick={(e) => { e.stopPropagation(); fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals?chain=${encodeURIComponent(p.chainName)}&limit=5`).then(r=>r.json()).then(data=>{ const deal = data.deals?.[0]; if(deal) setPromoModal(deal); else alert('לא נמצאו מבצעים לרשת זו'); }); }} className="text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded-full leading-none hover:bg-red-600 cursor-pointer">🔥</button>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>}
      </div>)}

      {/* ==================== LIST TAB ==================== */}
      {tab === 'list' && (<div className="px-4">
        {!list.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-3xl mb-4">📋</div>
            <div className="text-lg font-bold text-stone-700">הרשימה ריקה</div>
            <div className="text-sm text-stone-400 mt-1">חפשו מוצרים והוסיפו לרשימה</div>
            <button onClick={() => setTab('search')} className="mt-5 px-6 py-3 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition shadow-lg">🔍 חיפוש מוצרים</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* My list - 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg text-stone-800">הרשימה שלי <span className="text-stone-300 font-medium text-sm">({list.length})</span></h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setList([]); setListResults([]); }} className="text-xs px-3 py-2 rounded-lg border border-stone-200 text-stone-400 font-semibold hover:text-red-500 hover:border-red-200 transition whitespace-nowrap">🗑 נקה</button>
                  <button onClick={() => setTab('search')} className="text-xs px-3 py-2 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-700 transition whitespace-nowrap">+ הוסף</button>
                  <button onClick={shareList} disabled={sharing} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1fb855] transition-all shadow-md shadow-green-200 disabled:opacity-50 whitespace-nowrap">
                    {sharing ? "שולח..." : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      <span>שתף בוואטסאפ</span>
                    </>}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {list.map(item => (
                  <div key={item.product.id} className="bg-white rounded-xl p-3.5 border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductImg barcode={item.product.barcode} name={item.product.name} size={44} imageUrl={productImages[item.product.id] || item.product.imageUrl} />
                      <div className="min-w-0"><div className="font-bold text-sm text-stone-800 leading-snug">{item.product.name}</div><div className="text-xs text-stone-400">{item.product.minPrice ? `מ-₪${Number(item.product.minPrice).toFixed(2)}` : ''}{item.product.brand && ` · ${item.product.brand}`}</div></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-base sm:text-sm hover:bg-stone-200 transition">−</button>
                      <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base sm:text-sm hover:bg-emerald-200 transition">+</button>
                      <button onClick={() => removeFromList(item.product.id)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition text-base sm:text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store comparison - 3 cols */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg text-stone-800">השוואת סלים</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setLocMode('cheapest')} className={"px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[10px] font-bold transition border " + (locMode === 'cheapest' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-400")}>💰 זול</button>
                  {locStatus === 'granted' ? (
                    <button onClick={() => setLocMode('nearby')} className={"px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[10px] font-bold transition border " + (locMode === 'nearby' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-400")}>📍 קרוב אליי</button>
                  ) : locStatus === 'loading' ? (
                    <button disabled className="px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-600 animate-pulse">📍 מאתר...</button>
                  ) : locStatus !== 'denied' ? (
                    <button onClick={() => {
                      setLocStatus('loading');
                      navigator.geolocation?.getCurrentPosition(
                        (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus('granted'); setLocMode('nearby'); },
                        () => { setLocStatus('denied'); },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                      );
                    }} className="px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[10px] font-bold transition border border-emerald-400 bg-white text-emerald-600 hover:bg-emerald-50">📍 קרוב אליי</button>
                  ) : null}
                  <button onClick={() => setLocMode('bychain')} className={"px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-[10px] font-bold transition border " + (locMode === 'bychain' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-400")}>🏪 לפי רשת</button>
                </div>
              </div>
              {locMode === 'nearby' && locStatus === 'granted' && (
                <div className="mb-3">
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-stone-400">📍 רדיוס חיפוש</span>
                      <span className="font-mono font-black text-lg text-emerald-600">{radius} <span className="text-xs font-semibold text-stone-400">ק״מ</span></span>
                    </div>
                    <div className="relative">
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 mr-auto" style={{ width: `${(([1,3,5,10,15,20,30,50].indexOf(radius) + 1) / 8) * 100}%`, marginRight: 0, marginLeft: 'auto' }} />
                      </div>
                      <input type="range" min={0} max={7} value={[1,3,5,10,15,20,30,50].indexOf(radius)} onChange={e => setRadius([1,3,5,10,15,20,30,50][7 - parseInt(e.target.value)])} dir="ltr" className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: '36px', top: '-14px' }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full shadow-md transition-all duration-300 pointer-events-none" style={{ right: `calc(${([1,3,5,10,15,20,30,50].indexOf(radius) / 7) * 100}% - 10px)`, left: 'auto' }} />
                    </div>
                    <div className="flex justify-between mt-2 px-0.5">
                      {[1,3,5,10,15,20,50].map(v => (
                        <button key={v} onClick={() => setRadius(v)} className={"text-[10px] font-bold transition-colors " + (radius === v ? "text-emerald-600" : "text-stone-300 hover:text-stone-400")}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {listLoading ? <div className="text-center py-16"><div className="inline-block w-7 h-7 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin"></div></div> :
              locMode === 'bychain' ? (
                chainLoading ? <div className="text-center py-16"><div className="inline-block w-7 h-7 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin"></div></div> :
                !chainResults.length ? <div className="text-center py-16 text-stone-300 text-sm">לא נמצאו תוצאות</div> :
                <div className="space-y-2">
                  {chainResults.map((c: any, i: number) => (
                    <div key={c.chainName} className={"bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 " + (i === 0 ? "border-emerald-300 bg-emerald-50/40" : "border-stone-100")}>
                      <div className="shrink-0">{(() => { const logo = CHAINS[c.chainName]?.logo; return logo ? <img src={logo} alt={c.chainName} className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display='none')} /> : <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: CHAINS[c.chainName]?.color || '#6b7280'}}>{(CHAINS[c.chainName]?.he || c.chainName).charAt(0)}</span>; })()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm">{CHAINS[c.chainName]?.he || c.chainName}</div>
                        <div className="text-xs text-stone-400">{c.storeName} · {c.city}</div>
                        {c.missingCount > 0 && <div className="text-xs text-red-400">חסרים {c.missingCount} מוצרים</div>}
                      </div>
                      <div className="shrink-0 text-left">
                        <div className={"font-mono font-black text-xl " + (i === 0 ? "text-emerald-600" : "text-stone-700")}>₪{c.total.toFixed(2)}</div>
                        {i === 0 && chainResults[1] && <div className="text-xs text-emerald-600">חיסכון ₪{(chainResults[1].total - c.total).toFixed(2)}</div>}
                        {i > 0 && <div className="text-xs text-stone-400">+₪{(c.total - chainResults[0].total).toFixed(2)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) :
              !listResults.length ? <div className="text-center py-16 text-stone-300 text-sm">לא נמצאו חנויות</div> :
              <div className="space-y-3">
                {listResults.map((store: StoreResult, i: number) => {
                  const sav = i > 0 ? (store.total - listResults[0].total) : 0;
                  const foundIds = new Set(store.breakdown?.map((b: any) => b.productId) || []);
                  const missing = list.filter(l => !foundIds.has(l.product.id));
                  const isOpen = expandedStore === i;
                  const isWinner = i === 0;
                  return (
                    <div key={store.storeId} className={"rounded-xl border transition-all " + (isWinner ? "border-emerald-200 bg-gradient-to-l from-emerald-50/80 to-white shadow-md" : "border-stone-100 bg-white hover:shadow-sm")}>
                      {/* Header - always visible */}
                      <button onClick={() => setExpandedStore(isOpen ? null : i)} className="w-full p-4 text-right">
                        <div className="flex items-start gap-3">
                          {/* לוגו */}
                          <div className="relative shrink-0 mt-0.5">
                            <CLogo name={store.chainName} subchain={store.subchainName} size={44} />
                            {isWinner && <span className="absolute -top-1.5 -right-1.5 text-sm">🏆</span>}
                          </div>
                          {/* מידע */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-black text-base text-stone-800 leading-tight">{store.subchainName ? subchainHe(store.subchainName) : chainHe(store.chainName)}</div>
                              <div className="shrink-0 text-right">
                                <div className={"font-mono font-black text-xl leading-tight " + (isWinner ? "text-emerald-600" : "text-stone-700")}>₪{store.total.toFixed(2)}</div>
                                {sav > 0 && <div className="text-xs text-red-400 font-semibold">+₪{sav.toFixed(2)}</div>}
                                {isWinner && listResults.length > 1 && <div className="text-xs text-emerald-600 font-bold">הכי זול ✓</div>}
                              </div>
                            </div>
                            <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                              {store.storeName}
                              {store.city && store.city !== '0' && !store.city.match(/^\d+$/) && ` · ${store.city}`}
                              {store.dist !== undefined && store.dist !== null && <span className="text-blue-400"> · {distToKm(store.dist).toFixed(1)} ק״מ</span>}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{store.availableCount} נמצאו</span>
                                {store.missingCount > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold">{store.missingCount} חסרים</span>}
                              </div>
                              <span className={"text-stone-300 transition-transform text-lg " + (isOpen ? "rotate-90" : "")} style={{ display: 'inline-block' }}>‹</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expandable detail */}
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-stone-100">
                          {/* Found items */}
                          {store.breakdown && store.breakdown.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-bold text-stone-400 mb-2 uppercase tracking-wide">מוצרים בסל</div>
                              <div className="rounded-lg overflow-hidden border border-stone-100">
                                {store.breakdown.map((b: any, bi: number) => {
                                  const prod = list.find(l => l.product.id === b.productId);
                                  return (
                                    <div key={b.productId} className={"flex items-center justify-between px-3 py-2.5 text-xs " + (bi % 2 === 0 ? "bg-white" : "bg-stone-50/50")}>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <ProductImg barcode={prod?.product.barcode || ''} name={prod?.product.name || ''} size={30} imageUrl={prod ? productImages[prod.product.id] : undefined} />
                                        <span className="text-stone-700 font-medium leading-snug">{prod ? prod.product.name : `מוצר #${b.productId}`}</span>
                                        {b.qty > 1 && <span className="text-stone-400 shrink-0">×{b.qty}</span>}
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 mr-2">
                                        <span className="text-stone-400">₪{Number(b.price).toFixed(2)}</span>
                                        <span className="font-mono font-bold text-stone-800 w-16 text-left">₪{b.subtotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Total row */}
                                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-100 border-t border-stone-200">
                                  <span className="text-xs font-bold text-stone-600">סה״כ</span>
                                  <span className={"font-mono font-black text-sm w-16 text-left " + (isWinner ? "text-emerald-600" : "text-stone-800")}>₪{store.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Missing items */}
                          {missing.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[11px] font-bold text-red-400 mb-2 uppercase tracking-wide">לא נמצאו בסניף</div>
                              <div className="rounded-lg border border-red-100 bg-red-50/30 overflow-hidden">
                                {missing.map(item => (
                                  <div key={item.product.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-red-50 last:border-0">
                                    <span className="w-5 h-5 rounded-md bg-red-100 text-red-400 flex items-center justify-center text-[10px] shrink-0 font-bold">✕</span>
                                    <span className="text-red-400">{item.product.name}</span>
                                    {item.qty > 1 && <span className="text-red-300">×{item.qty}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Savings banner */}
                          {isWinner && listResults.length > 1 && (
                            <div className="mt-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                              💰 חיסכון של ₪{(listResults[listResults.length - 1].total - store.total).toFixed(2)} לעומת הכי יקר
                            </div>
                          )}

                          {/* Navigate button */}
                          {store.storeName && (
                            <a
                              href={`https://waze.com/ul?q=${encodeURIComponent(store.storeName + (store.city && !store.city.match(/^\d+$/) ? ' ' + store.city : '') + ' ישראל')}&navigate=yes`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#33ccff] hover:bg-[#28b8e8] text-white text-sm font-bold transition shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.54 6.63c-1.41-4.35-6.2-5.95-10.14-4.89C7.5 2.59 5.1 4.59 4.28 7.27c-.83 2.68-.2 5.62 1.6 7.67l5.87 7.07c.3.36.8.36 1.1 0l5.87-7.07c1.19-1.35 1.89-3.09 1.89-4.95 0-1.14-.24-2.25-.69-3.26l.62-.1zM12 13.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 4.5 12 4.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/></svg>
                              נווט עם Waze
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
            </div>
          </div>
        )}
      </div>)}




      {/* SEO Categories */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <h2 className="font-bold text-stone-600 text-sm mb-3">קטגוריות</h2>
        <div className="flex flex-wrap gap-2">
          {["ניקיון ובית","ירקות ופירות","חטיפים וממתקים","היגיינה ויופי","משקאות","שימורים ומזון יבש","מוצרי חלב","דגנים וקטניות","לחם ומאפה","בשר ועוף","דגים ופירות ים","מוצרי תינוקות","מוצרים קפואים","מזון לחיות מחמד","בריאות ותוספים"].map(cat => (
            <a key={cat} href={`/category/${encodeURIComponent(cat)}`}
              className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition">
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-5">
            {/* Logo */}
            <div className="text-2xl font-black text-emerald-600 tracking-tight">savy</div>
            <p className="text-xs text-stone-400 text-center">השוואת מחירי סופרמרקט בישראל · 25+ רשתות · 7.5 מיליון מחירים</p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/profile.php?id=61588513298725" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/savy.co.il" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="#10b981" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#10b981"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@savy.co.il" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@SAVYCOIL" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all hover:scale-110">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="#10b981" strokeWidth="2"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a href="/terms" className="text-xs text-stone-400 hover:text-emerald-600 transition">תנאי שימוש</a>
              <span className="text-stone-200">·</span>
              <a href="/accessibility" className="text-xs text-stone-400 hover:text-emerald-600 transition">נגישות</a>
              <span className="text-stone-200">·</span>
              <button onClick={() => { setMenuOpen(true); setMenuPage('contact'); }} className="text-xs text-stone-400 hover:text-emerald-600 transition">צור קשר</button>
              <span className="text-stone-200">·</span>
              <button onClick={() => { setMenuOpen(true); setMenuPage('privacy'); }} className="text-xs text-stone-400 hover:text-emerald-600 transition">פרטיות</button>
            </div>

            <p className="text-[11px] text-stone-300">© 2025 Savy · כי מגיע לכם לדעת</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
