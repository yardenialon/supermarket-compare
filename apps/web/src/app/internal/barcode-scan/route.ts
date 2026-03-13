import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: 'זהה את הברקוד בתמונה. החזר JSON בלבד: {"barcode": "1234567890123"} או {"barcode": null} אם אין ברקוד.' }
      ]
    }]
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const match = text.match(/\{[\s\S]*\}/);
    return NextResponse.json(match ? JSON.parse(match[0]) : { barcode: null });
  } catch {
    return NextResponse.json({ barcode: null });
  }
}
