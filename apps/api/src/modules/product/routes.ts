import { query } from '../../db.js';

const GOOGLE_CX = 'e2d04ac793f3d4269';
const GOOGLE_KEY = 'AIzaSyCfVvxrOTZH1sgmRvu5a16RlskQAboVcy4';

async function fetchProductImage(barcode: string, name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(barcode + ' ' + name);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${q}&searchType=image&num=1&imgSize=medium`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }
    return null;
  } catch { return null; }
}

export async function productRoutes(app) {
  app.get('/product/:id/prices', async (req) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // Get product with image
    const prod = await query('SELECT id, barcode, name, image_url FROM product WHERE id=$1', [id]);
    const product = prod.rows[0];

    // If no cached image, fetch from Google and save
    if (product && !product.image_url && product.barcode) {
      const imgUrl = await fetchProductImage(product.barcode, product.name);
      if (imgUrl) {
        await query('UPDATE product SET image_url=$1 WHERE id=$2', [imgUrl, id]);
        product.image_url = imgUrl;
      }
    }

    const prices = await query('SELECT sp.price, sp.is_promo as "isPromo", s.id as "storeId", s.name as "storeName", s.city, rc.name as "chainName" FROM store_price sp JOIN store s ON s.id=sp.store_id JOIN retailer_chain rc ON rc.id=s.chain_id WHERE sp.product_id=$1 ORDER BY sp.price LIMIT $2', [id, limit]);

    return { productId: +id, imageUrl: product?.image_url || null, prices: prices.rows.map(r => ({ ...r, price: +r.price })) };
  });
}
