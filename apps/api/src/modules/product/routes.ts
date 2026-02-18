import { query } from '../../db.js';

const GOOGLE_CX = 'e2d04ac793f3d4269';
const GOOGLE_KEY = 'AIzaSyCfVvxrOTZH1sgmRvu5a16RlskQAboVcy4';

async function fetchProductImage(barcode: string, name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(barcode + ' ' + name);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${q}&searchType=image&num=1&imgSize=medium`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].link;
    return null;
  } catch { return null; }
}

export async function productRoutes(app) {
  // Fast prices endpoint - no image fetching
  app.get('/product/:id/prices', async (req) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const prod = await query('SELECT image_url FROM product WHERE id=$1', [id]);
    const prices = await query('SELECT sp.price, sp.is_promo as "isPromo", s.id as "storeId", s.name as "storeName", s.city, rc.name as "chainName" FROM store_price sp JOIN store s ON s.id=sp.store_id JOIN retailer_chain rc ON rc.id=s.chain_id WHERE sp.product_id=$1 ORDER BY sp.price LIMIT $2', [id, limit]);
    return { productId: +id, imageUrl: prod.rows[0]?.image_url || null, prices: prices.rows.map(r => ({ ...r, price: +r.price })) };
  });

  // Separate image endpoint - called in background
  app.get('/product/:id/image', async (req) => {
    const { id } = req.params;
    const prod = await query('SELECT barcode, name, image_url FROM product WHERE id=$1', [id]);
    if (!prod.rows[0]) return { imageUrl: null };
    const { barcode, name, image_url } = prod.rows[0];
    if (image_url) return { imageUrl: image_url };
    const imgUrl = await fetchProductImage(barcode, name);
    if (imgUrl) await query('UPDATE product SET image_url=$1 WHERE id=$2', [imgUrl, id]);
    return { imageUrl: imgUrl };
  });
}
