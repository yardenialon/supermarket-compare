"use client";
import { useState, useEffect } from "react";

const CHAIN_INFO: Record<string, { he: string; logo: string }> = {
  'Shufersal':    { he: 'שופרסל',        logo: '/logos/shufersal.png' },
  'Rami Levy':    { he: 'רמי לוי',       logo: '/logos/rami-levy.png' },
  'Victory':      { he: 'ויקטורי',       logo: '/logos/victory.png' },
  'Mega':         { he: 'מגה',           logo: '/logos/mega.png' },
  'Osher Ad':     { he: 'אושר עד',       logo: '/logos/osher-ad.png' },
  'Tiv Taam':     { he: 'טיב טעם',       logo: '/logos/tiv-taam.png' },
  'Yochananof':   { he: 'יוחננוף',       logo: '/logos/yochananof.png' },
  'Hazi Hinam':   { he: 'חצי חינם',      logo: '/logos/hazi-hinam.png' },
  'Keshet Taamim':{ he: 'קשת טעמים',     logo: '/logos/keshet-taamim.png' },
  'Freshmarket':  { he: 'פרשמרקט',       logo: '/logos/freshmarket.png' },
  'Bareket':      { he: 'סופר ברקת',     logo: '/logos/bareket.png' },
  'City Market':  { he: 'סיטי מרקט',     logo: '/logos/city-market.png' },
  'Dor Alon':     { he: 'דור אלון',      logo: '/logos/alunit.png' },
  'Good Pharm':   { he: 'גוד פארם',      logo: '/logos/Good-Pharm.png' },
  'Het Cohen':    { he: 'חט כהן',        logo: '/logos/Het-Cohen.png' },
  'King Store':   { he: 'קינג סטור',     logo: '/logos/king-store.png' },
  'Carrefour':    { he: 'כרפור',         logo: '/logos/Carrefour.png' },
  'Mahsani Ashuk':{ he: 'מחסני השוק',    logo: '/logos/mahsani-ashuk.png' },
  'Netiv Hased':  { he: 'נתיב החסד',     logo: '/logos/Netiv-Hased.png' },
  'Zol Vebegadol':{ he: 'זול ובגדול',    logo: '/logos/zol-vebegadol.png' },
  'Super Sapir':  { he: 'סופר ספיר',     logo: '/logos/Super-Sapir.png' },
  'Super Yuda':   { he: 'סופר יודה',     logo: '/logos/super-yuda.png' },
  'Stop Market':  { he: 'סטופ מרקט',     logo: '/logos/stopmarket.png' },
  'Shuk Ahir':    { he: 'שוק העיר',      logo: '/logos/shuk-haeir.png' },
  'Salach Dabach':{ he: 'סלאח דבאח',     logo: '/logos/salach-dabach.png' },
  'Shefa Barcart Ashem': { he: 'שפע ברכת השם', logo: '/logos/Shefa-Barcart-Ashem.png' },
  'Polizer':      { he: 'פוליצר',        logo: '/logos/polizer.png' },
  'Maayan 2000':  { he: 'מעיין 2000',    logo: '/logos/maian2000.png' },
  'Wolt':         { he: 'וולט',          logo: '/logos/wolt.png' },
};

interface ChainData { name: string; stores: number; products: number; prices: number; lastUpdate: string; }

export default function StatusPage() {
  const [data, setData] = useState<ChainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastGlobal, setLastGlobal] = useState('');
  const [totals, setTotals] = useState({ stores: 0, products: 0, prices: 0 });

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API || 'https://supermarket-compare-production.up.railway.app';
    fetch(`${base}/api/status`)
      .then(r => r.json())
      .then(d => { setData(d.chains || []); setLastGlobal(d.lastUpdate || ''); setTotals(d.totals || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const fmtNum = (n: number) => (n || 0).toLocaleString('he-IL');

  return (
    <div className="pb-16">
      <div className="text-center mb-8">
        <a href="/"><img src="/icons/savy-logo.png" alt="Savy" className="h-16 mx-auto mb-4 object-contain" /></a>
        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 mb-2">סטטוס מערכת</h1>
        <p className="text-stone-400 text-sm">מידע על רשתות, מוצרים ועדכניות המחירים</p>
      </div>
      {loading ? <div className="text-center py-12 text-stone-400">טוען נתונים...</div> : (<>
        <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-l from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div><div className="text-sm opacity-80 mb-1">עדכון אחרון</div><div className="font-black text-xl">{fmtDate(lastGlobal)}</div></div>
            <div className="text-4xl">✅</div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center flex-1"><div className="font-black text-2xl">{fmtNum(totals.prices)}</div><div className="text-xs opacity-80">מחירים</div></div>
            <div className="text-center flex-1"><div className="font-black text-2xl">{fmtNum(totals.products)}</div><div className="text-xs opacity-80">מוצרים</div></div>
            <div className="text-center flex-1"><div className="font-black text-2xl">{fmtNum(totals.stores)}</div><div className="text-xs opacity-80">סניפים</div></div>
            <div className="text-center flex-1"><div className="font-black text-2xl">{data.length}</div><div className="text-xs opacity-80">רשתות</div></div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_100px] gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100 text-xs font-bold text-stone-400">
            <div>רשת</div><div className="text-center">סניפים</div><div className="text-center">מוצרים</div><div className="text-center">מחירים</div>
          </div>
          {data.map((chain, i) => {
            const info = CHAIN_INFO[chain.name];
            return (
              <div key={chain.name} className={"px-4 py-3 border-b border-stone-50 " + (i % 2 === 0 ? "bg-white" : "bg-stone-50/50")}>
                <div className="sm:grid sm:grid-cols-[1fr_80px_80px_100px] sm:gap-2 sm:items-center">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    {info?.logo && <img src={info.logo} alt="" className="w-9 h-9 object-contain rounded-lg" onError={(e: any) => e.target.style.display='none'} />}
                    <div>
                      <div className="font-bold text-sm text-stone-800">{info?.he || chain.name}</div>
                      <div className="text-[10px] text-stone-300">{fmtDate(chain.lastUpdate)}</div>
                    </div>
                  </div>
                  <div className="sm:hidden flex gap-4 text-xs text-stone-500 mr-12">
                    <span><strong className="text-stone-700">{fmtNum(chain.stores)}</strong> סניפים</span>
                    <span><strong className="text-stone-700">{fmtNum(chain.products)}</strong> מוצרים</span>
                    <span><strong className="text-emerald-600">{fmtNum(chain.prices)}</strong> מחירים</span>
                  </div>
                  <div className="hidden sm:block text-center font-mono font-bold text-sm text-stone-600">{fmtNum(chain.stores)}</div>
                  <div className="hidden sm:block text-center font-mono font-bold text-sm text-stone-600">{fmtNum(chain.products)}</div>
                  <div className="hidden sm:block text-center font-mono font-bold text-sm text-emerald-600">{fmtNum(chain.prices)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors">🔍 חזרה לחיפוש</a>
        </div>
      </>)}
    </div>
  );
}
