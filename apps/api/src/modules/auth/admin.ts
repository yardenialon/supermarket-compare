import { query } from '../../db.js';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'savy-admin-2024';

export async function adminRoutes(app: any) {
  app.get('/admin/products-missing-images', async (req: any, reply: any) => {
    if (req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
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
    if (req.headers['x-admin-key'] !== ADMIN_PASSWORD) return reply.code(401).send({ error: 'Unauthorized' });
    const { productId, imageUrl } = req.body as any;
    if (!productId || !imageUrl) return reply.code(400).send({ error: 'Missing fields' });
    // נקה _ipx wrappers (Next.js image optimization)
    let cleanUrl = imageUrl;
    const ipxMatch = cleanUrl.match(/_ipx\/[^/]+\/(https?:\/\/.+)/);
    if (ipxMatch) cleanUrl = ipxMatch[1];
    await query('UPDATE product SET image_url=$1 WHERE id=$2', [cleanUrl, productId]);
    return { success: true };
  });
}
