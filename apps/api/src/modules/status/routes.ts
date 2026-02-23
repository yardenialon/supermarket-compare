import { FastifyInstance } from 'fastify';
import { query } from '../../db.js';

export async function statusRoutes(app: FastifyInstance) {
  app.get('/api/status', async () => {
    const { rows } = await query(`
      SELECT rc.name,
             COUNT(DISTINCT s.id)::int as stores,
             COUNT(sp.id)::int as prices,
             COUNT(DISTINCT sp.product_id)::int as products,
             MAX(sp.updated_at) as last_update
      FROM retailer_chain rc
      JOIN store s ON s.chain_id = rc.id
      JOIN store_price sp ON sp.store_id = s.id
      GROUP BY rc.name
      ORDER BY COUNT(sp.id) DESC
    `);
    const chains = rows.map(r => ({ name: r.name, stores: r.stores, products: r.products, prices: r.prices, lastUpdate: r.last_update }));
    const totals = { stores: chains.reduce((s, c) => s + c.stores, 0), products: chains.reduce((s, c) => s + c.products, 0), prices: chains.reduce((s, c) => s + c.prices, 0) };
    return { chains, totals, lastUpdate: chains[0]?.lastUpdate || null };
  });
}
