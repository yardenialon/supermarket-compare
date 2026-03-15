import { query } from '../../db.js';
export async function storeRoutes(app) {
  app.get('/stores', async () => { const r = await query('SELECT s.id, s.name, s.city, rc.name as "chainName" FROM store s JOIN retailer_chain rc ON rc.id=s.chain_id ORDER BY rc.name LIMIT 50'); return { stores: r.rows }; });
  app.get('/chains', async () => { const r = await query('SELECT rc.id, rc.name, rc.name_he as "nameHe", COUNT(DISTINCT s.id)::int as "storeCount" FROM retailer_chain rc LEFT JOIN store s ON s.chain_id=rc.id WHERE rc.is_active=true GROUP BY rc.id ORDER BY rc.name'); return { chains: r.rows }; });
  // קריאת מדד מחירים מ-cache
  app.get('/price-index', async (req: any, reply: any) => {
    const result = await query('SELECT data, computed_at FROM price_index_cache ORDER BY computed_at DESC LIMIT 1');
    if (!result.rows[0]) return reply.code(404).send({ error: 'No data yet' });
    return { ...result.rows[0].data, computedAt: result.rows[0].computed_at };
  });

  // חישוב ושמירה — מופעל מ-cron או ידנית עם admin key
  app.post('/price-index/compute', async (req: any, reply: any) => {
    if (req.headers['x-admin-key'] !== (process.env.ADMIN_PASSWORD || 'savy-admin-2024')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    try {
      const result = await query(`
        SELECT 
          rc.name as chain,
          rc.name_he as "chainHe",
          COUNT(DISTINCT sp.product_id)::int as "productCount",
          ROUND(AVG(sp.price)::numeric, 2) as "avgPrice"
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE sp.product_id IN (
          SELECT id FROM product 
          WHERE store_count > 200 
          ORDER BY store_count DESC 
          LIMIT 30
        )
        AND rc.is_active = true
        AND sp.price > 0
        GROUP BY rc.id, rc.name, rc.name_he
        HAVING COUNT(DISTINCT sp.product_id) >= 10
        ORDER BY "avgPrice" ASC
      `);

      const rows = result.rows as any[];
      if (!rows.length) return reply.code(500).send({ error: 'No data' });

      const minAvg = Math.min(...rows.map(r => Number(r.avgPrice)));
      const chains = rows.map(r => ({
        chain: r.chain,
        chainHe: r.chainHe,
        avgPrice: Number(r.avgPrice),
        productCount: r.productCount,
        index: Math.round((Number(r.avgPrice) / minAvg) * 100),
      }));

      const data = { chains, productCount: 30 };
      await query('INSERT INTO price_index_cache (data) VALUES ($1)', [JSON.stringify(data)]);
      await query('DELETE FROM price_index_cache WHERE id NOT IN (SELECT id FROM price_index_cache ORDER BY computed_at DESC LIMIT 5)');

      return { success: true, chains: chains.length };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}