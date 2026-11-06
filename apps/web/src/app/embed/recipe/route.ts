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
const SITE = "https://savy.co.il";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Resolved {
  q: string;
  amount: string;
  qty: number;
  product: { id: number; name: string; minPrice: number; storeCount: number } | null;
}

// words that mean fresh produce — gate matches to the produce category so
// "מלפפון" never resolves to pickles or cosmetics (lesson from the recipes)
const PRODUCE_WORDS = /עגבני|מלפפון|בצל|תפוח אדמה|תפו"א|גזר|קישוא|חציל|חסה|ברוקולי|כרובית|כרוב|פלפל|שום|בטטה|תרד|דלעת|סלרי|צנונ|לימון|תפוז|בננה|אבוקדו|פטרוזיליה|כוסברה|נענע|שמיר|בזיליקום/;

async function resolveIngredient(q: string, amount: string): Promise<Resolved> {
  const qty = /^\d+$/.test(amount.trim()) ? Math.min(20, parseInt(amount.trim())) : 1;
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=25`, { next: { revalidate: 3600 } });
    if (!res.ok) return { q, amount, qty, product: null };
    const data = await res.json();
    let candidates = (data.results ?? []).filter((p: any) => p.minPrice != null && p.storeCount > 5);
    if (PRODUCE_WORDS.test(q)) {
      const produce = candidates.filter((p: any) => p.category === "ירקות ופירות" &&
        !/חטיף|קפוא|מיובש|משקה|מיץ|רסק|שימור|חמוץ|מלח|כתוש|קוביות|תיבולית|סלט|מוכן/.test(p.name));
      if (produce.length) candidates = produce;
    }
    // prefer a product whose name starts with the query; then widest coverage
    candidates.sort((a: any, b: any) =>
      Number(b.name.trim().startsWith(q)) - Number(a.name.trim().startsWith(q)) || b.storeCount - a.storeCount);
    const p = candidates[0];
    return { q, amount, qty, product: p ? { id: p.id, name: p.name, minPrice: +p.minPrice, storeCount: p.storeCount } : null };
  } catch {
    return { q, amount, qty, product: null };
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

  const rowsHtml = found.slice(0, 25).map((r) =>
    `<span class="chip" title="${esc(r.product!.name)}">${esc(r.q)}${r.qty > 1 ? ` ×${r.qty}` : ""}</span>`
  ).join("");

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>כמה עולה להכין ${esc(name)}? — Savy</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,"Segoe UI",Roboto,"Heebo",Arial,sans-serif;background:#fafaf9;color:#292524;padding:14px}
  .card{max-width:620px;margin:0 auto}
  .head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px}
  h1{font-size:16px;font-weight:900}
  .sub{font-size:11px;color:#a8a29e}
  .chains{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #f5f5f4;border-radius:14px;padding:9px 12px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .row.win{border-color:#6ee7b7;background:linear-gradient(to left,#ecfdf5,#fff)}
  .rank{width:22px;height:22px;border-radius:50%;background:#f5f5f4;color:#a8a29e;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .win .rank{background:#10b981;color:#fff}
  .cname{flex:1;font-weight:700;font-size:13px}
  .miss{font-size:10px;color:#f59e0b}
  .price{font-weight:900;font-size:16px;font-family:ui-monospace,monospace}
  .win .price{color:#059669}
  .spread{font-size:11px;color:#047857;background:#ecfdf5;border:1px solid #d1fae5;border-radius:10px;padding:6px 10px;margin-bottom:10px;display:none}
  .chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
  .chip{font-size:10px;color:#78716c;background:#fff;border:1px solid #f5f5f4;border-radius:999px;padding:2px 8px}
  .cta{display:block;text-align:center;background:#059669;color:#fff;font-weight:800;font-size:14px;border-radius:14px;padding:12px;text-decoration:none}
  .cta:hover{background:#047857}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
  .foot a{font-size:10px;color:#a8a29e;text-decoration:none}
  .foot a b{color:#059669}
  .skel{height:40px;border-radius:14px;background:linear-gradient(90deg,#f5f5f4,#fafaf9,#f5f5f4);background-size:200% 100%;animation:sh 1.2s infinite}
  @keyframes sh{to{background-position:-200% 0}}
  .err{font-size:12px;color:#a8a29e;text-align:center;padding:10px}
</style>
</head>
<body>
<div class="card">
  <div class="head">
    <h1>💰 כמה עולה להכין ${esc(name)}?</h1>
    <span class="sub">מחירים חיים</span>
  </div>
  <div id="spread" class="spread"></div>
  <div id="chains" class="chains">
    ${found.length ? '<div class="skel"></div><div class="skel"></div><div class="skel"></div>' : '<div class="err">לא זוהו מצרכים להשוואה</div>'}
  </div>
  <div class="chips">${rowsHtml}</div>
  <a class="cta" href="${esc(ctaUrl)}" target="_blank" rel="noopener">🛒 השוו ליד הבית והוסיפו לסל ←</a>
  <div class="foot">
    <a href="${SITE}/?utm_source=widget&utm_medium=embed&utm_campaign=${encodeURIComponent(src)}" target="_blank" rel="noopener">מופעל ע״י <b>Savy</b> — השוואת מחירי סופרמרקט</a>
    <a href="${SITE}/widget" target="_blank" rel="noopener">הוסיפו לבלוג שלכם</a>
  </div>
</div>
<script>
(function(){
  var items=${JSON.stringify(items)};
  var fallback=${JSON.stringify(+estimate.toFixed(2))};
  var box=document.getElementById('chains'),spread=document.getElementById('spread');
  if(!items.length)return;
  function escT(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
  function show(ch){
    var eff=function(c){return c.promoTotal!=null?c.promoTotal:c.total};
    ch=ch.filter(function(c){return c.availableCount>0}).sort(function(a,b){return a.missingCount-b.missingCount||eff(a)-eff(b)}).slice(0,4);
    if(!ch.length){fb();return}
    var best=eff(ch[0]),worst=eff(ch[ch.length-1]);
    if(ch.length>1&&worst-best>1){spread.style.display='block';spread.innerHTML='💸 ההפרש בין הרשתות על הסל הזה: <b>₪'+(worst-best).toFixed(0)+'</b>'}
    box.innerHTML=ch.map(function(c,i){
      var nm=c.subchainName||c.chainName;
      return '<div class="row'+(i===0?' win':'')+'"><span class="rank">'+(i===0?'🏆':i+1)+'</span><span class="cname">'+escT(nm)+(c.missingCount>0?' <span class="miss">(חסרים '+c.missingCount+')</span>':'')+'</span><span class="price">₪'+eff(c).toFixed(2)+'</span></div>';
    }).join('');
  }
  function fb(){
    if(fallback>0){box.innerHTML='<div class="row win"><span class="rank">₪</span><span class="cname">עלות משוערת במחירים הזולים ביותר</span><span class="price">מ-₪'+fallback.toFixed(0)+'</span></div>'}
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
