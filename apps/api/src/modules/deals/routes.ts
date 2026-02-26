import { query } from '../../db.js';

export async function dealsRoutes(app: any) {

  app.get('/deals', async (req: any) => {
    const { chain, limit = 50, offset = 0 } = req.query;
    let chainFilter = '';
    const params: any[] = [parseInt(limit), parseInt(offset)];
    if (chain) {
      params.push(chain);
      chainFilter = `AND rc.name = $${params.length}`;
    }
    const result = await query(`
      SELECT
        pr.id as "promotionId",
        pr.description,
        pr.discounted_price as "discountedPrice",
        pr.discount_rate as "discountRate",
        pr.discount_type as "discountType",
        pr.min_qty as "minQty",
        pr.end_date as "endDate",
        pr.is_club_only as "isClubOnly",
        pr.reward_type as "rewardType",
        rc.name as "chainName",
        s.name as "storeName",
        s.city,
        s.subchain_name as "subchainName",
        s.address as "address",
        s.lat as "lat",
        s.lng as "lng",
        COUNT(pi.id) as "itemCount",
        MIN(p.id) as "productId",
        MIN(p.name) as "productName",
        MIN(p.barcode) as "barcode",
        MIN(p.image_url) as "imageUrl"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.description IS NOT NULL
        AND pr.description != ''
        ${chainFilter}
      GROUP BY pr.id, rc.name, s.name, s.city, s.subchain_name
      ORDER BY pr.id DESC
      LIMIT $1 OFFSET $2
    `, params);
    return {
      deals: result.rows.map((r: any) => ({
        ...r,
        discountedPrice: r.discountedPrice ? +r.discountedPrice : null,
        discountRate: r.discountRate ? +r.discountRate : null,
        minQty: r.minQty ? +r.minQty : null,
        itemCount: +r.itemCount,
      }))
    };
  });

  app.get('/deals/chains', async () => {
    const result = await query(`
      SELECT DISTINCT rc.name as "chainName", COUNT(pr.id) as "dealCount"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
      GROUP BY rc.name
      ORDER BY "dealCount" DESC
    `, []);
    return { chains: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
  });

  app.get('/deals/:promotionId/items', async (req: any) => {
    const { promotionId } = req.params;
    const result = await query(`
      SELECT
        p.id, p.name, p.barcode, p.image_url as "imageUrl",
        sp.price as "regularPrice",
        pr.discounted_price as "discountedPrice",
        pr.description as "promoDescription"
      FROM promotion_item pi
      JOIN product p ON p.id = pi.product_id
      JOIN promotion pr ON pr.id = pi.promotion_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE pi.promotion_id = $1
      LIMIT 20
    `, [promotionId]);
    return { items: result.rows.map((r: any) => ({
      ...r,
      regularPrice: r.regularPrice ? +r.regularPrice : null,
      discountedPrice: r.discountedPrice ? +r.discountedPrice : null,
    }))};
  });
  // GET /api/deals/top - מבצעים הכי משתלמים לדף הבית
  app.get('/deals/top', async (req: any) => {
    const { limit = 20, lat, lng } = req.query;
    const hasLocation = lat && lng;
    const params: any[] = [parseInt(limit)];
    let locationFilter = '';
    if (hasLocation) {
      params.push(parseFloat(lat), parseFloat(lng));
      locationFilter = `AND s.lat IS NOT NULL AND s.lng IS NOT NULL
        AND (s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3) < 0.002025`;
    }
    const result = await query(`
      SELECT
        pr.id as "promotionId",
        pr.description,
        pr.discounted_price as "discountedPrice",
        pr.discount_rate as "discountRate",
        pr.min_qty as "minQty",
        pr.end_date as "endDate",
        pr.is_club_only as "isClubOnly",
        rc.name as "chainName",
        s.name as "storeName",
        s.city as "city",
        s.address as "address",
        s.lat as "lat",
        s.lng as "lng",
        MIN(p.id) as "productId",
        MIN(p.name) as "productName",
        MIN(p.barcode) as "barcode",
        MIN(p.image_url) as "imageUrl",
        MIN(sp.price) as "regularPrice"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.description IS NOT NULL
        AND pr.discounted_price IS NOT NULL
        AND pr.discounted_price > 0
        ${locationFilter}
      GROUP BY pr.id, rc.name, s.name, s.city, s.address, s.lat, s.lng
      HAVING MIN(sp.price) IS NOT NULL AND MIN(sp.price) > pr.discounted_price
      ORDER BY (MIN(sp.price) - pr.discounted_price) / MIN(sp.price) DESC
      LIMIT $1
    `, params);
    return {
      deals: result.rows.map((r: any) => ({
        ...r,
        discountedPrice: +r.discountedPrice,
        regularPrice: r.regularPrice ? +r.regularPrice : null,
        savingPct: r.regularPrice ? Math.round((+r.regularPrice - +r.discountedPrice) / +r.regularPrice * 100) : null,
      }))
    };
  });

}
