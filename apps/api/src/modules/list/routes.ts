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

// --- Shared Lists ---
import crypto from 'crypto';
export async function sharedListRoutes(app: any) {
  app.post('/shared-list', async (req: any) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return { error: 'items required' };
    const id = crypto.randomBytes(4).toString('hex');
    await query('INSERT INTO shared_list (id, items) VALUES ($1, $2)', [id, JSON.stringify(items)]);
    return { id, items };
  });
  app.get('/shared-list/:id', async (req: any) => {
    const { id } = req.params;
    const result = await query('SELECT items, created_at, updated_at FROM shared_list WHERE id=$1', [id]);
    if (!result.rows[0]) return { error: 'Not found' };
    return { id, items: result.rows[0].items, createdAt: result.rows[0].created_at, updatedAt: result.rows[0].updated_at };
  });
  app.put('/shared-list/:id', async (req: any) => {
    const { id } = req.params;
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return { error: 'items required' };
    const result = await query('UPDATE shared_list SET items=$1, updated_at=NOW() WHERE id=$2 RETURNING items, updated_at', [JSON.stringify(items), id]);
    if (!result.rows[0]) return { error: 'Not found' };
    return { id, items: result.rows[0].items, updatedAt: result.rows[0].updated_at };
  });
}

// --- Online Stores Compare ---
const ONLINE_STORE_IDS = [
  2422651,  // שופרסל ONLINE
  2422654,  // רמי לוי מרלוג
  2423255,  // חצי חינם משלוחים
  2426049,  // מחסני אשוק 97 אינטרנט
  2426048,  // מחסני אשוק 96 אינטרנט אילת
  2422713,  // Victory אינטרנט
  2425873,  // דור אלון עין שמר משלוחים
  2425876,  // דור אלון גן שמואל משלוחי
  2425736,  // קרפור אונליין
  2426297,  // שוק העיר אשקלון
  2426296,  // שוק העיר רמות
  2426300,  // שוק העיר בני ברק
  2426298,  // שוק העיר קרית גת
  2426299,  // שוק העיר כפר סבא
  2426302,  // שוק העיר אור ים
  2426301,  // שוק העיר רמלה
  2426363,  // Wolt מודיעין
];

export async function onlineListRoutes(app: any) {
  app.post('/online-compare', async (req: any) => {
    const { items, topN = 10 } = req.body;
    if (!items || !items.length) return { bestStoreCandidates: [] };
    const pids = items.map((i: any) => i.productId);
    const { rows } = await query(
      `SELECT sp.store_id, sp.product_id, sp.price, sp.is_promo,
              s.name as store_name, s.city, rc.name as chain_name
       FROM store_price sp
       JOIN store s ON s.id = sp.store_id
       JOIN retailer_chain rc ON rc.id = s.chain_id
       WHERE sp.product_id = ANY($1)
         AND sp.store_id = ANY($2)`,
      [pids, ONLINE_STORE_IDS]
    );
    const sm = new Map();
    for (const r of rows) {
      if (!sm.has(r.store_id)) {
        sm.set(r.store_id, { storeName: r.store_name, chainName: r.chain_name, city: r.city, prices: new Map() });
      }
      const cur = sm.get(r.store_id).prices.get(r.product_id);
      if (!cur || +r.price < cur) sm.get(r.store_id).prices.set(r.product_id, +r.price);
    }
    const cands = [];
    for (const [sid, s] of sm) {
      let total = 0; const bd = []; let miss = 0;
      for (const it of items) {
        const p = s.prices.get(it.productId);
        if (p !== undefined) {
          total += p * it.qty;
          bd.push({ productId: it.productId, price: p, qty: it.qty, subtotal: +(p * it.qty).toFixed(2) });
        } else { miss++; }
      }
      cands.push({ storeId: sid, storeName: s.storeName, chainName: s.chainName, city: s.city, total: +total.toFixed(2), availableCount: bd.length, missingCount: miss, breakdown: bd });
    }
    cands.sort((a, b) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : a.total - b.total);
    return { bestStoreCandidates: cands.slice(0, topN), totalStoresSearched: sm.size };
  });
}
