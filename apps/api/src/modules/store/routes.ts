import { query } from '../../db.js';
export async function storeRoutes(app) {
  app.get('/stores', async () => { const r = await query('SELECT s.id, s.name, s.city, rc.name as "chainName" FROM store s JOIN retailer_chain rc ON rc.id=s.chain_id ORDER BY rc.name LIMIT 50'); return { stores: r.rows }; });
  // GET /chain/:name — פרטי רשת עם סניפים
  app.get('/chain/:name', async (req: any, reply: any) => {
    const name = decodeURIComponent(req.params.name);
    const chain = await query(
      'SELECT id, name, name_he as "nameHe" FROM retailer_chain WHERE name = $1 OR name_he = $1',
      [name]
    );
    if (!chain.rows[0]) return reply.code(404).send({ error: 'Chain not found' });
    const chainId = chain.rows[0].id;

    const stores = await query(`
      SELECT id, name, city, address, lat, lng, subchain_name as "subchainName"
      FROM store
      WHERE chain_id = $1 AND lat IS NOT NULL
      ORDER BY city, name
      LIMIT 150
    `, [chainId]);

    const deals = await query(`
      SELECT DISTINCT ON (pr.description)
        pr.description, pr.discounted_price as "discountedPrice", pr.discount_rate as "discountRate",
        pr.end_date as "endDate",
        COALESCE(p.name, pr.description) as "productName",
        s.name as "storeName", s.city
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      LEFT JOIN promotion_item pi ON pi.promotion_id = pr.id
      LEFT JOIN product p ON p.id = pi.product_id
      WHERE s.chain_id = $1
        AND (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.discounted_price > 20
      ORDER BY pr.description, pr.discounted_price DESC
      LIMIT 20
    `, [chainId]);

    const priceIndex = await query(`
      SELECT data FROM price_index_cache WHERE type='basket' ORDER BY computed_at DESC LIMIT 1
    `);
    let chainIndex = null;
    if (priceIndex.rows[0]) {
      const indexData = priceIndex.rows[0].data;
      const chainData = indexData.chains?.find((c: any) => c.chain === chain.rows[0].name);
      if (chainData) chainIndex = chainData.index;
    }

    return {
      chain: { ...chain.rows[0], storeCount: stores.rows.length, priceIndex: chainIndex },
      stores: stores.rows,
      hotDeals: deals.rows,
    };
  });

  app.get('/chains', async () => { const r = await query('SELECT rc.id, rc.name, rc.name_he as "nameHe", COUNT(DISTINCT s.id)::int as "storeCount" FROM retailer_chain rc LEFT JOIN store s ON s.chain_id=rc.id WHERE rc.is_active=true GROUP BY rc.id ORDER BY rc.name'); return { chains: r.rows }; });
  // קריאת מדד מחירים מ-cache — basket קודם, אחר כך auto
  app.get('/price-index', async (req: any, reply: any) => {
    const result = await query("SELECT data, computed_at FROM price_index_cache WHERE type='basket' ORDER BY computed_at DESC LIMIT 1");
    if (!result.rows[0]) {
      const fallback = await query('SELECT data, computed_at FROM price_index_cache ORDER BY computed_at DESC LIMIT 1');
      if (!fallback.rows[0]) return reply.code(404).send({ error: 'No data yet' });
      return { ...fallback.rows[0].data, computedAt: fallback.rows[0].computed_at };
    }
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
  // GET /chain/:name/best-deals — המוצרים הזולים ביותר ברשת ביחס לממוצע השוק
  app.get('/chain/:name/best-deals', async (req: any, reply: any) => {
    const name = decodeURIComponent(req.params.name);
    const chain = await query(
      'SELECT id FROM retailer_chain WHERE name = $1 OR name_he = $1',
      [name]
    );
    if (!chain.rows[0]) return reply.code(404).send({ error: 'Chain not found' });
    const chainId = chain.rows[0].id;

    const result = await query(`
      SELECT 
        p.id, p.name, p.image_url as "imageUrl", p.category,
        MIN(sp.price) as "chainPrice",
        AVG(all_prices.median_price) as "marketAvg",
        ROUND(((AVG(all_prices.median_price) - MIN(sp.price)) / AVG(all_prices.median_price) * 100)::numeric, 1) as "savingPct"
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN product p ON p.id = sp.product_id
      JOIN (
        SELECT product_id, 
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price
        FROM store_price
        WHERE price > 0
        GROUP BY product_id
        HAVING COUNT(*) >= 10
      ) all_prices ON all_prices.product_id = p.id
      WHERE s.chain_id = $1
        AND sp.price > 0
        AND p.store_count > 200
        AND p.min_price > 2
      GROUP BY p.id, p.name, p.image_url, p.category
      HAVING AVG(all_prices.median_price) > 2
        AND MIN(sp.price) < AVG(all_prices.median_price) * 0.85
        AND MIN(sp.price) > 1
      ORDER BY "savingPct" DESC
      LIMIT 12
    `, [chainId]);

    return {
      products: result.rows.map((r: any) => ({
        ...r,
        chainPrice: Number(r.chainPrice),
        marketAvg: Number(Number(r.marketAvg).toFixed(2)),
        savingPct: Number(r.savingPct),
      }))
    };
  });

  // GET /savy-basket — רשימת המוצרים במדד
  app.get('/savy-basket', async (req: any) => {
    const result = await query(`
      SELECT sb.id, sb.product_id as "productId", p.name, p.barcode, p.image_url as "imageUrl",
             p.store_count as "storeCount", p.min_price as "minPrice", p.category
      FROM savy_basket sb
      JOIN product p ON p.id = sb.product_id
      ORDER BY p.category, p.name
    `);
    return { products: result.rows };
  });

  // GET /savy-basket/missing — אילו מוצרים חסרים לכל רשת
  app.get('/savy-basket/missing', async () => {
    const basket = await query('SELECT sb.product_id, p.name FROM savy_basket sb JOIN product p ON p.id = sb.product_id');
    if (!basket.rows.length) return { missing: {} };
    const productIds = basket.rows.map((r: any) => r.product_id);
    const names: Record<number, string> = {};
    basket.rows.forEach((r: any) => { names[r.product_id] = r.name; });

    const result = await query(`
      SELECT rc.name as chain, rc.name_he as "chainHe", sp.product_id
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE sp.product_id = ANY($1)
        AND rc.is_active = true
        AND sp.price > 0
        AND s.city NOT IN ('אילת', 'Eilat')
        AND s.name NOT ILIKE '%אונליין%'
        AND s.name NOT ILIKE '%online%'
      GROUP BY rc.name, rc.name_he, sp.product_id
    `, [productIds]);

    const found: Record<string, Set<number>> = {};
    for (const row of result.rows as any[]) {
      if (!found[row.chain]) found[row.chain] = new Set();
      found[row.chain].add(row.product_id);
    }

    const missing: Record<string, string[]> = {};
    for (const [chain, foundIds] of Object.entries(found)) {
      const missingIds = productIds.filter((id: number) => !foundIds.has(id));
      if (missingIds.length > 0) {
        missing[chain] = missingIds.map((id: number) => names[id]);
      }
    }
    return { missing };
  });

  // POST /savy-basket/add — הוספת מוצר
  app.post('/savy-basket/add', async (req: any, reply: any) => {
    if (req.headers['x-admin-key'] !== (process.env.ADMIN_PASSWORD || 'savy-admin-2024')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const { productId } = req.body as any;
    if (!productId) return reply.code(400).send({ error: 'Missing productId' });
    const exists = await query('SELECT id FROM savy_basket WHERE product_id=$1', [productId]);
    if (exists.rows.length) return reply.code(400).send({ error: 'Already exists' });
    const prod = await query('SELECT name FROM product WHERE id=$1', [productId]);
    if (!prod.rows.length) return reply.code(404).send({ error: 'Product not found' });
    await query('INSERT INTO savy_basket (product_id, product_name) VALUES ($1, $2)', [productId, prod.rows[0].name]);
    return { success: true };
  });

  // DELETE /savy-basket/remove/:productId — הסרת מוצר
  app.delete('/savy-basket/remove/:productId', async (req: any, reply: any) => {
    if (req.headers['x-admin-key'] !== (process.env.ADMIN_PASSWORD || 'savy-admin-2024')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const { productId } = req.params as any;
    await query('DELETE FROM savy_basket WHERE product_id=$1', [productId]);
    return { success: true };
  });

  // POST /savy-basket/compute — חישוב מדד לפי המוצרים שנבחרו
  app.post('/savy-basket/compute', async (req: any, reply: any) => {
    if (req.headers['x-admin-key'] !== (process.env.ADMIN_PASSWORD || 'savy-admin-2024')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const basket = await query('SELECT product_id FROM savy_basket');
    if (!basket.rows.length) return reply.code(400).send({ error: 'Basket is empty' });
    const productIds = basket.rows.map((r: any) => r.product_id);

    // מחיר MIN לכל מוצר בכל רשת, ללא אילת וללא אינטרנט
    const result = await query(`
      SELECT 
        rc.name as chain,
        rc.name_he as "chainHe",
        COUNT(DISTINCT product_id)::int as "productCount",
        ROUND(AVG(min_price)::numeric, 2) as "avgPrice",
        ROUND(SUM(min_price)::numeric, 2) as "totalPrice"
      FROM (
        SELECT sp.product_id, rc2.id as chain_id,
               MIN(sp.price) as min_price
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc2 ON rc2.id = s.chain_id
        WHERE sp.product_id = ANY($1)
          AND rc2.is_active = true
          AND sp.price > 0
          AND s.city NOT IN ('אילת', 'Eilat')
          AND s.name NOT ILIKE '%אונליין%'
          AND s.name NOT ILIKE '%online%'
          AND s.name NOT ILIKE '%אינטרנט%'
        GROUP BY sp.product_id, rc2.id
      ) as min_prices
      JOIN retailer_chain rc ON rc.id = chain_id
      GROUP BY rc.id, rc.name, rc.name_he
      HAVING COUNT(DISTINCT product_id) >= $2
      ORDER BY "avgPrice" ASC
    `, [productIds, Math.floor(productIds.length * 0.7)]);

    const rows = result.rows as any[];
    if (!rows.length) return reply.code(500).send({ error: 'No data' });

    const minAvg = Math.min(...rows.map(r => Number(r.avgPrice)));
    const chains = rows.map(r => ({
      chain: r.chain,
      chainHe: r.chainHe,
      avgPrice: Number(r.avgPrice),
      totalPrice: Number(r.totalPrice),
      productCount: r.productCount,
      index: Math.round((Number(r.avgPrice) / minAvg) * 100),
    }));

    const data = { chains, productCount: productIds.length, basketSize: productIds.length };
    await query('INSERT INTO price_index_cache (data, type) VALUES ($1, $2)', [JSON.stringify(data), 'basket']);
    await query("DELETE FROM price_index_cache WHERE type='basket' AND id NOT IN (SELECT id FROM price_index_cache WHERE type='basket' ORDER BY computed_at DESC LIMIT 5)");

    return { success: true, chains: chains.length };
  });

}