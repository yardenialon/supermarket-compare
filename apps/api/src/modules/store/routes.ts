import { query } from '../../db.js';
export async function storeRoutes(app) {
  app.get('/stores', async () => { const r = await query('SELECT s.id, s.name, s.city, rc.name as "chainName" FROM store s JOIN retailer_chain rc ON rc.id=s.chain_id ORDER BY rc.name LIMIT 50'); return { stores: r.rows }; });
  app.get('/chains', async () => { const r = await query('SELECT rc.id, rc.name, rc.name_he as "nameHe", COUNT(DISTINCT s.id)::int as "storeCount" FROM retailer_chain rc LEFT JOIN store s ON s.chain_id=rc.id WHERE rc.is_active=true GROUP BY rc.id ORDER BY rc.name'); return { chains: r.rows }; });
  // מדד מחירים לפי רשת — מבוסס על מוצרים משותפים
  app.get('/price-index', async () => {
    // 100 המוצרים הנמכרים ביותר (עם הכי הרבה חנויות)
    const topProducts = await query(`
      SELECT id FROM product 
      WHERE store_count > 50
      ORDER BY store_count DESC 
      LIMIT 100
    `);
    const productIds = topProducts.rows.map((r: any) => r.id);
    
    // ממוצע מחיר לפי רשת עבור המוצרים האלה
    const result = await query(`
      SELECT 
        rc.name as chain,
        rc.name_he as "chainHe",
        COUNT(DISTINCT sp.product_id) as "productCount",
        ROUND(AVG(sp.price)::numeric, 2) as "avgPrice",
        ROUND(MIN(sp.price)::numeric, 2) as "minPrice",
        ROUND(MAX(sp.price)::numeric, 2) as "maxPrice"
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE sp.product_id = ANY($1)
        AND rc.is_active = true
        AND sp.price > 0
      GROUP BY rc.id, rc.name, rc.name_he
      HAVING COUNT(DISTINCT sp.product_id) >= 20
      ORDER BY "avgPrice" ASC
    `, [productIds]);

    // חישוב אינדקס יחסי (הזול ביותר = 100)
    const rows = result.rows as any[];
    const minAvg = Math.min(...rows.map(r => Number(r.avgPrice)));
    const indexed = rows.map(r => ({
      ...r,
      index: Math.round((Number(r.avgPrice) / minAvg) * 100),
      avgPrice: Number(r.avgPrice),
      minPrice: Number(r.minPrice),
      maxPrice: Number(r.maxPrice),
      productCount: Number(r.productCount),
    }));

    // השוואה לפי קטגוריה
    const categoryResult = await query(`
      SELECT 
        p.category,
        rc.name as chain,
        rc.name_he as "chainHe",
        ROUND(AVG(sp.price)::numeric, 2) as "avgPrice",
        COUNT(DISTINCT sp.product_id) as "productCount"
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      JOIN product p ON p.id = sp.product_id
      WHERE p.category IN ('מוצרי חלב', 'לחם ומאפה', 'משקאות', 'חטיפים וממתקים', 'שימורים ומזון יבש')
        AND rc.is_active = true
        AND sp.price > 0
        AND rc.name IN ('Shufersal', 'Rami Levy', 'Osher Ad', 'Carrefour', 'Yochananof', 'Hazi Hinam')
      GROUP BY p.category, rc.id, rc.name, rc.name_he
      HAVING COUNT(DISTINCT sp.product_id) >= 5
      ORDER BY p.category, "avgPrice" ASC
    `);

    return {
      updatedAt: new Date().toISOString(),
      chains: indexed,
      byCategory: categoryResult.rows.map((r: any) => ({
        ...r,
        avgPrice: Number(r.avgPrice),
        productCount: Number(r.productCount),
      })),
    };
  });
}