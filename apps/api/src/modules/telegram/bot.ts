import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const API = 'https://supermarket-compare-production.up.railway.app/api';

const SYSTEM_PROMPT = 'You are SAVY, a smart shopping assistant for the Israeli market. Always respond in Hebrew. Be concise and use emojis. Format nicely for Telegram - no markdown tables, use simple lines. When showing store comparison use: store name + city - total price - items found/total.';

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

async function compareBasket(items: {productId: number, name: string}[], lat?: number, lng?: number): Promise<string> {
  try {
    const body: any = { items: items.map(i => ({ productId: i.productId, qty: 1 })), topN: 5 };
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
    const res = await fetch(API + '/deals?limit=10');
    const data = await res.json();
    return JSON.stringify(data?.deals?.slice(0, 10) || data?.slice(0, 10) || []);
  } catch { return '[]'; }
}

export async function handleTelegramMessage(text: string, lat?: number, lng?: number): Promise<string> {
  try {
    const classifyRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: 'Classify this message into one of: SHOPPING_LIST, DEALS_REQUEST, QUESTION, OTHER. Return only the category word. Message: "' + text + '"' }]
    });

    const category = classifyRes.content[0].type === 'text' ? classifyRes.content[0].text.trim() : 'SHOPPING_LIST';
    console.log('Category:', category);

    if (category === 'DEALS_REQUEST') {
      const deals = await getDeals();
      const finalRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'User asked about deals: "' + text + '"\nAvailable deals: ' + deals + '\n\nShow relevant deals in Hebrew with emojis. Link: https://savy.co.il/deals' }]
      });
      return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי למצוא מבצעים.';
    }

    if (category === 'QUESTION' || category === 'OTHER') {
      const finalRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'User message: "' + text + '"\n\nAnswer helpfully in Hebrew. If they want to search for products, ask them to send a shopping list. If they want deals, mention https://savy.co.il/deals' }]
      });
      return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'שלח לי רשימת קניות ואמצא לך את הזול ביותר!';
    }

    const parseRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: 'Parse this shopping list into specific product names only, return JSON array of strings only, no explanation: "' + text + '"' }]
    });

    let itemNames: string[] = [];
    try {
      const parsed = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '[]';
      itemNames = JSON.parse(parsed.replace(/```json|```/g, '').trim());
    } catch { itemNames = [text]; }

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
      messages: [{ role: 'user', content: 'Shopping list: "' + text + '"\nFound (' + foundItems.length + '/' + itemNames.length + '): ' + JSON.stringify(foundItems.map(i => i.name)) + '\nNot found: ' + JSON.stringify(notFound) + '\nBest stores: ' + basketData + '\n\nFormat in Hebrew:\n1. Found items\n2. Store comparison: store+city - price - items found/total\n3. Best recommendation with savings\n4. Link: https://savy.co.il' }]
    });

    return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי לעבד את הבקשה.';
  } catch (e) {
    console.error('Telegram bot error:', e);
    return 'מצטער, אירעה שגיאה. נסה שוב בעוד רגע';
  }
}
