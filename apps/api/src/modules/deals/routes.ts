import { query } from '../../db.js';

export async function dealsRoutes(app: any) {

  app.get('/deals', async (req: any) => {
    const { chain, limit = 25, offset = 0, lat, lng, category, radius = '3' } = req.query;
    let latIdx = -1, lngIdx = -1;
    const params: any[] = [];
    const conditions: string[] = [
      "(pr.end_date IS NULL OR pr.end_date > NOW())",
      "pr.description IS NOT NULL",
      "pr.item_count > 0 AND pr.item_count <= 100"
    ];

    if (category) {
      params.push(category);
      conditions.push(`pr.category = $${params.length}`);
    }

    if (chain) {
      params.push(chain);
      conditions.push(`rc.name = $${params.length}`);
    }

    if (lat && lng) {
      params.push(parseFloat(lat as string), parseFloat(lng as string));
      latIdx = params.length - 1; // $N (1-based = params.length - 1 + 1 = params.length)
      lngIdx = params.length;     // but we just pushed 2 items, so lat=$latIdx+1, lng=$lngIdx+1
      // Fix: latIdx should be the $N index (1-based)
      latIdx = params.length - 1; // lat is at params[params.length-2], so $N = params.length-1
      lngIdx = params.length;     // lng is at params[params.length-1], so $N = params.length
      const r2 = parseFloat(radius as string) ** 2;
      conditions.push(
        `s.lat IS NOT NULL AND s.lng IS NOT NULL AND ` +
        `(s.lat - $${latIdx})*(s.lat - $${latIdx})*12321 + (s.lng - $${lngIdx})*(s.lng - $${lngIdx})*9801 < ${r2}`
      );
    }

    const where = conditions.join(' AND ');
    const orderBy = latIdx > 0
      ? `(s.lat - $${latIdx})*(s.lat - $${latIdx})*12321 + (s.lng - $${lngIdx})*(s.lng - $${lngIdx})*9801 ASC, pr.id DESC`
      : `pr.id DESC`;

    // Count query for real total
    const countParams = [...params];
    const countResult = await query(
      `SELECT COUNT(DISTINCT pr.id) as total
       FROM promotion pr
       JOIN store s ON s.id = pr.store_id
       JOIN retailer_chain rc ON rc.id = s.chain_id
       JOIN promotion_item pi ON pi.promotion_id = pr.id
       JOIN product p ON p.id = pi.product_id
       WHERE ${where}`,
      countParams
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0');

    // Data query
    params.push(parseInt(limit as string), parseInt(offset as string));
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const result = await query(
      `SELECT
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
        s.subchain_name as "subchainName",
        (SELECT p2.id FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "productId",
        (SELECT p2.name FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "productName",
        (SELECT p2.barcode FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "barcode",
        (SELECT p2.image_url FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "imageUrl",
        pr.category as "category",
        pr.subcategory as "subcategory",
        pr.item_count as "itemCount",
        MIN(sp.price) as "regularPrice"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE ${where}
      GROUP BY pr.id, rc.name, s.name, s.city, s.address, s.lat, s.lng, s.subchain_name
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return {
      deals: result.rows.map((r: any) => {
        const discounted = r.discountedPrice ? +r.discountedPrice : null;
        const regular = r.regularPrice ? +r.regularPrice : null;
        const minQty = r.minQty ? parseFloat(r.minQty) : 1;

        // savingPct: compare total deal price vs regular * qty
        // e.g. "2ב125" means discounted=125 for qty=2, regular=69.9 each → 2*69.9=139.8, save=(139.8-125)/139.8=10%
        let savingPct: number | null = null;
        if (discounted !== null && regular !== null && regular > 0 && minQty >= 1) {
          const totalRegular = regular * minQty;
          if (totalRegular > 0 && discounted <= totalRegular) {
            savingPct = Math.round((totalRegular - discounted) / totalRegular * 100);
          }
        }

        return {
          ...r,
          discountedPrice: discounted,
          regularPrice: regular,
          itemCount: +r.itemCount,
          minQty: r.minQty,
          savingPct,
        };
      }),
      total,
    };
  });

  app.get('/deals/categories', async () => {
    const result = await query(`
      SELECT pr.category, COUNT(DISTINCT pr.id) as "dealCount"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.item_count > 0
        AND pr.category IS NOT NULL AND pr.category != ''
      GROUP BY pr.category
      ORDER BY "dealCount" DESC
    `, []);
    return { categories: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
  });

  app.get('/deals/chains', async () => {
    const result = await query(`
      SELECT rc.name as "chainName", COUNT(DISTINCT pr.id) as "dealCount"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.item_count > 0
      GROUP BY rc.name
      ORDER BY "dealCount" DESC
    `, []);
    return { chains: result.rows.map((r: any) => ({ ...r, dealCount: +r.dealCount })) };
  });

  app.get('/deals/:promotionId/items', async (req: any) => {
    const { promotionId } = req.params;
    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.barcode,
        p.image_url as "imageUrl",
        p.category,
        p.subcategory,
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

  // GET /api/deals/top - מבצעים הכי משתלמים לדף הבית
  app.get('/deals/top', async (req: any) => {
    const { limit = 20, lat, lng } = req.query;
    const hasLocation = lat && lng;
    const params: any[] = [parseInt(limit as string)];
    let locationFilter = '';

    if (hasLocation) {
      params.push(parseFloat(lat as string), parseFloat(lng as string));
      // ~4.5km radius using degree approximation
      locationFilter = `AND s.lat IS NOT NULL AND s.lng IS NOT NULL
        AND (s.lat - $2)*(s.lat - $2)*12321 + (s.lng - $3)*(s.lng - $3)*9801 < 20.25`;
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
        pr.category as "category",
        pr.subcategory as "subcategory",
        pr.item_count as "itemCount",
        (SELECT p2.id FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "productId",
        (SELECT p2.name FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "productName",
        (SELECT p2.image_url FROM promotion_item pi2
          JOIN product p2 ON p2.id = pi2.product_id
          WHERE pi2.promotion_id = pr.id
          ORDER BY p2.store_count DESC NULLS LAST LIMIT 1) as "imageUrl",
        MIN(sp.price) as "regularPrice"
      FROM promotion pr
      JOIN store s ON s.id = pr.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN promotion_item pi ON pi.promotion_id = pr.id
      JOIN product p ON p.id = pi.product_id
      LEFT JOIN store_price sp ON sp.product_id = p.id AND sp.store_id = pr.store_id
      WHERE (pr.end_date IS NULL OR pr.end_date > NOW())
        AND pr.description IS NOT NULL
        AND pr.item_count > 0
        AND pr.discounted_price IS NOT NULL
        AND pr.discounted_price > 0
        ${locationFilter}
      GROUP BY pr.id, rc.name, s.name, s.city, s.address, s.lat, s.lng
      ORDER BY pr.id DESC
      LIMIT $1
    `, params);

    return {
      deals: result.rows.map((r: any) => {
        const discounted = r.discountedPrice ? +r.discountedPrice : null;
        const regular = r.regularPrice ? +r.regularPrice : null;
        const minQty = r.minQty ? parseFloat(r.minQty) : 1;
        let savingPct: number | null = null;
        if (discounted !== null && regular !== null && regular > 0 && minQty >= 1) {
          const totalRegular = regular * minQty;
          if (totalRegular > 0 && discounted <= totalRegular) {
            savingPct = Math.round((totalRegular - discounted) / totalRegular * 100);
          }
        }
        return {
          ...r,
          discountedPrice: discounted,
          regularPrice: regular,
          itemCount: +r.itemCount,
          savingPct,
        };
      })
    };
  });
}
