export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60,
};

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API = 'https://supermarket-compare-production.up.railway.app';

function detectMimeType(b64: string): string {
  const header = b64.substring(0, 8);
  if (header.startsWith('JVBERi0')) return 'application/pdf';
  if (header.startsWith('/9j/')) return 'image/jpeg';
  if (header.startsWith('iVBORw')) return 'image/png';
  if (header.startsWith('UklGRi')) return 'image/webp';
  return 'image/jpeg';
}

async function extractFromSinglePdf(b64: string) {
  // PDF — שולחים בבקשה אחת עם claude-3-5-sonnet שתומך ב-PDF
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: b64 },
        } as any,
        {
          type: 'text',
          text: `זהו קובץ PDF של קבלה מסופרמרקט ישראלי.
חלץ את כל הפרטים מהקבלה — שם חנות, תאריך, פריטים ומחירים.
החזר JSON בלבד, ללא הסברים:
{
  "store": "שם הרשת",
  "branch": "שם הסניף",
  "date": "תאריך",
  "total": 123.45,
  "items": [
    { "name": "שם המוצר", "barcode": null, "price": 4.30, "qty": 3, "subtotal": 12.90 }
  ]
}
חוקים:
- חלץ את כל המוצרים שמופיעים בקבלה
- ברקוד: אם לא מופיע = null
- כמות: ברירת מחדל 1
- price: מחיר ליחידה אחת (לא סכום כולל)
- subtotal: price × qty (סכום שורה)
- אם שדה לא קיים: null`
        }
      ],
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in: ' + text.substring(0, 100));
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { store: null, branch: null, date: null, total: null, items: [] };
  }
}

async function extractFromImage(b64: string, imgIndex: number, total: number) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: detectMimeType(b64) as 'image/jpeg' | 'image/png' | 'image/webp',
            data: b64,
          },
        },
        {
          type: 'text',
          text: `זוהי תמונה ${imgIndex + 1} מתוך ${total} של קבלה מסופרמרקט ישראלי.
חלץ את כל המידע הנראה בתמונה זו בלבד.
החזר JSON בלבד:
{
  "store": "שם הרשת או null",
  "branch": "שם הסניף או null",
  "date": "תאריך או null",
  "total": null,
  "items": [
    { "name": "שם המוצר", "barcode": null, "price": 4.30, "qty": 3, "subtotal": 12.90 }
  ]
}
חוקים:
- חלץ רק מוצרים הנראים בתמונה זו
- ברקוד: אם לא נראה = null
- כמות: ברירת מחדל 1
- price: מחיר ליחידה אחת (לא סכום כולל)
- subtotal: price × qty (סכום שורה)
- total: רק אם נראה סכום כולל, אחרת null
- אם התמונה לא ברורה: { "store": null, "branch": null, "date": null, "total": null, "items": [] }`
        }
      ],
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in: ' + text.substring(0, 100));
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { store: null, branch: null, date: null, total: null, items: [] };
  }
}

function mergeResults(results: any[]) {
  const merged = {
    store: null as string | null,
    branch: null as string | null,
    date: null as string | null,
    total: null as number | null,
    items: [] as any[],
  };
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

    // בדוק אם יש PDF — שלח בנפרד
    const partialResults: any[] = [];
    const BATCH_SIZE = 6;

    // הפרד PDFs מתמונות
    const pdfs = images.filter(b => detectMimeType(b) === 'application/pdf');
    const imgs = images.filter(b => detectMimeType(b) !== 'application/pdf');

    // עבד PDFs — כל PDF בנפרד
    for (const pdf of pdfs) {
      const result = await extractFromSinglePdf(pdf);
      partialResults.push(result);
    }

    // עבד תמונות במקביל
    for (let i = 0; i < imgs.length; i += BATCH_SIZE) {
      const batch = imgs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((b64, bIdx) => extractFromImage(b64, i + bIdx, imgs.length))
      );
      partialResults.push(...batchResults);
    }

    const parsed = mergeResults(partialResults);

    if (!parsed.items.length) {
      return NextResponse.json({
        error: 'לא הצלחנו לזהות פריטים בקבלה. אם זה PDF — נסה לצלם תמונה של הקבלה במקום.'
      }, { status: 422 });
    }

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
          if (match.minPrice && match.minPrice < item.price) { const qty = item.qty || 1; return { ...item, productId: match.id, minPrice: match.minPrice, savings: +((item.price - match.minPrice) * qty).toFixed(2) }; }
          return { ...item, productId: match.id, minPrice: match.minPrice || null, savings: 0 };
        } catch { return { ...item, savings: 0 }; }
      })
    );

    const totalSavings = itemsWithSavings.reduce((s, i) => s + (i.savings || 0), 0);
    const listItems = itemsWithSavings
    .filter(i => i.productId && i.barcode && i.price > 0)
    .map(i => ({ productId: i.productId, qty: 1 }));

    let bestStores: any[] = [];
    if (listItems.length > 0) {
      try {
        const listRes = await fetch(`${API}/api/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: listItems, lat, lng, topN: 10 }),
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          bestStores = (listData.bestStoreCandidates || []).slice(0, 10);
        }
      } catch (e: any) { console.error('List error:', e.message); }
    }

    const foundTotal = itemsWithSavings.filter(i => i.productId && i.barcode).reduce((s, i) => s + (i.subtotal || i.price), 0);

    try {
      if (sessionToken) {
        await fetch(`${API}/api/receipt/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': sessionToken },
          body: JSON.stringify({
            store_name: parsed.store, total_paid: parsed.total,
            total_cheapest: (parsed.total || 0) - totalSavings,
            saved: totalSavings, items: itemsWithSavings,
          }),
        });
      }
    } catch (e) { console.error('Save error:', e); }

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
