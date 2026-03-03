import { query } from '../../db.js';

export async function dealsRoutes(app: any) {

  app.get('/deals', async (req: any) => {
    const { chain, limit = 25, offset = 0, lat, lng, category } = req.query;
    const params: any[] = [];
    const conditions: string[] = ["(pr.end_date IS NULL OR pr.end_date > NOW())", "pr.description IS NOT NULL"];
    if (category) {
      params.push(category);
      conditions.push(`EXISTS (SELECT 1 FROM promotion_item pi2 JOIN product p2 ON p2.id = pi2.product_id WHERE pi2.promotion_id = pr.id AND p2.category = $${params.length})`);
    }

    if (chain) {
      params.push(chain);
      conditions.push(`rc.name = $${params.length}`);
    }
    if (lat && lng) {
      params.push(parseFloat(lat), parseFloat(lng));
      conditions.push(`s.lat IS NOT NULL AND s.lng IS NOT NULL AND (s.lat - $${params.length-1})*(s.lat - $${params.length-1})*12321 + (s.lng - $${params.length})*(s.lng - $${params.length})*9801 < 9`);
    }

    params.push(parseInt(limit), parseInt(offset));
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const where = conditions.join(' AND ');

    const result = await query(
      `SELECT pr.id as "promotionId", pr.description, pr.discounted_price as "discountedPrice",
        pr.discount_rate as "discountRate", pr.min_qty as "minQty", pr.end_date as "endDate",
        pr.is_club_only as "isClubOnly", rc.name as "chainName", s.name as "storeName",
        s.city as "city", s.address as "address", s.lat as "lat", s.lng as "lng",
        s.subchain_name as "subchainName",
        MIN(p.id) as "productId", MIN(p.name) as "productName",
        MIN(p.barcode) as "barcode", MIN(p.image_url) as "imageUrl",
        (SELECT p2.category FROM promotion_item pi2 JOIN product p2 ON p2.id = pi2.product_id WHERE pi2.promotion_id = pr.id AND p2.category IS NOT NULL AND p2.category != '' ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "category",
        (SELECT p2.subcategory FROM promotion_item pi2 JOIN product p2 ON p2.id = pi2.product_id WHERE pi2.promotion_id = pr.id AND p2.subcategory IS NOT NULL AND p2.subcategory != '' ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "subcategory",
        MIN(sp.price) as "regularPrice", COUNT(DISTINCT pi.product_id) as "itemCount"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE ` + where + `
      GROUP BY pr.id, rc.name, s.name, s.city, s.address, s.lat, s.lng, s.subchain_name
      ORDER BY pr.id DESC
      LIMIT $` + limitIdx + ` OFFSET $` + offsetIdx,
      params
    );

    return {
      deals: result.rows.map((r: any) => ({
        ...r,
        discountedPrice: r.discountedPrice ? +r.discountedPrice : null,
        regularPrice: r.regularPrice ? +r.regularPrice : null,
        itemCount: +r.itemCount,
        savingPct: r.regularPrice && r.discountedPrice
          ? Math.round((+r.regularPrice - +r.discountedPrice) / +r.regularPrice * 100)
          : null,
      })),
      total: result.rows.length === parseInt(limit) ? parseInt(limit) * 10 : result.rows.length + parseInt(offset),
    };
  });

  app.get('/deals/categories', async () => {
    const result = await query(`
      SELECT p.category, COUNT(DISTINCT pr.id) as "dealCount"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND p.category IS NOT NULL AND p.category != ''
      GROUP BY p.category
      ORDER BY "dealCount" DESC
    `, []);
    return { categories: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
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
      ORDER BY RANDOM()
      LIMIT $1
    `, params);
    return {
      deals: result.rows.map((r: any) => ({
        ...r,
        discountedPrice: r.discountedPrice ? +r.discountedPrice : null,
        regularPrice: r.regularPrice ? +r.regularPrice : null,
        savingPct: r.regularPrice && r.discountedPrice
          ? Math.round((+r.regularPrice - +r.discountedPrice) / +r.regularPrice * 100)
          : null,
      }))
    };
  });

}
