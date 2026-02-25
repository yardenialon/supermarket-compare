import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://supermarket-compare-production.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json();
    if (!base64) return NextResponse.json({ error: 'חסרה תמונה' }, { status: 400 });

    // 1. Claude Vision מזהה מוצרים ומחירים
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `זוהי קבלה מסופרמרקט ישראלי. אנא חלץ את רשימת המוצרים והמחירים.
החזר JSON בלבד, ללא טקסט נוסף, בפורמט הזה:
{
  "store": "שם הרשת",
  "total": 123.45,
  "items": [
    { "name": "שם המוצר", "price": 12.90, "qty": 1 }
  ]
}
אם לא ניתן לקרוא את הקבלה, החזר: {"error": "לא ניתן לקרוא את הקבלה"}`
          }
        ],
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'לא הצלחנו לנתח את הקבלה' }, { status: 422 });
    }

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    // 2. לכל מוצר — חפש מחיר זול יותר
    const itemsWithSavings = await Promise.all(
      (parsed.items || []).map(async (item: any) => {
        try {
          const res = await fetch(`${API}/api/search?q=${encodeURIComponent(item.name)}&limit=1`);
          const data = await res.json();
          const match = data.results?.[0];
          if (match && match.minPrice && match.minPrice < item.price) {
            return { ...item, minPrice: match.minPrice, savings: +(item.price - match.minPrice).toFixed(2) };
          }
          return { ...item, minPrice: match?.minPrice || null, savings: 0 };
        } catch {
          return { ...item, savings: 0 };
        }
      })
    );

    const totalSavings = itemsWithSavings.reduce((s, i) => s + (i.savings || 0), 0);

    return NextResponse.json({
      store: parsed.store,
      total: parsed.total,
      items: itemsWithSavings,
      savings: +totalSavings.toFixed(2),
    });

  } catch (e: any) {
    console.error('Receipt error:', e);
    return NextResponse.json({ error: e.message || 'שגיאה בעיבוד הקבלה' }, { status: 500 });
  }
}
