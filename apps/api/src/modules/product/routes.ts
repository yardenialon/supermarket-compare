import { query } from '../../db.js';
const SERP_KEY = '2e3660ec2b969459b9841800dc63c8e9aa6cf88aad1e3d707c3e799acfa2a778';
const TRUSTED_DOMAINS = ['shufersal.co.il', 'rfranco.com', 'tnuva.co.il', 'mybundles.co.il', 'mega.co.il', 'victoria.co.il', 'osheread.co.il', 'ramielevy.co.il', 'pricez.co.il', 'ha-pricelist.co.il', 'super-pharm.co.il', 'schnellers.co.il', 'yochananof.co.il'];
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
  app.get('/product/:id/prices', async (req: any) => {
    const { id } = req.params;
    const { lat, lng } = req.query;
    const prod = await query('SELECT image_url FROM product WHERE id=$1', [id]);
    let prices;
    if (lat && lng) {
      const uLat = parseFloat(lat as string);
      const uLng = parseFloat(lng as string);
      prices = await query(`
        SELECT
          sp.price, sp.is_promo as "isPromo",
          s.id as "storeId", s.name as "storeName", s.city,
          rc.name as "chainName",
          s.subchain_name as "subchainName",
          ((s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3)) as dist
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE sp.product_id = $1 AND s.lat IS NOT NULL
        ORDER BY dist ASC
        LIMIT 50
      `, [id, uLat, uLng]);
    } else {
      prices = await query(`
        SELECT
          sp.price, sp.is_promo as "isPromo",
          s.id as "storeId", s.name as "storeName", s.city,
          rc.name as "chainName",
          s.subchain_name as "subchainName"
        FROM store_price sp
        JOIN store s ON s.id = sp.store_id
        JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE sp.product_id = $1
        ORDER BY sp.price ASC
        LIMIT 50
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
    if (img) {
      await query('UPDATE product SET image_url=$1 WHERE id=$2', [img, id]);
    }
    return { imageUrl: img };
  });
}
