import { query } from '../../db.js';

const SERP_KEY = '2e3660ec2b969459b9841800dc63c8e9aa6cf88aad1e3d707c3e799acfa2a778';

async function fetchProductImage(barcode: string, name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(barcode);
    const url = `https://serpapi.com/search.json?engine=google_images&q=${q}&api_key=${SERP_KEY}&num=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.images_results && data.images_results.length > 0) {
      return data.images_results[0].original || data.images_results[0].thumbnail;
    }
    return null;
  } catch { return null; }
}

export async function productRoutes(app) {
  app.get('/product/:id/prices', async (req) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const prod = await query('SELECT image_url FROM product WHERE id=$1', [id]);
    const prices = await query('SELECT sp.price, sp.is_promo as "isPromo", s.id as "storeId", s.name as "storeName", s.city, rc.name as "chainName" FROM store_price sp JOIN store s ON s.id=sp.store_id JOIN retailer_chain rc ON rc.id=s.chain_id WHERE sp.product_id=$1 ORDER BY sp.price LIMIT $2', [id, limit]);
    return { productId: +id, imageUrl: prod.rows[0]?.image_url || null, prices: prices.rows.map(r => ({ ...r, price: +r.price })) };
  });

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
