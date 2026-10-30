import { query } from '../../db.js';
// Fail closed: without ADMIN_PASSWORD set in the environment, admin routes
// reject everything. Never ship a hardcoded fallback — the repo is public.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;

export async function adminRoutes(app: any) {
  // תמונות שעודכנו לאחרונה ע"י רופא התמונות — לסקירה ויזואלית באדמין
  app.get('/admin/recent-images', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const hours = Math.min(parseInt(req.query.hours || '48'), 24 * 14);
    const verified = await query(
      `SELECT id, name, image_url as "imageUrl", image_checked_at as "checkedAt", store_count as "storeCount"
       FROM product
       WHERE image_checked_at > NOW() - ($1 || ' hours')::interval AND image_url IS NOT NULL
       ORDER BY image_checked_at DESC LIMIT 120`, [String(hours)]);
    const cleared = await query(
      `SELECT id, name, image_rejected_url as "rejectedUrl", image_checked_at as "checkedAt", store_count as "storeCount"
       FROM product
       WHERE image_checked_at > NOW() - ($1 || ' hours')::interval
         AND image_url IS NULL AND image_rejected_url IS NOT NULL
       ORDER BY image_checked_at DESC LIMIT 120`, [String(hours)]);
    return { verified: verified.rows, cleared: cleared.rows };
  });

  app.get('/admin/products-missing-images', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const { offset = 0, limit = 20, search = '', showAll = 'false' } = req.query;
    const imageFilter = showAll === 'true' ? '' : "AND (p.image_url IS NULL OR p.image_url = '')";
    const params: any[] = [];
    let searchFilter = '';
    if (search) {
      params.push(`%${search}%`);
      searchFilter = `AND (p.name ILIKE $1 OR p.barcode ILIKE $1)`;
    }
    const res = await query(`
      SELECT p.id, p.barcode, p.name, p.store_count, p.min_price, p.image_url
      FROM product p
      WHERE EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ${imageFilter}
        ${searchFilter}
      ORDER BY p.store_count DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `, params);
    const count = await query(`
      SELECT COUNT(*) FROM product p
      WHERE EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ${imageFilter}
        ${searchFilter}
    `, params);
    return { products: res.rows, total: parseInt((count.rows[0] as any).count) };
  });

  app.post('/admin/update-image', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const { productId, imageUrl } = req.body as any;
    if (!productId || !imageUrl) return reply.code(400).send({ error: 'Missing fields' });
    // נקה _ipx wrappers (Next.js image optimization)
    let cleanUrl = imageUrl;
    const ipxMatch = cleanUrl.match(/_ipx\/[^/]+\/(https?:\/\/.+)/);
    if (ipxMatch) cleanUrl = ipxMatch[1];
    // a human picked this image — mark it verified so the nightly AI
    // image check never overrides an admin decision
    await query('UPDATE product SET image_url=$1, image_checked_at=NOW(), image_rejected_url=NULL WHERE id=$2', [cleanUrl, productId]);
    return { success: true };
  });
  // GET /admin/all-categories — כל הקטגוריות הקיימות
  app.get('/admin/all-categories', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const res = await query(`
      SELECT DISTINCT category, subcategory
      FROM product
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category, subcategory
    `);
    // בנה מבנה { category: [subcategory, ...] }
    const map: Record<string, string[]> = {};
    for (const row of res.rows as any[]) {
      const cat = row.category as string;
      const sub = row.subcategory as string | null;
      if (!map[cat]) map[cat] = [];
      if (sub && map[cat].indexOf(sub) === -1) map[cat].push(sub);
    }
    return map;
  });

  // GET /admin/products-categories — מוצרים עם קטגוריה
  app.get('/admin/products-categories', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const { offset = 0, limit = 20, search = '', filterCategory = '' } = req.query;
    const params: any[] = [];
    let searchFilter = '';
    let categoryFilter = '';
    if (search) {
      params.push(`%${search}%`);
      searchFilter = `AND (p.name ILIKE $${params.length} OR p.barcode ILIKE $${params.length})`;
    }
    if (filterCategory === '__empty__') {
      categoryFilter = `AND (p.category IS NULL OR p.category = '')`;
    } else if (filterCategory) {
      params.push(filterCategory);
      categoryFilter = `AND p.category = $${params.length}`;
    }
    const res = await query(`
      SELECT p.id, p.barcode, p.name, p.store_count, p.min_price, p.image_url,
             p.category, p.subcategory
      FROM product p
      WHERE EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ${searchFilter}
        ${categoryFilter}
      ORDER BY p.store_count DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `, params);
    const count = await query(`
      SELECT COUNT(*) FROM product p
      WHERE EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ${searchFilter}
        ${categoryFilter}
    `, params);
    return { products: res.rows, total: parseInt((count.rows[0] as any).count) };
  });

  // POST /admin/update-category — עדכון קטגוריה
  app.post('/admin/update-category', async (req: any, reply: any) => {
    if (!ADMIN_PASSWORD || req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const { productId, category, subcategory } = req.body as any;
    if (!productId) return reply.code(400).send({ error: 'Missing productId' });
    await query(
      'UPDATE product SET category=$1, subcategory=$2 WHERE id=$3',
      [category || null, subcategory || null, productId]
    );
    return { success: true };
  });
}
