import { query } from '../../db.js';

export async function dealsRoutes(app: any) {

  app.get('/deals', async (req: any) => {
    console.log('[deals] query params:', JSON.stringify(req.query));
    const { chain, limit = 25, offset = 0, lat, lng, category, radius = '3' } = req.query;
    const hasLocation = !!(lat && lng);
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

    if (hasLocation) {
      params.push(parseFloat(lat as string), parseFloat(lng as string));
      latIdx = params.length - 1;
      lngIdx = params.length;
      const r2 = parseFloat(radius as string) ** 2;
      conditions.push(
        `s.lat IS NOT NULL AND s.lng IS NOT NULL AND ` +
        `(s.lat - $${latIdx})*(s.lat - $${latIdx})*12321 + (s.lng - $${lngIdx})*(s.lng - $${lngIdx})*9801 < ${r2}`
      );
    }

    const where = conditions.join(' AND ');
    const orderBy = hasLocation ? `rc.name, dist_sq ASC, pr.id DESC` : `rc.name, pr.discount_rate DESC NULLS LAST, pr.id DESC`;

    // תמיד הסר כפילויות לפי chain_promotion_id + רשת
    // עם מיקום: השאר את החנות הקרובה ביותר (dist_sq קטן ביותר = id גבוה בתוך אותו מרחק)
    // בלי מיקום: השאר את ה-id הגבוה ביותר
    const dedupeKey = hasLocation
      ? `COALESCE(pr.chain_promotion_id::text || '|' || rc.name, pr.id::text)`
      : `COALESCE(pr.chain_promotion_id::text || '|' || rc.name, pr.id::text)`;
    const distExprInner = hasLocation
      ? `(s.lat - $${latIdx})*(s.lat - $${latIdx})*12321 + (s.lng - $${lngIdx})*(s.lng - $${lngIdx})*9801`
      : `0`;
    // עם מיקום: אל תעשה dedupe - הצג את כל המבצעים הקרובים (ממוינים לפי מרחק)
    // בלי מיקום: dedupe לפי MIN id - מבצע אחד לכל רשת
    const dedupeClause = hasLocation ? `` : `
      AND (pr.chain_promotion_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM promotion pr2
        JOIN store s2 ON s2.id = pr2.store_id
        JOIN retailer_chain rc2 ON rc2.id = s2.chain_id
        WHERE pr2.chain_promotion_id = pr.chain_promotion_id
          AND rc2.name = rc.name
          AND pr2.id < pr.id
          AND (pr2.end_date IS NULL OR pr2.end_date > NOW())
          AND pr2.item_count > 0 AND pr2.item_count <= 100
      ))
    `;
    // Count - skip expensive COUNT for location queries, use fast estimate
    let total = 0;
    if (!hasLocation) {
      const countResult = await query(
        `SELECT COUNT(*) as total FROM (
           SELECT DISTINCT COALESCE(pr.chain_promotion_id::text || rc.name, pr.id::text)
           FROM promotion pr
           JOIN store s ON s.id = pr.store_id
           JOIN retailer_chain rc ON rc.id = s.chain_id
           JOIN promotion_item pi ON pi.promotion_id = pr.id
           WHERE ${where}
         ) sub`,
        [...params]
      );
      total = parseInt((countResult.rows[0] as any)?.total ?? '0');
    }

    params.push(parseInt(limit as string), parseInt(offset as string));
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const distExpr = hasLocation
      ? `(s.lat - $${latIdx})*(s.lat - $${latIdx})*12321 + (s.lng - $${lngIdx})*(s.lng - $${lngIdx})*9801`
      : `0`;

    const result = await query(
      `WITH filtered AS (
        SELECT DISTINCT ON (rc.name) pr.id as promo_id, pr.store_id, s.name as store_name, s.city,
          s.address, s.lat, s.lng, s.subchain_name,
          rc.name as chain_name, pr.chain_promotion_id,
          pr.description, pr.discounted_price, pr.discount_rate,
          pr.min_qty, pr.end_date, pr.is_club_only,
          pr.category, pr.subcategory, pr.item_count,
          ${distExpr} as dist_sq
        FROM promotion pr
        JOIN store s ON s.id = pr.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE ${where} ${dedupeClause}
        ORDER BY ${orderBy}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      ),
      best_product AS (
        SELECT DISTINCT ON (pi.promotion_id)
          pi.promotion_id, p.id as product_id, p.name as product_name,
          p.barcode, p.image_url
        FROM filtered f
        JOIN promotion_item pi ON pi.promotion_id = f.promo_id
        JOIN product p ON p.id = pi.product_id
        ORDER BY pi.promotion_id, p.store_count DESC NULLS LAST
      )
      SELECT
        f.promo_id as "promotionId", f.chain_promotion_id as "chainPromotionId",
        f.description, f.discounted_price as "discountedPrice",
        f.discount_rate as "discountRate", f.min_qty as "minQty",
        f.end_date as "endDate", f.is_club_only as "isClubOnly",
        f.chain_name as "chainName", f.store_name as "storeName",
        f.city, f.address, f.lat, f.lng, f.subchain_name as "subchainName",
        bp.product_id as "productId", bp.product_name as "productName",
        bp.barcode, bp.image_url as "imageUrl",
        f.category, f.subcategory, f.item_count as "itemCount",
        MIN(sp.price) as "regularPrice", f.dist_sq
      FROM filtered f
      LEFT JOIN best_product bp ON bp.promotion_id = f.promo_id
      LEFT JOIN store_price sp ON sp.product_id = bp.product_id AND sp.store_id = f.store_id
      GROUP BY f.promo_id, f.chain_promotion_id, f.description, f.discounted_price,
        f.discount_rate, f.min_qty, f.end_date, f.is_club_only, f.chain_name,
        f.store_name, f.city, f.address, f.lat, f.lng, f.subchain_name,
        bp.product_id, bp.product_name, bp.barcode, bp.image_url,
        f.category, f.subcategory, f.item_count, f.dist_sq
      ORDER BY f.dist_sq ASC, f.promo_id DESC`,
      params
    );

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
        const { dist_sq, ...rest } = r;
        return { ...rest, discountedPrice: discounted, regularPrice: regular, itemCount: +r.itemCount, savingPct };
      }),
      total,
    };
  });

  app.get('/deals/categories', async () => {
    const result = await query(`
      SELECT pr.category, COUNT(DISTINCT COALESCE(pr.chain_promotion_id::text || rc.name, pr.id::text)) as "dealCount"
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
    const params: any[] = [parseInt(limit as string)];
    let locationFilter = '';

    if (hasLocation) {
      params.push(parseFloat(lat as string), parseFloat(lng as string));
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
        pr.category as "category",
        pr.subcategory as "subcategory",
        pr.item_count as "itemCount",
        p.id as "productId",
        p.name as "productName",
        p.image_url as "imageUrl",
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
      GROUP BY pr.id, rc.name, s.name, s.city, s.address, s.lat, s.lng, p.id, p.name, p.image_url
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
        return { ...r, discountedPrice: discounted, regularPrice: regular, itemCount: +r.itemCount, savingPct };
      })
    };
  });
}
