import { query } from '../../db.js';

// All listing endpoints read from deals_current — a materialized view of
// active, valid promotions joined to store+chain, refreshed nightly by
// scripts/update_prices.py (created by the db-maintenance workflow).
// Live promotion/promotion_item tables are only touched for the handful of
// rows actually returned, never scanned per request.

const mapDeal = (r: any, b: any = {}) => {
  const discounted = r.discounted_price ? +r.discounted_price : null;
  const regular = b.regular_price ? +b.regular_price : null;
  const minQty = r.min_qty ? parseFloat(r.min_qty) : 1;
  let savingPct: number | null = null;
  if (discounted !== null && regular !== null && regular > 0 && minQty >= 1) {
    const totalRegular = regular * minQty;
    if (totalRegular > 0 && discounted <= totalRegular) {
      savingPct = Math.round((totalRegular - discounted) / totalRegular * 100);
    }
  }
  return {
    promotionId: r.promo_id, chainPromotionId: r.chain_promotion_id,
    description: r.description, discountedPrice: discounted,
    discountRate: r.discount_rate, minQty: r.min_qty,
    endDate: r.end_date, isClubOnly: r.is_club_only,
    chainName: r.chain_name, storeName: r.store_name,
    city: r.city, address: r.address, lat: r.lat, lng: r.lng,
    subchainName: r.subchain_name,
    productId: b.product_id ?? null, productName: b.product_name ?? null,
    barcode: b.barcode ?? null, imageUrl: b.image_url ?? null,
    category: r.category, subcategory: r.subcategory,
    itemCount: r.item_count != null ? +r.item_count : 0,
    regularPrice: regular, savingPct,
  };
};

// best display product + its regular price at the deal's store, for the
// already-selected page of deals only
async function bestProducts(rows: any[]): Promise<Record<number, any>> {
  if (!rows.length) return {};
  const pids = rows.map((r: any) => r.promo_id);
  const sids = rows.map((r: any) => r.store_id);
  const bp = await query(
    `SELECT bp.promotion_id, bp.product_id, bp.product_name, bp.barcode, bp.image_url,
            MIN(sp.price) AS regular_price
     FROM (
       SELECT DISTINCT ON (pi.promotion_id)
         pi.promotion_id, p.id AS product_id, p.name AS product_name, p.barcode, p.image_url
       FROM promotion_item pi
       JOIN product p ON p.id = pi.product_id
       WHERE pi.promotion_id = ANY($1)
       ORDER BY pi.promotion_id, p.store_count DESC NULLS LAST
     ) bp
     JOIN unnest($1::int[], $2::int[]) AS m(pid, sid) ON m.pid = bp.promotion_id
     LEFT JOIN store_price sp ON sp.product_id = bp.product_id AND sp.store_id = m.sid
     GROUP BY bp.promotion_id, bp.product_id, bp.product_name, bp.barcode, bp.image_url`,
    [pids, sids]
  );
  const byPromo: Record<number, any> = {};
  for (const b of bp.rows as any[]) byPromo[b.promotion_id] = b;
  return byPromo;
}

async function nearbyStores(lat: number, lng: number, radiusKm: number) {
  const dLat = (radiusKm / 111).toFixed(6);
  const dLng = (radiusKm / 99).toFixed(6);
  const r2 = radiusKm ** 2;
  const near = await query(
    `SELECT id, (lat-$1)*(lat-$1)*12321 + (lng-$2)*(lng-$2)*9801 AS dist
     FROM store
     WHERE lat BETWEEN $1 - ${dLat} AND $1 + ${dLat}
       AND lng BETWEEN $2 - ${dLng} AND $2 + ${dLng}
       AND (lat-$1)*(lat-$1)*12321 + (lng-$2)*(lng-$2)*9801 < ${r2}`,
    [lat, lng]
  );
  return {
    ids: near.rows.map((x: any) => x.id),
    dists: near.rows.map((x: any) => Number(x.dist)),
  };
}

export async function dealsRoutes(app: any) {

  app.get('/deals', async (req: any) => {
    const { chain, limit = 25, offset = 0, lat, lng, category, radius = '3' } = req.query;
    const hasLocation = !!(lat && lng);
    const lim = parseInt(limit as string);
    const off = parseInt(offset as string);

    const filters: string[] = [];
    const fparams: any[] = [];
    if (category) { fparams.push(category); filters.push(`dc.category = $${fparams.length}`); }
    if (chain) { fparams.push(chain); filters.push(`dc.chain_name = $${fparams.length}`); }

    let rows: any[] = [];
    let total = 0;

    if (hasLocation) {
      const { ids, dists } = await nearbyStores(parseFloat(lat as string), parseFloat(lng as string), parseFloat(radius as string));
      if (!ids.length) return { deals: [], total: 0 };
      const whereExtra = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
      const c = await query(
        `SELECT COUNT(*) AS total FROM (
           SELECT 1 FROM deals_current dc
           JOIN unnest($${fparams.length + 1}::int[]) AS n(sid) ON dc.store_id = n.sid
           ${whereExtra} LIMIT 500) s`,
        [...fparams, ids]
      );
      total = parseInt((c.rows[0] as any).total);
      const main = await query(
        `SELECT dc.*, n.dist AS dist_sq
         FROM deals_current dc
         JOIN unnest($${fparams.length + 1}::int[], $${fparams.length + 2}::float8[]) AS n(sid, dist) ON dc.store_id = n.sid
         ${whereExtra}
         ORDER BY n.dist ASC, dc.discount_rate DESC NULLS LAST, dc.promo_id DESC
         LIMIT $${fparams.length + 3} OFFSET $${fparams.length + 4}`,
        [...fparams, ids, dists, lim, off]
      );
      rows = main.rows;
    } else {
      const where = ['dc.is_canonical', ...filters].join(' AND ');
      const c = await query(
        `SELECT COUNT(*) AS total FROM (SELECT 1 FROM deals_current dc WHERE ${where} LIMIT 500) s`,
        fparams
      );
      total = parseInt((c.rows[0] as any).total);
      const main = await query(
        `SELECT dc.* FROM deals_current dc WHERE ${where}
         ORDER BY dc.discount_rate DESC NULLS LAST, dc.promo_id DESC
         LIMIT $${fparams.length + 1} OFFSET $${fparams.length + 2}`,
        [...fparams, lim, off]
      );
      rows = main.rows;
    }

    const byPromo = await bestProducts(rows);
    return { deals: rows.map((r: any) => mapDeal(r, byPromo[r.promo_id])), total };
  });

  app.get('/deals/categories', async () => {
    const result = await query(`
      SELECT dc.category, COUNT(*) as "dealCount"
      FROM deals_current dc
      WHERE dc.is_canonical AND dc.item_count > 0
        AND dc.category IS NOT NULL AND dc.category != ''
      GROUP BY dc.category
      ORDER BY "dealCount" DESC
    `, []);
    return { categories: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
  });

  app.get('/deals/chains', async () => {
    const result = await query(`
      SELECT dc.chain_name as "chainName", COUNT(*) as "dealCount"
      FROM deals_current dc
      WHERE dc.item_count > 0
      GROUP BY dc.chain_name
      ORDER BY "dealCount" DESC
    `, []);
    return { chains: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
  });

  app.get('/deals/:promotionId/items', async (req: any) => {
    const { promotionId } = req.params;
    const result = await query(`
      SELECT
        p.id, p.name, p.barcode,
        p.image_url as "imageUrl",
        p.category, p.subcategory,
        sp.price as "regularPrice",
        pr.discounted_price as "discountedPrice",
        pr.description as "promoDescription"
      FROM promotion_item pi
      JOIN product p ON p.id = pi.product_id
      JOIN promotion pr ON pr.id = pi.promotion_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE pi.promotion_id = $1
      ORDER BY p.store_count DESC NULLS LAST
      LIMIT 20
    `, [promotionId]);
    return {
      items: result.rows.map((r: any) => ({
        ...r,
        regularPrice: r.regularPrice ? +r.regularPrice : null,
        discountedPrice: r.discountedPrice ? +r.discountedPrice : null,
      }))
    };
  });

  app.get('/deals/top', async (req: any) => {
    const { limit = 20, lat, lng } = req.query;
    const hasLocation = !!(lat && lng);
    const lim = parseInt(limit as string);

    const PRICE_FILTER = `dc.description IS NOT NULL
      AND dc.item_count > 0 AND dc.item_count <= 50
      AND dc.discounted_price IS NOT NULL
      AND dc.discounted_price > 0 AND dc.discounted_price < 500`;

    let rows: any[];
    if (hasLocation) {
      const { ids } = await nearbyStores(parseFloat(lat as string), parseFloat(lng as string), 4.5);
      if (!ids.length) return { deals: [] };
      const r = await query(
        `SELECT DISTINCT ON (dc.chain_name) dc.*
         FROM deals_current dc
         WHERE dc.store_id = ANY($1) AND ${PRICE_FILTER}
         ORDER BY dc.chain_name, dc.discount_rate DESC NULLS LAST, dc.promo_id DESC
         LIMIT $2`,
        [ids, lim]
      );
      rows = r.rows;
    } else {
      const r = await query(
        `SELECT DISTINCT ON (dc.chain_name) dc.*
         FROM deals_current dc
         WHERE dc.is_canonical AND ${PRICE_FILTER}
         ORDER BY dc.chain_name, dc.discount_rate DESC NULLS LAST, dc.promo_id DESC
         LIMIT $1`,
        [lim]
      );
      rows = r.rows;
    }

    const byPromo = await bestProducts(rows);
    return {
      deals: rows.map((r: any) => {
        const d = mapDeal(r, byPromo[r.promo_id]);
        // /deals/top historically exposed the same fields minus address/coords
        const { address, lat: _lat, lng: _lng, subchainName, chainPromotionId, ...rest } = d as any;
        return rest;
      }),
    };
  });
}
