import Anthropic from '@anthropic-ai/sdk';
import { query } from '../../db.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `You are SAVY, a smart shopping assistant for the Israeli market. Always respond in Hebrew. Help users find the cheapest grocery basket. Be concise and use emojis moderately.`;

async function getBasketComparison(items: string[]): Promise<string> {
  const results: Record<string, number> = {};
  for (const item of items.slice(0, 8)) {
    try {
      const res = await query(`
        SELECT rc.name_he, MIN(sp.price) as min_price
        FROM product p
        JOIN store_price sp ON sp.product_id = p.id
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE p.name ILIKE $1
        GROUP BY rc.name_he
        ORDER BY min_price ASC
        LIMIT 5
      `, [`%${item}%`]);
      for (const row of res.rows) {
        results[row.name_he] = (results[row.name_he] || 0) + parseFloat(row.min_price);
      }
    } catch {}
  }
  return JSON.stringify(
    Object.entries(results)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([chain, total]) => ({ chain, total: Math.round(total) }))
  );
}

export async function handleTelegramMessage(text: string): Promise<string> {
  try {
    const parseRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: `Parse this shopping list into product names only, return JSON array of strings only, no explanation: "${text}"` }]
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
      messages: [{ role: 'user', content: `User request: "${text}"\nItems found: ${JSON.stringify(items)}\nPrices by chain: ${basketData}\n\nGive a friendly helpful response in Hebrew.` }]
    });

    return finalRes.content[0].type === 'text' ? finalRes.content[0].text : 'מצטער, לא הצלחתי לעבד את הבקשה.';
  } catch (e) {
    console.error('Telegram bot error:', e);
    return 'מצטער, אירעה שגיאה. נסה שוב בעוד רגע';
  }
}

