import { FastifyInstance } from 'fastify';
import { query } from '../../db.js';

export async function receiptHistoryRoutes(app: FastifyInstance) {
  // היסטוריית קבלות
  app.get('/receipt/history', async (req, reply) => {
    const token = req.cookies?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });
    const sessionRes = await query('SELECT user_id FROM session WHERE token=$1 AND expires_at > NOW()', [token]);
    if (!sessionRes.rows.length) return reply.code(401).send({ error: 'session פג תוקף' });
    const userId = (sessionRes.rows[0] as any).user_id;

    const res = await query(`
      SELECT id, scanned_at, store_name, total_paid, total_cheapest, saved, items
      FROM receipt_scan
      WHERE user_id = $1
      ORDER BY scanned_at DESC
      LIMIT 50
    `, [userId]);

    return { receipts: res.rows };
  });

  // ניתוח חיסכון לפי קטגוריה
  app.get('/receipt/insights', async (req, reply) => {
    const token = req.cookies?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });
    const sessionRes = await query('SELECT user_id FROM session WHERE token=$1 AND expires_at > NOW()', [token]);
    if (!sessionRes.rows.length) return reply.code(401).send({ error: 'session פג תוקף' });
    const userId = (sessionRes.rows[0] as any).user_id;

    // שלוף את כל הפריטים מהקבלות האחרונות
    const res = await query(`
      SELECT items, store_name, scanned_at
      FROM receipt_scan
      WHERE user_id = $1
      ORDER BY scanned_at DESC
      LIMIT 20
    `, [userId]);

    if (!res.rows.length) return { insights: [], totalScans: 0 };

    // אסוף את כל הפריטים עם בקודים
    const barcodes: string[] = [];
    const itemMap: Record<string, { name: string, price: number, count: number }> = {};

    for (const row of res.rows) {
      const items = row.items as any[];
      for (const item of items) {
        if (item.barcode) {
          barcodes.push(item.barcode);
          if (!itemMap[item.barcode]) {
            itemMap[item.barcode] = { name: item.name, price: 0, count: 0 };
          }
          itemMap[item.barcode].price += item.price;
          itemMap[item.barcode].count += 1;
        }
      }
    }

    if (!barcodes.length) return { insights: [], totalScans: res.rows.length };

    // מצא מחיר מינימום לכל ברקוד לפי רשת
    const uniqueBarcodes = [...new Set(barcodes)];
    const pricesRes = await query(`
      SELECT 
        p.barcode,
        p.name,
        p.category,
        s.retailer_chain,
        MIN(pi.price) as min_price
      FROM product p
      JOIN price_item pi ON pi.product_id = p.id
      JOIN store s ON s.id = pi.store_id
      WHERE p.barcode = ANY($1)
      AND pi.price > 0
      GROUP BY p.barcode, p.name, p.category, s.retailer_chain
      ORDER BY p.barcode, min_price
    `, [uniqueBarcodes]);

    // קבץ לפי קטגוריה ורשת
    const categoryChain: Record<string, Record<string, { saving: number, items: string[] }>> = {};

    for (const row of pricesRes.rows as any[]) {
      const { barcode, category, retailer_chain, min_price } = row;
      const userItem = itemMap[barcode];
      if (!userItem) continue;
      const cat = category || 'כללי';
      if (!categoryChain[cat]) categoryChain[cat] = {};
      if (!categoryChain[cat][retailer_chain]) categoryChain[cat][retailer_chain] = { saving: 0, items: [] };
      const avgUserPrice = userItem.price / userItem.count;
      const potentialSaving = (avgUserPrice - Number(min_price)) * userItem.count;
      if (potentialSaving > 0) {
        categoryChain[cat][retailer_chain].saving += potentialSaving;
        categoryChain[cat][retailer_chain].items.push(userItem.name);
      }
    }

    // בנה המלצות
    const insights: any[] = [];
    for (const [category, chains] of Object.entries(categoryChain)) {
      const bestChain = Object.entries(chains).sort((a, b) => b[1].saving - a[1].saving)[0];
      if (bestChain && bestChain[1].saving > 2) {
        insights.push({
          category,
          chain: bestChain[0],
          potentialSaving: Math.round(bestChain[1].saving * 10) / 10,
          items: bestChain[1].items.slice(0, 3)
        });
      }
    }

    insights.sort((a, b) => b.potentialSaving - a.potentialSaving);

    return { insights: insights.slice(0, 10), totalScans: res.rows.length };
  });
}

export async function receiptSaveRoute(app: FastifyInstance) {
  app.post('/receipt/save', async (req: any, reply: any) => {
    const token = (req.cookies as any)?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });
    const sessionRes = await query('SELECT user_id FROM session WHERE token=$1 AND expires_at > NOW()', [token]);
    if (!sessionRes.rows.length) return reply.code(401).send({ error: 'session פג תוקף' });
    const userId = (sessionRes.rows[0] as any).user_id;
    const { store_name, total_paid, total_cheapest, saved, items } = req.body as any;
    await query(
      `INSERT INTO receipt_scan (user_id, store_name, total_paid, total_cheapest, saved, items)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, store_name, total_paid, total_cheapest, saved, JSON.stringify(items)]
    );
    return { success: true };
  });
}
