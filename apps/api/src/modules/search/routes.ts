import { query } from '../../db.js';

export async function searchRoutes(app) {
  app.get('/search', async (req) => {
    const { q = '', limit = 30 } = req.query;
    if (!q.trim()) return { results: [], total: 0 };

    const mode = /^\d{5,}$/.test(q.trim()) ? 'barcode' : 'text';
    let results;

    if (mode === 'barcode') {
      results = await query(
        `SELECT
           p.id,
           p.barcode,
           p.name,
           p.brand,
           p.unit_qty        AS "unitQty",
           p.unit_measure    AS "unitMeasure",
           p.image_url       AS "imageUrl",
           1.0               AS "matchScore",
           MIN(sp.price)     AS "minPrice",
           MAX(sp.price)     AS "maxPrice",
           COUNT(DISTINCT sp.store_id)::int AS "storeCount"
         FROM product p
         LEFT JOIN store_price sp ON sp.product_id = p.id
         WHERE p.barcode = $1
         GROUP BY p.id
         LIMIT $2`,
        [q.trim(), limit]
      );
    } else {
      results = await query(
        `SELECT
           p.id,
           p.barcode,
           p.name,
           p.brand,
           p.unit_qty        AS "unitQty",
           p.unit_measure    AS "unitMeasure",
           p.image_url       AS "imageUrl",
           similarity(p.name, $1) AS "matchScore",
           MIN(sp.price)     AS "minPrice",
           MAX(sp.price)     AS "maxPrice",
           COUNT(DISTINCT sp.store_id)::int AS "storeCount"
         FROM product p
         LEFT JOIN store_price sp ON sp.product_id = p.id
         WHERE p.name ILIKE $2
           AND similarity(p.name, $1) > 0.1
         GROUP BY p.id
         ORDER BY
           COUNT(DISTINCT sp.store_id) DESC,
           similarity(p.name, $1) DESC
         LIMIT $3`,
        [q.trim(), '%' + q.trim() + '%', limit]
      );
    }

    return {
      results: results.rows.map(r => ({
        ...r,
        minPrice: r.minPrice ? +r.minPrice : null,
        maxPrice: r.maxPrice ? +r.maxPrice : null,
      })),
      total: results.rows.length,
    };
  });
}
