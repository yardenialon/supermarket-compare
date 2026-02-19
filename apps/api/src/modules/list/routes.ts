import { query } from '../../db.js';

export async function listRoutes(app) {
  app.post('/list', async (req) => {
    const { items, topN = 5, lat, lng, radiusKm } = req.body;
    if (!items || !items.length) return { bestStoreCandidates: [] };

    const pids = items.map(i => i.productId);

    let sql, params;
    if (lat && lng) {
      const radDeg = (radiusKm || 10) / 111;
      sql = `SELECT sp.store_id, sp.product_id, sp.price, sp.is_promo,
             s.name as store_name, s.city, rc.name as chain_name,
             ((s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3)) as dist
             FROM store_price sp
             JOIN store s ON s.id = sp.store_id
             JOIN retailer_chain rc ON rc.id = s.chain_id
             WHERE sp.product_id = ANY($1) AND s.lat IS NOT NULL
             AND s.lat BETWEEN $2 - $4 AND $2 + $4
             AND s.lng BETWEEN $3 - $4 AND $3 + $4`;
      params = [pids, parseFloat(lat), parseFloat(lng), radDeg];
    } else {
      sql = `SELECT sp.store_id, sp.product_id, sp.price,
             s.name as store_name, s.city, rc.name as chain_name
             FROM store_price sp
             JOIN store s ON s.id = sp.store_id
             JOIN retailer_chain rc ON rc.id = s.chain_id
             WHERE sp.product_id = ANY($1)`;
      params = [pids];
    }

    const { rows } = await query(sql, params);

    const sm = new Map();
    for (const r of rows) {
      if (!sm.has(r.store_id)) sm.set(r.store_id, { storeName: r.store_name, chainName: r.chain_name, city: r.city, dist: r.dist, prices: new Map() });
      const cur = sm.get(r.store_id).prices.get(r.product_id);
      if (!cur || +r.price < cur) sm.get(r.store_id).prices.set(r.product_id, +r.price);
    }

    const cands = [];
    for (const [sid, s] of sm) {
      let total = 0; const bd = []; let miss = 0;
      for (const it of items) {
        const p = s.prices.get(it.productId);
        if (p !== undefined) { total += p * it.qty; bd.push({ productId: it.productId, price: p, qty: it.qty, subtotal: +(p * it.qty).toFixed(2) }); }
        else miss++;
      }
      cands.push({ storeId: sid, storeName: s.storeName, chainName: s.chainName, city: s.city, dist: s.dist, total: +total.toFixed(2), availableCount: bd.length, missingCount: miss, breakdown: bd });
    }

    cands.sort((a, b) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : a.total - b.total);
    return { bestStoreCandidates: cands.slice(0, topN), totalStoresSearched: sm.size };
  });
}
