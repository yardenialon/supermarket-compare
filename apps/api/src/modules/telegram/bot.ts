import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const API = 'https://supermarket-compare-production.up.railway.app/api';

const SYSTEM_PROMPT = 'You are SAVY, a smart shopping assistant for the Israeli market. Always respond in Hebrew. Be concise and use emojis. Format nicely for Telegram - no markdown tables, use simple lines.';

async function searchProduct(name: string): Promise<{productId: number, name: string} | null> {
  try {
    const res = await fetch(API + '/search?q=' + encodeURIComponent(name) + '&limit=1');
    const data = await res.json();
    const product = data?.results?.[0] || data?.[0];
    if (product) return { productId: product.id || product.productId, name: product.name };
    return null;
  } catch { return null; }
}

async function compareBasket(items: {productId: number, name: string}[], lat?: number, lng?: number): Promise<string> {
  try {
    const body: any = {
      items: items.map(i => ({ productId: i.productId, qty: 1 })),
      topN: 5
    };
    if (lat && lng) { body.lat = lat; body.lng = lng; body.radiusKm = 10; }

    const res = await fetch(API + '/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return JSON.stringify(data.bestStoreCandidates?.slice(0, 5) || []);
  } catch(e) { return '[]'; }
}

export async function handleTelegramMessage(text: string, lat?: number, lng?: number): Promise<string> {
  try {
    const parseRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: 'Parse this shopping list into product names only, return JSON array of strings only, no explanation: "' + text + '"' }]
    });

    let itemNames: string[] = [];
    try {
      const parsed = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '[]';
      itemNames = JSON.parse(parsed.replace(/```json|```/g, '').trim());
    } catch { itemNames = [text]; }

    // Search each product
    const foundItems: {productId: number, name: string}[] = [];
    const notFound: string[] = [];
    for (const name of itemNames.slice(0, 10)) {
      const product = await searchProduct(name);
      if (product) foundItems.push(product);
      else notFound.push(name);
    }

    const basketData = foundItems.length > 0 ? await compareBasket(foundItems, lat, lng) : '[]';

    const finalRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Shopping list: "' + text + '"\nFound products (' + foundItems.length + '/' + itemNames.length + '): ' + JSON.stringify(foundItems.map(i => i.name)) + '\nNot found: ' + JSON.stringify(notFound) + '\nBest stores comparison: ' + basketData + '\n\nFormat in Hebrew:\n1. Found items list\n2. Store comparison: store name + city - total price - items found/total\n3. Best recommendation\n4. Link: https://savy.co.il' }]
    });

    return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי לעבד את הבקשה.';
  } catch (e) {
    console.error('Telegram bot error:', e);
    return 'מצטער, אירעה שגיאה. נסה שוב בעוד רגע';
  }
}
