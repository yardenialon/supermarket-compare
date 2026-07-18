import { query } from '../../db.js';
const SERP_KEY = '2e3660ec2b969459b9841800dc63c8e9aa6cf88aad1e3d707c3e799acfa2a778';
const TRUSTED_DOMAINS = [
  // רשתות סופרמרקט
  'shufersal.co.il', 'mega.co.il', 'rami-levy.co.il', 'ramielevy.co.il',
  'osheread.co.il', 'osherad.co.il', 'yochananof.co.il', 'tivtaam.co.il',
  'victory.co.il', 'victoryonline.co.il', 'half-price.co.il', 'hazihiham.co.il',
  'keshet-teamim.co.il', 'doralon.co.il', 'freshmarket.co.il',
  'mahsaniashuk.co.il', 'yayno-bitan.co.il', 'kingstore.co.il',
  // יצרנים ומותגים
  'tnuva.co.il', 'strauss.co.il', 'osem.co.il', 'rfranco.com',
  'mybundles.co.il', 'schnellers.co.il', 'super-pharm.co.il',
  'telma.co.il', 'willi-food.com', 'elite.co.il', 'alpro.com',
  'nestle.co.il', 'unilever.com', 'coca-cola.co.il', 'pepsico.com',
];
function isTrustedImage(url: string | undefined, barcode: string) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes(barcode)) return true;
  for (const d of TRUSTED_DOMAINS) { if (lower.includes(d)) return true; }
  return false;
}
async function fetchProductImage(barcode: string, name: string) {
  try {
    const q = encodeURIComponent(barcode + ' ' + name + ' מוצר');
    const url = `https://serpapi.com/search.json?engine=google_images&q=${q}&api_key=${SERP_KEY}&num=10&hl=he&gl=il`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.images_results || !data.images_results.length) return null;
    const trusted = data.images_results.find((r: any) => isTrustedImage(r.original, barcode));
    if (trusted) return trusted.original;
    const trustedThumb = data.images_results.find((r: any) => isTrustedImage(r.link, barcode));
    if (trustedThumb) return trustedThumb.original || trustedThumb.thumbnail;
    const withBarcode = data.images_results.find((r: any) => r.link?.includes(barcode));
    if (withBarcode) return withBarcode.original || withBarcode.thumbnail;
    return null;
  } catch { return null; }
}
export async function productRoutes(app: any) {

  // ── NEW: GET /product/:id — product details for SEO page ──────────
  // NEW: GET /product/:id
  app.get('/product/:id', async (req: any) => {
    const { id } = req.params;
    const result = await query(
      `SELECT id, barcode, name, brand, unit_qty as "unitQty", unit_measure as "unitMeasure",
              image_url as "imageUrl", min_price as "minPrice", store_count as "storeCount",
              category, subcategory,
              energy_kcal as "energyKcal", protein_g as "proteinG", carbs_g as "carbsG",
              sugars_g as "sugarsG", fat_g as "fatG", saturated_fat_g as "saturatedFatG",
              trans_fat_g as "transFatG", sodium_mg as "sodiumMg", fiber_g as "fiberG",
              cholesterol_mg as "cholesterolMg", ingredients, allergens,
              high_saturated_fat as "highSaturatedFat", high_sugars as "highSugars",
              high_sodium as "highSodium", nutrition_source as "nutritionSource",
              nutrition_updated_at as "nutritionUpdatedAt"
       FROM product WHERE id = $1`,
      [id]
    );
    if (!result.rows[0]) {
      throw { statusCode: 404, message: 'Product not found' };
    }
    return result.rows[0];
  });



  // Categories
  app.get('/categories', async () => {
    const result = await query(`
      SELECT category, COUNT(*) as count 
      FROM product 
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category 
      ORDER BY count DESC
    `);
    return result.rows;
  });


  app.get('/category/:name/subcategories', async (req: any) => {
    const { name } = req.params;
    const result = await query(`
      SELECT subcategory, COUNT(*) as count
      FROM product
      WHERE category = $1
      AND subcategory IS NOT NULL AND subcategory != ''
      GROUP BY subcategory
      ORDER BY count DESC
    `, [decodeURIComponent(name)]);
    return result.rows;
  });

  app.get('/category/:name/products', async (req: any) => {
    const { name } = req.params;
    const page = parseInt(req.query.page || '0');
    const subcategory = req.query.subcategory;
    const limit = 48;
    const offset = page * limit;
    let result;
    if (subcategory) {
      result = await query(`
        SELECT id, name, brand, image_url as "imageUrl", min_price as "minPrice", store_count as "storeCount"
        FROM product 
        WHERE category = $1 AND subcategory = $2
        ORDER BY store_count DESC NULLS LAST
        LIMIT $3 OFFSET $4
      `, [decodeURIComponent(name), decodeURIComponent(subcategory), limit, offset]);
    } else {
      result = await query(`
        SELECT id, name, brand, image_url as "imageUrl", min_price as "minPrice", store_count as "storeCount"
        FROM product 
        WHERE category = $1
        ORDER BY store_count DESC NULLS LAST
        LIMIT $2 OFFSET $3
      `, [decodeURIComponent(name), limit, offset]);
    }
    return { products: result.rows, page, limit };
  });
  // Sitemap endpoints
  app.get('/products/sitemap/count', async () => {
    const result = await query('SELECT COUNT(*) as count FROM product');
    return { count: parseInt(result.rows[0].count) };
  });
  app.get('/products/sitemap', async (req: any) => {
    const page = parseInt(req.query.page || '0');
    const limit = parseInt(req.query.limit || '45000');
    const offset = page * limit;
    const result = await query('SELECT id FROM product ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    return result.rows.map((r: any) => r.id);
  });
  app.get('/product/:id/prices', async (req: any) => {
    const { id } = req.params;
    const { lat, lng } = req.query;
    const prod = await query('SELECT image_url FROM product WHERE id=$1', [id]);
    let prices;
    if (lat && lng) {
      const uLat = parseFloat(lat as string);
      const uLng = parseFloat(lng as string);
      prices = await query(`
        SELECT sp.price, sp.is_promo as "isPromo",
          s.id as "storeId", s.name as "storeName", s.city,
          rc.name as "chainName", s.subchain_name as "subchainName",
          ((s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3)) as dist
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE sp.product_id = $1 AND s.lat IS NOT NULL
        ORDER BY dist ASC LIMIT 50
      `, [id, uLat, uLng]);
    } else {
      prices = await query(`
        SELECT sp.price, sp.is_promo as "isPromo",
          s.id as "storeId", s.name as "storeName", s.city,
          rc.name as "chainName", s.subchain_name as "subchainName"
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE sp.product_id = $1
        ORDER BY sp.price ASC LIMIT 50
      `, [id]);
    }
    return {
      productId: +id,
      imageUrl: prod.rows[0]?.image_url || null,
      prices: prices.rows.map((r: any) => ({ ...r, price: +r.price })).sort((a: any, b: any) => a.price - b.price)
    };
  });

  app.get('/product/:id/image', async (req: any) => {
    const { id } = req.params;
    const prod = await query('SELECT barcode, name, image_url FROM product WHERE id=$1', [id]);
    if (!prod.rows[0]) return { imageUrl: null };
    const { barcode, name, image_url } = prod.rows[0];
    if (image_url) return { imageUrl: image_url };
    const img = await fetchProductImage(barcode, name);
    if (img) { await query('UPDATE product SET image_url=$1 WHERE id=$2', [img, id]); }
    return { imageUrl: img };
  });
  // Image proxy — מסתיר URL מקורי
  app.get('/image-proxy', async (req: any, reply: any) => {
    const encoded = (req.query as any).u;
    if (!encoded) return reply.code(400).send('Missing parameter');

    let originalUrl: string;
    try {
      originalUrl = Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
      return reply.code(400).send('Invalid parameter');
    }

    const allowedDomains = [
      'img.rami-levy.co.il', 'res.cloudinary.com', 'superpharmstorage.blob.core.windows.net',
      'm.pricez.co.il', 'd226b0iufwcjmj.cloudfront.net', 'noyhasade.b-cdn.net',
      'imageproxy.wolt.com', 'storage.googleapis.com', 'pricez.co.il',
    ];

    try {
      const urlObj = new URL(originalUrl);
      const allowed = allowedDomains.some(d => urlObj.hostname.includes(d));
      if (!allowed) return reply.code(403).send('Domain not allowed');
    } catch {
      return reply.code(400).send('Invalid URL');
    }

    try {
      const response = await fetch(originalUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://savy.co.il' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return reply.code(404).send('Image not found');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();
      reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=86400')
        .header('Content-Disposition', 'inline')
        .header('X-Content-Type-Options', 'nosniff')
        .send(Buffer.from(buffer));
    } catch {
      return reply.code(502).send('Failed to fetch image');
    }
  });
}
// index hint - run once in DB:
// CREATE INDEX IF NOT EXISTS idx_product_id ON product(id);

