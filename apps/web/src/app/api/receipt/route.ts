import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API = 'https://supermarket-compare-production.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();
    if (!base64) return NextResponse.json({ error: 'חסרה תמונה' }, { status: 400 });

    const isPdf = mimeType === 'application/pdf';
    const source = isPdf
      ? { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 }
      : { type: 'base64' as const, media_type: (mimeType || 'image/jpeg') as any, data: base64 };

    const contentBlock = isPdf
      ? { type: 'document' as const, source }
      : { type: 'image' as const, source };

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          contentBlock as any,
          { type: 'text', text: `זוהי קבלה מסופרמרקט ישראלי. חלץ את כל הפרטים.\nהחזר JSON בלבד:\n{\n  "store": "שם הרשת",\n  "branch": "שם הסניף",\n  "receipt_number": "מספר קבלה",\n  "date": "תאריך",\n  "total": 123.45,\n  "items": [\n    { "name": "שם המוצר", "barcode": "1234567890123", "price": 12.90, "qty": 1, "subtotal": 12.90 }\n  ]\n}\nחוקים: ברקוד לא קיים=null, כמות ברירת מחדל=1, הנחות חבר למחיר הסופי.\nאם לא ניתן לקרוא: {"error": "לא ניתן לקרוא את הקבלה"}` }
        ],
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    let parsed;
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { return NextResponse.json({ error: 'לא הצלחנו לנתח את הקבלה' }, { status: 422 }); }
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    const itemsWithSavings = await Promise.all(
      (parsed.items || []).map(async (item: any) => {
        try {
          const q = item.barcode || item.name;
          const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}&limit=1`);
          const data = await res.json();
          const match = data.results?.[0];
          if (match && match.minPrice && match.minPrice < item.price)
            return { ...item, minPrice: match.minPrice, savings: +(item.price - match.minPrice).toFixed(2) };
          return { ...item, minPrice: match?.minPrice || null, savings: 0 };
        } catch { return { ...item, savings: 0 }; }
      })
    );

    const totalSavings = itemsWithSavings.reduce((s, i) => s + (i.savings || 0), 0);
    return NextResponse.json({ store: parsed.store, branch: parsed.branch, receipt_number: parsed.receipt_number, date: parsed.date, total: parsed.total, items: itemsWithSavings, savings: +totalSavings.toFixed(2) });

  } catch (e: any) {
    console.error('Receipt error:', e);
    return NextResponse.json({ error: e.message || 'שגיאה' }, { status: 500 });
  }
}
