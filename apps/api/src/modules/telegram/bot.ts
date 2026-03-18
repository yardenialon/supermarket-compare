import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const API = 'https://supermarket-compare-production.up.railway.app/api';

// Store conversation history per user
const userHistories = new Map<string, {role: string, content: string}[]>();
const userBaskets = new Map<string, {productId: number, name: string, qty: number}[]>();

const SYSTEM_PROMPT = `You are SAVY, an advanced smart shopping assistant for the Israeli supermarket market. Always respond in Hebrew. Be friendly, helpful and concise. Use emojis.

You can help users with:
1. Building a shopping list and comparing prices across supermarket chains
2. Finding deals and promotions
3. Checking product availability
4. Building a basket and sending a link to savy.co.il

When a user adds items to their basket, confirm what was added.
When comparing prices, show: store name + city - total price - items found/total.
Always offer to find the cheapest store for their basket.
Format nicely for Telegram - no markdown tables, use simple lines.`;

async function searchProduct(name: string): Promise<{productId: number, name: string} | null> {
  try {
    const res = await fetch(API + '/search?q=' + encodeURIComponent(name) + '&limit=3');
    const data = await res.json();
    const results = data?.results || data || [];
    const exact = results.find((r: any) => r.name?.toLowerCase().includes(name.toLowerCase()));
    const product = exact || results[0];
    if (product) return { productId: product.id || product.productId, name: product.name };
    return null;
  } catch { return null; }
}

async function compareBasket(items: {productId: number, name: string, qty: number}[], lat?: number, lng?: number): Promise<string> {
  try {
    const body: any = {
      items: items.map(i => ({ productId: i.productId, qty: i.qty || 1 })),
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

async function getDeals(): Promise<string> {
  try {
    const res = await fetch(API + '/deals?limit=15');
    const data = await res.json();
    return JSON.stringify(data?.deals?.slice(0, 15) || data?.slice(0, 15) || []);
  } catch { return '[]'; }
}

function buildSavyLink(items: {productId: number, name: string}[]): string {
  if (items.length === 0) return 'https://savy.co.il';
  const ids = items.map(i => i.productId).join(',');
  return 'https://savy.co.il?products=' + ids;
}

export async function handleTelegramMessage(chatId: string, text: string, lat?: number, lng?: number): Promise<string> {
  try {
    // Get or create conversation history
    if (!userHistories.has(chatId)) userHistories.set(chatId, []);
    const history = userHistories.get(chatId)!;
    const basket = userBaskets.get(chatId) || [];

    // Build context message
    const basketInfo = basket.length > 0
      ? 'Current user basket: ' + JSON.stringify(basket.map(i => i.name))
      : 'User basket is empty';

    const locationInfo = lat && lng ? 'User location: lat=' + lat + ' lng=' + lng : 'No location shared';

    // Classify intent
    const classifyRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Classify: SHOPPING_LIST, ADD_TO_BASKET, COMPARE_BASKET, DEALS, AVAILABILITY, CLEAR_BASKET, OTHER. One word only. Message: "' + text + '"' }]
    });
    const intent = classifyRes.content[0].type === 'text' ? classifyRes.content[0].text.trim().toUpperCase() : 'OTHER';
    console.log('Intent:', intent, 'ChatId:', chatId);

    let contextData = '';

    if (intent === 'DEALS') {
      contextData = 'Deals data: ' + await getDeals();
    }
    else if (intent === 'ADD_TO_BASKET' || intent === 'SHOPPING_LIST') {
      // Parse items
      const parseRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: 'Extract product names from: "' + text + '". Return JSON array of strings only.' }]
      });
      let itemNames: string[] = [];
      try {
        const parsed = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '[]';
        itemNames = JSON.parse(parsed.replace(/```json|```/g, '').trim());
      } catch { itemNames = [text]; }

      for (const name of itemNames.slice(0, 10)) {
        const product = await searchProduct(name);
        if (product) {
          const existing = basket.find(i => i.productId === product.productId);
          if (!existing) basket.push({ ...product, qty: 1 });
        }
      }
      userBaskets.set(chatId, basket);
      contextData = 'Updated basket: ' + JSON.stringify(basket.map(i => i.name)) + '. Savy link: ' + buildSavyLink(basket);
    }
    else if (intent === 'COMPARE_BASKET') {
      if (basket.length > 0) {
        contextData = 'Basket comparison: ' + await compareBasket(basket, lat, lng) + '. Savy link: ' + buildSavyLink(basket);
      } else {
        contextData = 'Basket is empty, ask user to add items first';
      }
    }
    else if (intent === 'CLEAR_BASKET') {
      userBaskets.set(chatId, []);
      contextData = 'Basket cleared successfully';
    }

    // Add user message to history
    history.push({ role: 'user', content: text });
    if (history.length > 10) history.splice(0, 2); // Keep last 10 messages

    // Build messages with history
    const messages = [
      { role: 'user', content: 'Context: ' + basketInfo + '. ' + locationInfo + '. Intent: ' + intent + '. ' + contextData },
      { role: 'assistant', content: 'understood' },
      ...history
    ];

    const finalRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages as any
    });

    const response = finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי לעבד את הבקשה.';

    // Add assistant response to history
    history.push({ role: 'assistant', content: response });
    userHistories.set(chatId, history);

    return response;
  } catch (e) {
    console.error('Telegram bot error:', e);
    return 'מצטער, אירעה שגיאה. נסה שוב בעוד רגע';
  }
}
