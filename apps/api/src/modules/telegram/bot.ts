import Anthropic from '@anthropic-ai/sdk';
import { query } from '../../db.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = 'You are SAVY, a smart shopping assistant for the Israeli market. Always respond in Hebrew. Be concise and use emojis. Show total basket price per chain and how many items were found out of total. Format nicely for Telegram without markdown tables - use simple text.';

async function getBasketComparison(items: string[]): Promise<string> {
  const chainTotals: Record<string, { total: number; found: number }> = {};
  const totalItems = items.length;

  for (const item of items.slice(0, 10)) {
    try {
      const res = await query(
        "SELECT rc.name_he, AVG(sp.price) as avg_price FROM product p JOIN store_price sp ON sp.product_id = p.id JOIN store s ON s.id = sp.store_id JOIN retailer_chain rc ON rc.id = s.chain_id WHERE p.name ILIKE $1 AND sp.price > 1 GROUP BY rc.name_he ORDER BY avg_price ASC LIMIT 8",
        ['%' + item + '%']
      );
      for (const row of res.rows) {
        if (!chainTotals[row.name_he]) chainTotals[row.name_he] = { total: 0, found: 0 };
        chainTotals[row.name_he].total += parseFloat(row.avg_price);
        chainTotals[row.name_he].found += 1;
      }
    } catch(e) { console.error('Query error:', e); }
  }

  const sorted = Object.entries(chainTotals)
    .filter(([_, v]) => v.found >= Math.ceil(totalItems * 0.4))
    .sort((a, b) => a[1].total - b[1].total)
    .slice(0, 5)
    .map(([chain, v]) => ({ chain, total: Math.round(v.total), found: v.found, total_items: totalItems }));

  return JSON.stringify(sorted);
}

export async function handleTelegramMessage(text: string): Promise<string> {
  try {
    const parseRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: 'Parse this shopping list into product names only, return JSON array of strings only, no explanation: "' + text + '"' }]
    });

    let items: string[] = [];
    try {
      const parsed = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '[]';
      items = JSON.parse(parsed.replace(/```json|```/g, '').trim());
    } catch { items = [text]; }

    const basketData = items.length > 0 ? await getBasketComparison(items) : '[]';

    const finalRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Shopping list: "' + text + '"\nItems: ' + JSON.stringify(items) + '\nPrices by chain (avg price NIS, items found/total): ' + basketData + '\n\nFormat response in Hebrew:\n1. List items with emojis\n2. Price comparison (no markdown tables, use simple lines): chain - total price - items found/total\n3. Best recommendation\n4. Link: https://savy.co.il\n\nNote: prices are averages across stores, should be realistic (milk ~6 NIS, bread ~10 NIS etc)' }]
    });

    return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי לעבד את הבקשה.';
  } catch (e) {
    console.error('Telegram bot error:', e);
    return 'מצטער, אירעה שגיאה. נסה שוב בעוד רגע';
  }
}
