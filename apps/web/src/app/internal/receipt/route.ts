import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API = 'https://supermarket-compare-production.up.railway.app';

async function extractFromImage(b64: string, imgIndex: number, total: number) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: `זוהי תמונה ${imgIndex + 1} מתוך ${total} של קבלה מסופרמרקט ישראלי.\nחלץ את כל המידע הנראה בתמונה זו בלבד.\nהחזר JSON בלבד:\n{\n  "store": "שם הרשת או null",\n  "branch": "שם הסניף או null",\n  "date": "תאריך או null",\n  "total": null,\n  "items": [\n    { "name": "שם המוצר", "barcode": null, "price": 12.90, "qty": 1, "subtotal": 12.90 }\n  ]\n}\nחוקים:\n- חלץ רק מוצרים הנראים בתמונה זו\n- ברקוד: אם לא נראה בבירור = null\n- כמות: ברירת מחדל 1\n- מחיר: המחיר הסופי אחרי הנחות\n- total: רק אם נראה סכום כולל בתמונה זו, אחרת null\n- אם התמונה לא ברורה: { "store": null, "branch": null, "date": null, "total": null, "items": [] }` }
      ],
    }],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return { store: null, branch: null, date: null, total: null, items: [] }; }
}

function mergeResults(results: any[]) {
  const merged = { store: null as string | null, branch: null as string | null, date: null as string | null, total: null as number | null, items: [] as any[] };
  for (const r of results) {
    if (!merged.store && r.store) merged.store = r.store;
    if (!merged.branch && r.branch) merged.branch = r.branch;
    if (!merged.date && r.date) merged.date = r.date;
    if (!merged.total && r.total) merged.total = r.total;
  }
  const allItems = results.flatMap(r => r.items || []);
  const seen = new Set<string>();
  for (const item of allItems) {
    const key = `${item.name?.trim().toLowerCase()}_${item.price}`;
    if (!seen.has(key)) { seen.add(key); merged.items.push(item); }
  }
  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const { parts, base64, lat, lng } = await req.json();
    const sessionToken = req.headers.get('x-session-token') || req.cookies.get('session_token')?.value;
    const images: string[] = parts || (base64 ? [base64] : []);
    if (!images.length) return NextResponse.json({ error: 'חסרות תמונות' }, { status: 400 });

    const partialResults: any[] = [];
    const BATCH_SIZE = 6;
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map((b64, bIdx) => extractFromImage(b64, i + bIdx, images.length)));
      partialResults.push(...batchResults);
    }

    const parsed = mergeResults(partialResults);
    if (!parsed.items.length) return NextResponse.json({ error: 'לא הצלחנו לזהות פריטים בקבלה. נסה לצלם בתאורה טובה יותר.' }, { status: 422 });

    const itemsWithSavings = await Promise.all(
      parsed.items.map(async (item: any) => {
        try {
          let match = null;
          if (item.barcode) {
            const res = await fetch(`${API}/api/search?q=${encodeURIComponent(item.barcode)}&limit=1`);
            const data = await res.json();
            match = data.results?.[0] || null;
          }
          if (!match && item.name) {
            const res2 = await fetch(`${API}/api/search?q=${encodeURIComponent(item.name.substring(0, 20))}&limit=1`);
            const data2 = await res2.json();
            match = data2.results?.[0] || null;
          }
          if (!match) return { ...item, savings: 0 };
          if (match.minPrice && match.minPrice < item.price)
            return { ...item, productId: match.id, minPrice: match.minPrice, savings: +(item.price - match.minPrice).toFixed(2) };
          return { ...item, productId: match.id, minPrice: match.minPrice || null, savings: 0 };
        } catch { return { ...item, savings: 0 }; }
      })
    );

    const totalSavings = itemsWithSavings.reduce((s, i) => s + (i.savings || 0), 0);
    const listItems = itemsWithSavings.filter(i => i.productId).map(i => ({ productId: i.productId, qty: i.qty || 1 }));

    let bestStores: any[] = [];
    if (listItems.length > 0) {
      try {
        const listRes = await fetch(`${API}/api/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: listItems, lat, lng }),
        });
        if (listRes.ok) { const listData = await listRes.json(); bestStores = (listData.bestStoreCandidates || []).slice(0, 3); }
      } catch (e: any) { console.error('List fetch error:', e.message); }
    }

    const foundTotal = itemsWithSavings.filter(i => i.productId).reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

    try {
      if (sessionToken) {
        await fetch(`${API}/api/receipt/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': sessionToken },
          body: JSON.stringify({ store_name: parsed.store, total_paid: parsed.total, total_cheapest: (parsed.total || 0) - totalSavings, saved: totalSavings, items: itemsWithSavings }),
        });
      }
    } catch (e) { console.error('Save receipt error:', e); }

    return NextResponse.json({
      store: parsed.store, branch: parsed.branch, receipt_number: null,
      date: parsed.date, total: parsed.total, items: itemsWithSavings,
      savings: +totalSavings.toFixed(2), bestStores,
      foundTotal: +foundTotal.toFixed(2), coveredItems: listItems.length,
      totalItems: parsed.items.length, imagesProcessed: images.length,
    });
  } catch (e: any) {
    console.error('Receipt error:', e);
    return NextResponse.json({ error: e.message || 'שגיאה בעיבוד הקבלה' }, { status: 500 });
  }
}
