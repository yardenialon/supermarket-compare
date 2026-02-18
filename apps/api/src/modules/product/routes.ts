import { query } from '../../db.js';
export async function productRoutes(app) {
  app.get('/product/:id/prices', async (req) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const prices = await query('SELECT sp.price, sp.is_promo as "isPromo", s.id as "storeId", s.name as "storeName", s.city, rc.name as "chainName" FROM store_price sp JOIN store s ON s.id=sp.store_id JOIN retailer_chain rc ON rc.id=s.chain_id WHERE sp.product_id=$1 ORDER BY sp.price LIMIT $2', [id, limit]);
    return { productId: +id, prices: prices.rows.map(r => ({ ...r, price: +r.price })) };
  });
}
