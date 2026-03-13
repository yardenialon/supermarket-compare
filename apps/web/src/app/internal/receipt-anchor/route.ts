import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: `זוהי תמונה של קבלה מסופרמרקט.
החזר JSON בלבד:
{
  "hasTotal": true/false,
  "lastItem": "שם המוצר האחרון שמופיע בתמונה (לא סה\"כ)",
  "done": true/false
}
- hasTotal: האם יש שורת סה"כ/total בתמונה?
- done: true אם יש סה"כ
- lastItem: המוצר האחרון לפני סה"כ (או המוצר האחרון בתמונה)` }
      ]
    }]
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({ hasTotal: false, lastItem: null, done: false });
  }
}
