import { NextResponse } from "next/server";

// Embeddable widget: "כמה עולה להכין את המתכון הזה?"
// Served as a bare HTML document (no site chrome) designed to live inside an
// iframe on third-party recipe blogs. Ingredients are resolved server-side
// against the live catalog (cached 1h); the chain comparison runs client-side
// against /list/by-chain so prices are always current. Everything from the
// query string is escaped before it touches the HTML.
//
// URL: /embed/recipe?n=עוגת גבינה&ing=קמח:500 גרם,ביצים:3&src=blog.example
export const revalidate = 3600;

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const SITE = "https://www.savy.co.il";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Resolved {
  q: string;
  amount: string;
  qty: number;
  product: { id: number; name: string; minPrice: number; storeCount: number } | null;
}

// words that mean fresh produce — matches are gated HARD to the produce
// category: better an unmatched ingredient than a banana-flavored dessert
// standing in for a banana (real-world lesson from the first blog install)
const PRODUCE_WORDS = /עגבני|מלפפון|בצל|תפוח אדמה|תפו"א|גזר|קישוא|חציל|חסה|ברוקולי|כרובית|כרוב|פלפל|שום|בטטה|תרד|דלעת|סלרי|צנונ|לימון|תפוז|בננה|תפוח|אבוקדו|מנגו|תות|פטרוזיליה|כוסברה|נענע|שמיר|בזיליקום|פטריות/;
// a candidate carrying these is a flavored/processed product, not the food
// itself — penalized unless the ingredient line asked for it explicitly
const FLAVORED = /בטעם|מעדן|יוגורט|דניאלה|מילקי|אקטימל|חטיף|שוקו |גלידת|גלידה|קינוח|משקה|מיץ|סירופ|ממרח|דגני|עוגיות|וופל|תחליב|אבקת|רוטב|שלגון|ארטיק/;
const PROCESSED_PRODUCE = /חטיף|מיובש|משקה|מיץ|רסק|שימור|חמוץ|מלח|כתוש|קוביות|תיבולית|סלט|מוכן|אפוי|מטוגן|בטחינה|טעם|צ'יפס|ניוקי|רביולי|קמח/;

function wantsFrozen(q: string) { return /קפוא|קפואה|קפואים|קפואות/.test(q); }

function scoreCandidate(p: any, q: string): number {
  const name = String(p.name || "").trim();
  let s = 0;
  if (name === q) s += 40;
  if (name.startsWith(q + " ") || name.startsWith(q)) s += 25;
  else if (new RegExp(`(^| )${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(name)) s += 10;
  if (FLAVORED.test(name) && !FLAVORED.test(q)) s -= 35;
  if (/קפוא/.test(name) !== wantsFrozen(q)) s -= 8;
  s += Math.min(15, (p.storeCount || 0) / 120);
  return s;
}

async function searchOnce(q: string): Promise<any[]> {
  const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=40`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).filter((p: any) => p.minPrice != null && p.storeCount > 5);
}

async function resolveIngredient(q: string, amount: string): Promise<Resolved> {
  const qty = /^\d+$/.test(amount.trim()) ? Math.min(20, parseInt(amount.trim())) : 1;
  const none = { q, amount, qty, product: null };
  try {
    let candidates = await searchOnce(q);
    const produceWord = q.match(PRODUCE_WORDS)?.[0];

    if (produceWord && !wantsFrozen(q)) {
      // fresh produce: the produce category only, nothing processed
      let produce = candidates.filter((p: any) => p.category === "ירקות ופירות" && !PROCESSED_PRODUCE.test(p.name));
      if (!produce.length && produceWord !== q) {
        // "בננה בשלה" found nothing — retry on the produce word itself
        produce = (await searchOnce(produceWord)).filter((p: any) =>
          p.category === "ירקות ופירות" && !PROCESSED_PRODUCE.test(p.name));
      }
      candidates = produce; // hard gate: no produce match -> unresolved
      if (!candidates.length) return none;
      candidates.sort((a: any, b: any) => scoreCandidate(b, produceWord) - scoreCandidate(a, produceWord));
    } else {
      candidates.sort((a: any, b: any) => scoreCandidate(b, q) - scoreCandidate(a, q));
      // a deeply negative best score means we'd show nonsense — skip instead
      if (!candidates.length || scoreCandidate(candidates[0], q) < -10) return none;
    }
    const p = candidates[0];
    return { q, amount, qty, product: { id: p.id, name: p.name, minPrice: +p.minPrice, storeCount: p.storeCount } };
  } catch {
    return none;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("n") || "המתכון").slice(0, 80);
  const src = (searchParams.get("src") || "").slice(0, 100);
  const ingParam = (searchParams.get("ing") || "").slice(0, 2000);

  const ings = ingParam.split(",").map((part) => {
    const [q, amount = ""] = part.split(":");
    return { q: (q || "").trim().slice(0, 60), amount: amount.trim().slice(0, 40) };
  }).filter((i) => i.q).slice(0, 25);

  const resolved = ings.length
    ? await Promise.all(ings.map((i) => resolveIngredient(i.q, i.amount)))
    : [];
  const found = resolved.filter((r) => r.product);
  const estimate = found.reduce((s, r) => s + r.product!.minPrice * r.qty, 0);
  const items = found.map((r) => ({ productId: r.product!.id, qty: r.qty }));
  const importParam = found.map((r) => `${r.product!.id}:${r.qty}`).join(",");
  const ctaUrl = `${SITE}/basket-import?items=${encodeURIComponent(importParam)}&n=${encodeURIComponent(name)}&src=${encodeURIComponent(src)}`;

  const chipsHtml = found.slice(0, 25).map((r) =>
    `<span class="chip" title="${esc(r.product!.name)}">${esc(r.q)}${r.qty > 1 ? ` ×${r.qty}` : ""}</span>`
  ).join("");

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>כמה עולה להכין ${esc(name)}? — Savy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Heebo',-apple-system,'Segoe UI',Arial,sans-serif;background:transparent;padding:4px}
  .card{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:20px;overflow:hidden;box-shadow:0 8px 28px rgba(5,150,105,.12)}
  .head{background:linear-gradient(135deg,#059669,#0d9488 60%,#0ea5e9);padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .head h1{color:#fff;font-size:16px;font-weight:900;line-height:1.25;text-shadow:0 1px 2px rgba(0,0,0,.15)}
  .live{flex-shrink:0;display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);color:#fff;font-size:10px;font-weight:600;border-radius:999px;padding:3px 9px;white-space:nowrap}
  .dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:pulse 1.8s infinite}
  @keyframes pulse{70%{box-shadow:0 0 0 6px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
  .body{padding:12px 14px 14px}
  .save{display:none;align-items:center;gap:7px;background:linear-gradient(to left,#fffbeb,#fef3c7);border:1px solid #fde68a;color:#92400e;font-size:12.5px;font-weight:700;border-radius:12px;padding:7px 11px;margin-bottom:10px}
  .save b{font-size:14px}
  .chains{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:flex;align-items:center;gap:10px;background:#fafaf9;border:1.5px solid #f5f5f4;border-radius:14px;padding:8px 12px;transition:transform .15s}
  .row.win{background:linear-gradient(to left,#ecfdf5,#f0fdfa);border-color:#34d399;box-shadow:0 2px 10px rgba(16,185,129,.18)}
  .avatar{width:30px;height:30px;border-radius:10px;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .cname{flex:1;min-width:0}
  .cname b{display:block;font-size:13.5px;color:#1c1917;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cname small{font-size:10px;color:#f59e0b;font-weight:600}
  .best{font-size:9px;font-weight:800;color:#047857;background:#d1fae5;border-radius:999px;padding:2px 7px;margin-inline-start:4px;vertical-align:2px}
  .price{font-weight:900;font-size:17px;color:#44403c;letter-spacing:-.3px}
  .win .price{color:#059669;font-size:19px}
  .chips{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:11px}
  .chips .lbl{font-size:10.5px;color:#059669;font-weight:700}
  .chip{font-size:10px;color:#57534e;background:#fafaf9;border:1px solid #e7e5e4;border-radius:999px;padding:2px 8px}
  .cta{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-weight:800;font-size:15px;border-radius:14px;padding:13px;text-decoration:none;box-shadow:0 4px 14px rgba(5,150,105,.35);transition:transform .15s,box-shadow .15s}
  .cta:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(5,150,105,.45)}
  .cta .arr{display:inline-block;animation:nudge 1.4s infinite}
  @keyframes nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(-4px)}}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
  .foot a{font-size:10px;color:#a8a29e;text-decoration:none}
  .foot a b{color:#059669}
  .trust{font-size:10px;color:#a8a29e}
  .skel{height:46px;border-radius:14px;background:linear-gradient(90deg,#f5f5f4,#fafaf9,#f5f5f4);background-size:200% 100%;animation:sh 1.2s infinite}
  @keyframes sh{to{background-position:-200% 0}}
  .err{font-size:12px;color:#a8a29e;text-align:center;padding:12px}
</style>
</head>
<body>
<div class="card">
  <div class="head">
    <h1>💰 כמה עולה להכין ${esc(name)}?</h1>
    <span class="live"><span class="dot"></span> מחירים חיים</span>
  </div>
  <div class="body">
    <div id="save" class="save">💸 <span>על הסל הזה חוסכים עד <b id="saveAmt"></b> בין הרשתות</span></div>
    <div id="chains" class="chains">
      ${found.length ? '<div class="skel"></div><div class="skel"></div><div class="skel"></div>' : '<div class="err">לא זוהו מצרכים להשוואה</div>'}
    </div>
    <div class="chips"><span class="lbl">✓ זוהו ${found.length} מצרכים:</span>${chipsHtml}</div>
    <a class="cta" href="${esc(ctaUrl)}" target="_blank" rel="noopener">🛒 השוו ליד הבית והוסיפו לסל <span class="arr">←</span></a>
    <div class="foot">
      <a href="${SITE}/?utm_source=widget&utm_medium=embed&utm_campaign=${encodeURIComponent(src)}" target="_blank" rel="noopener">מופעל ע״י <b>Savy</b> ⚡ השוואת מחירי סופרמרקט</a>
      <span class="trust">חינם · בלי הרשמה</span>
    </div>
  </div>
</div>
<script>
(function(){
  var items=${JSON.stringify(items)};
  var fallback=${JSON.stringify(+estimate.toFixed(2))};
  var box=document.getElementById('chains'),save=document.getElementById('save'),saveAmt=document.getElementById('saveAmt');
  if(!items.length)return;
  var COLORS=['#e11d48','#2563eb','#f59e0b','#7c3aed','#0d9488','#db2777','#4f46e5','#ca8a04'];
  function color(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return COLORS[h%COLORS.length]}
  function escT(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
  function heName(c){
    var m={'Shufersal':'שופרסל','Rami Levy':'רמי לוי','Victory':'ויקטורי','Osher Ad':'אושר עד','Carrefour':'קרפור','Yochananof':'יוחננוף','Tiv Taam':'טיב טעם','Hazi Hinam':'חצי חינם','Yayno Bitan':'יינות ביתן','Keshet Taamim':'קשת טעמים','Freshmarket':'פרשמרקט','Mahsani Ashuk':'מחסני השוק','King Store':'קינג סטור','Zol Vebegadol':'זול ובגדול','Netiv Hased':'נתיב החסד','Super Yuda':'סופר יודה','Bareket':'סופר ברקת','Polizer':'פוליצר','Wolt':'וולט מרקט','Stop Market':'סטופ מרקט','Super Sapir':'סופר ספיר','Machsanei HaShuk':'מחסני השוק','Yellow':'ילו','Quik':'קוויק'};
    return c.subchainName||m[c.chainName]||c.chainName;
  }
  function show(ch){
    var eff=function(c){return c.promoTotal!=null?c.promoTotal:c.total};
    ch=ch.filter(function(c){return c.availableCount>0}).sort(function(a,b){return a.missingCount-b.missingCount||eff(a)-eff(b)}).slice(0,4);
    if(!ch.length){fb();return}
    var complete=ch.filter(function(c){return c.missingCount===ch[0].missingCount});
    var best=eff(ch[0]),worst=eff(complete[complete.length-1]);
    if(complete.length>1&&worst-best>1){save.style.display='flex';saveAmt.textContent='₪'+(worst-best).toFixed(0)}
    box.innerHTML=ch.map(function(c,i){
      var nm=heName(c);
      return '<div class="row'+(i===0?' win':'')+'">'
        +'<span class="avatar" style="background:'+color(nm)+'">'+escT(nm.charAt(0))+'</span>'
        +'<span class="cname"><b>'+escT(nm)+(i===0?'<span class="best">הכי זול 🏆</span>':'')+'</b>'
        +(c.missingCount>0?'<small>חסרים '+c.missingCount+' מצרכים</small>':'')+'</span>'
        +'<span class="price">₪'+eff(c).toFixed(2)+'</span></div>';
    }).join('');
  }
  function fb(){
    if(fallback>0){box.innerHTML='<div class="row win"><span class="avatar" style="background:#059669">₪</span><span class="cname"><b>עלות משוערת במחירים הזולים</b></span><span class="price">מ-₪'+fallback.toFixed(0)+'</span></div>'}
    else{box.innerHTML='<div class="err">לא הצלחנו לטעון השוואה</div>'}
  }
  fetch('${API}/list/by-chain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items})})
    .then(function(r){return r.json()}).then(function(d){show(d.chains||[])}).catch(fb);
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
}
