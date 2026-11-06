"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

// Landing page for the blog widget's CTA: /basket-import?items=123:2,456:1&n=עוגה
// Fetches the products, merges them into the local shopping list (savy-list)
// and drops the visitor straight into the full basket comparison.
function BasketImport() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"working" | "error">("working");
  const name = (params.get("n") || "המתכון").slice(0, 80);

  useEffect(() => {
    (async () => {
      try {
        const pairs = (params.get("items") || "").split(",")
          .map((p) => { const [id, qty] = p.split(":"); return { id: parseInt(id), qty: Math.min(20, Math.max(1, parseInt(qty) || 1)) }; })
          .filter((p) => p.id > 0)
          .slice(0, 30);
        if (!pairs.length) { setStatus("error"); return; }

        const products = await Promise.all(pairs.map(async (p) => {
          try {
            const res = await fetch(`${API}/product/${p.id}`);
            if (!res.ok) return null;
            const prod = await res.json();
            return { product: prod, qty: p.qty };
          } catch { return null; }
        }));
        const valid = products.filter(Boolean) as { product: any; qty: number }[];
        if (!valid.length) { setStatus("error"); return; }

        // merge into the existing list (same shape the homepage uses)
        let list: { product: any; qty: number }[] = [];
        try { list = JSON.parse(localStorage.getItem("savy-list") || "[]"); } catch {}
        for (const v of valid) {
          const ex = list.find((i) => i.product?.id === v.product.id);
          if (ex) ex.qty = Math.max(ex.qty, v.qty);
          else list.push(v);
        }
        try { localStorage.setItem("savy-list", JSON.stringify(list)); } catch {}
        window.location.replace("/?tab=list");
      } catch { setStatus("error"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div dir="rtl" className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      {status === "working" ? (
        <>
          <div className="text-4xl mb-3 animate-bounce">🛒</div>
          <h1 className="font-black text-xl text-stone-800 mb-1">טוענים את המצרכים של {name}...</h1>
          <p className="text-sm text-stone-400">עוד רגע תראו איפה הסל הכי זול — כולל מבצעים וסניפים לידכם</p>
        </>
      ) : (
        <>
          <div className="text-4xl mb-3">🤔</div>
          <h1 className="font-black text-xl text-stone-800 mb-1">לא הצלחנו לטעון את הסל</h1>
          <p className="text-sm text-stone-400 mb-4">אפשר לבנות רשימה ידנית בכמה שניות</p>
          <a href="/?tab=list" className="bg-emerald-600 text-white font-bold rounded-2xl px-6 py-3 text-sm">לרשימת הקניות ←</a>
        </>
      )}
    </div>
  );
}

export default function BasketImportPage() {
  return <Suspense fallback={null}><BasketImport /></Suspense>;
}
