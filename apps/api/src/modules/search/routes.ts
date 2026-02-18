import { query } from '../../db.js';
export async function searchRoutes(app) {
  app.get('/search', async (req) => {
    const { q, mode = 'name', limit = 20 } = req.query;
    if (q === undefined || q.trim() === '') return { results: [], total: 0 };
    let results;
    if (mode === 'barcode') {
      results = await query('SELECT p.id, p.barcode, p.name, p.brand, p.unit_qty as "unitQty", p.unit_measure as "unitMeasure", 1.0 as "matchScore", MIN(sp.price) as "minPrice", MAX(sp.price) as "maxPrice", COUNT(DISTINCT sp.store_id)::int as "storeCount" FROM product p LEFT JOIN store_price sp ON sp.product_id = p.id WHERE p.barcode = $1 GROUP BY p.id LIMIT $2', [q.trim(), limit]);
    } else {
      results = await query('SELECT p.id, p.barcode, p.name, p.brand, p.unit_qty as "unitQty", p.unit_measure as "unitMeasure", similarity(p.name, $1) as "matchScore", MIN(sp.price) as "minPrice", MAX(sp.price) as "maxPrice", COUNT(DISTINCT sp.store_id)::int as "storeCount" FROM product p LEFT JOIN store_price sp ON sp.product_id = p.id WHERE p.name % $1 OR p.name ILIKE $2 GROUP BY p.id ORDER BY similarity(p.name, $1) DESC LIMIT $3', [q.trim(), '%'+q.trim()+'%', limit]);
    }
    return { results: results.rows.map(r => ({ ...r, minPrice: r.minPrice ? +r.minPrice : null, maxPrice: r.maxPrice ? +r.maxPrice : null })), total: results.rows.length };
  });
}
