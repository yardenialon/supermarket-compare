import { query } from '../../db.js';

export async function searchRoutes(app) {
  app.get('/search', async (req) => {
    const { q = '', limit = 30 } = req.query;
    if (!q.trim()) return { results: [], total: 0 };

    const mode = /^\d{5,}$/.test(q.trim()) ? 'barcode' : 'text';
    let results;

    if (mode === 'barcode') {
      // min_price/store_count are denormalized onto product and refreshed nightly
      // by scripts/update_prices.py — no need to touch the 7.5M-row store_price here
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
           p.min_price       AS "minPrice",
           NULL::numeric     AS "maxPrice",
           COALESCE(p.store_count, 0)::int AS "storeCount"
         FROM product p
         WHERE p.barcode = $1
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
           p.min_price       AS "minPrice",
           NULL::numeric     AS "maxPrice",
           COALESCE(p.store_count, 0)::int AS "storeCount"
         FROM product p
         WHERE p.name ILIKE $2
           AND similarity(p.name, $1) > 0.1
         ORDER BY
           p.store_count DESC NULLS LAST,
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
