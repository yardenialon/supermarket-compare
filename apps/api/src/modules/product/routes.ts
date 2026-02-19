import { query } from '../../db.js';

export async function listRoutes(app) {
  app.post('/list', async (req) => {
    const { items, topN = 5, lat, lng, radiusKm } = req.body;
    if (!items || !items.length) return { bestStoreCandidates: [] };

    const productIds = items.map(i => i.productId);
    const qtyMap = Object.fromEntries(items.map(i => [i.productId, i.qty]));

    let storeFilter = '';
    const params = [productIds];

    if (lat && lng) {
      // Filter by location - find nearest store per chain within radius
      const radDeg = (radiusKm || 10) / 111; // approximate degrees
      storeFilter = `AND s.lat IS NOT NULL AND s.lat BETWEEN $2 - $4 AND $2 + $4 AND s.lng BETWEEN $3 - $4 AND $3 + $4`;
      params.push(parseFloat(lat), parseFloat(lng), radDeg);
    }

    const sql = `
      SELECT sp.store_id, s.name as store_name, rc.name as chain_name, s.city,
             sp.product_id, sp.price, sp.is_promo
             ${lat && lng ? `, ((s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3)) as dist` : ''}
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE sp.product_id = ANY($1) ${storeFilter}
      ORDER BY sp.store_id
    `;

    const { rows } = await query(sql, params);

    // Group by store
    const storeMap = {};
    for (const row of rows) {
      const key = row.store_id;
      if (!storeMap[key]) {
        storeMap[key] = {
          storeId: row.store_id,
          storeName: row.store_name,
          chainName: row.chain_name,
          city: row.city,
          dist: row.dist,
          items: {}
        };
      }
      const pid = row.product_id;
      // Keep cheapest price per product per store
      if (!storeMap[key].items[pid] || row.price < storeMap[key].items[pid].price) {
        storeMap[key].items[pid] = { price: +row.price, isPromo: row.is_promo };
      }
    }

    // Calculate totals
    const candidates = Object.values(storeMap).map((store: any) => {
      let total = 0;
      const breakdown = [];
      let availableCount = 0;
      let missingCount = 0;

      for (const pid of productIds) {
        const qty = qtyMap[pid];
        if (store.items[pid]) {
          const sub = store.items[pid].price * qty;
          total += sub;
          availableCount++;
          breakdown.push({ productId: pid, price: store.items[pid].price, qty, subtotal: sub });
        } else {
          missingCount++;
        }
      }

      return {
        storeId: store.storeId,
        storeName: store.storeName,
        chainName: store.chainName,
        city: store.city,
        dist: store.dist,
        total: Math.round(total * 100) / 100,
        availableCount,
        missingCount,
        breakdown
      };
    });

    // Sort: most items found first, then cheapest
    candidates.sort((a, b) => {
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      return a.total - b.total;
    });

    return { bestStoreCandidates: candidates.slice(0, topN) };
  });
}
