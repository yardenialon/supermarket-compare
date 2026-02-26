import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API = 'https://supermarket-compare-production.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const { parts, base64, mimeType, lat, lng } = await req.json();
    const images: string[] = parts || (base64 ? [base64] : []);
    if (!images.length) return NextResponse.json({ error: 'חסרות תמונות' }, { status: 400 });

    const imageBlocks = images.map(b64 => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 }
    }));

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: `אלו ${images.length} תמונות של קבלה מסופרמרקט ישראלי. חלץ את כל הפרטים ללא כפילויות.\nהחזר JSON בלבד:\n{\n  "store": "שם הרשת",\n  "branch": "שם הסניף",\n  "receipt_number": "מספר קבלה",\n  "date": "תאריך",\n  "total": 123.45,\n  "items": [\n    { "name": "שם המוצר", "barcode": "1234567890123", "price": 12.90, "qty": 1, "subtotal": 12.90 }\n  ]\n}\nחוקים: ברקוד לא קיים=null, כמות ברירת מחדל=1, הנחות חבר למחיר הסופי.\nאם לא ניתן לקרוא: {"error": "לא ניתן לקרוא"}` }
        ],
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    let parsed;
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { return NextResponse.json({ error: 'לא הצלחנו לנתח את הקבלה' }, { status: 422 }); }
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    // חיפוש כל מוצר + שמירת productId
    const itemsWithSavings = await Promise.all(
      (parsed.items || []).map(async (item: any) => {
        try {
          // חפש לפי ברקוד בלבד - מדויק יותר
          if (!item.barcode) return { ...item, savings: 0 };
          const res = await fetch(`${API}/api/search?q=${encodeURIComponent(item.barcode)}&limit=1`);
          const data = await res.json();
          const match = data.results?.[0];
          if (!match) return { ...item, savings: 0 };
          if (match.minPrice && match.minPrice < item.price)
            return { ...item, productId: match.id, minPrice: match.minPrice, savings: +(item.price - match.minPrice).toFixed(2) };
          return { ...item, productId: match.id, minPrice: match.minPrice || null, savings: 0 };
        } catch { return { ...item, savings: 0 }; }
      })
    );

    const totalSavings = itemsWithSavings.reduce((s, i) => s + (i.savings || 0), 0);

    // השוואת סלים — רק למוצרים שנמצאו ב-DB
    const listItems = itemsWithSavings
      .filter(i => i.productId)
      .map(i => ({ productId: i.productId, qty: i.qty || 1 }));

    let bestStores: any[] = [];
    if (listItems.length > 0) {
      try {
        const listRes = await fetch(`${API}/api/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: listItems, lat, lng }),
        });
        const listData = await listRes.json();
        bestStores = (listData.bestStoreCandidates || []).slice(0, 3);
      } catch {}
    }

    return NextResponse.json({
      store: parsed.store,
      branch: parsed.branch,
      receipt_number: parsed.receipt_number,
      date: parsed.date,
      total: parsed.total,
      items: itemsWithSavings,
      savings: +totalSavings.toFixed(2),
      bestStores,
    });

  } catch (e: any) {
    console.error('Receipt error:', e);
    return NextResponse.json({ error: e.message || 'שגיאה' }, { status: 500 });
  }
}
