import { query } from '../../db.js';

// ─── Conditional promo engine (layer 2) ─────────────────────────────
// Applies a promo to a basket line only when the line's quantity meets the
// promo's min_qty. Club-only promos are tracked separately so the UI can
// toggle them. discounted_price semantics vary between chains (bundle total
// vs per-unit), so both readings are tried behind sanity guards and the
// cheaper valid one wins; promos that fit neither reading are ignored.
interface PromoRow { product_id: number; store_id: number; min_qty: any; club: boolean; discounted_price: any; }

async function fetchPromoIndex(pids: number[], storeIds?: number[]) {
  const params: any[] = [pids];
  let storeFilter = '';
  if (storeIds) { params.push(storeIds); storeFilter = 'AND pr.store_id = ANY($2)'; }
  const { rows } = await query(
    `SELECT pi.product_id, pr.store_id, pr.min_qty, pr.is_club_only as club, pr.discounted_price
     FROM promotion pr
     JOIN promotion_item pi ON pi.promotion_id = pr.id
     WHERE pi.product_id = ANY($1) ${storeFilter}
       AND pr.end_date > NOW() AND pr.discounted_price > 0`,
    params
  );
  const idx = new Map<string, PromoRow[]>();
  for (const r of rows as PromoRow[]) {
    const k = r.store_id + ':' + r.product_id;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k)!.push(r);
  }
  return idx;
}

// effective cost of q units at regular unit price p under this promo, or null
function promoLineCost(promo: PromoRow, p: number, q: number): number | null {
  const minQ = Math.max(1, Math.round(parseFloat(promo.min_qty) || 1));
  if (q < minQ) return null;
  const dp = +promo.discounted_price;
  if (!(dp > 0) || !(p > 0)) return null;
  const sane = (unit: number) => unit < p * 0.995 && unit > p * 0.2;
  if (minQ === 1) return sane(dp) ? dp * q : null;
  const candidates: number[] = [];
  if (sane(dp / minQ)) { // bundle total: "3 ב-30"
    const bundles = Math.floor(q / minQ);
    candidates.push(bundles * dp + (q - bundles * minQ) * p);
  }
  if (sane(dp)) candidates.push(dp * q); // per-unit price above a qty threshold
  return candidates.length ? Math.min(...candidates) : null;
}

// totals with promos applied: without club promos, and including them
function promoTotals(items: any[], storeId: number, prices: Map<number, number>, idx: Map<string, PromoRow[]>) {
  let effNoClub = 0, effClub = 0, any = false;
  for (const it of items) {
    const p = prices.get(it.productId);
    if (p === undefined) continue;
    const reg = p * it.qty;
    let bestNoClub = reg, bestClub = reg;
    for (const pr of idx.get(storeId + ':' + it.productId) ?? []) {
      const eff = promoLineCost(pr, p, it.qty);
      if (eff == null || eff >= reg) continue;
      any = true;
      if (!pr.club) bestNoClub = Math.min(bestNoClub, eff);
      bestClub = Math.min(bestClub, eff);
    }
    effNoClub += bestNoClub; effClub += bestClub;
  }
  if (!any) return {};
  return { promoTotal: +effNoClub.toFixed(2), promoClubTotal: +effClub.toFixed(2) };
}

export async function listRoutes(app) {
  app.post('/list', async (req) => {
    const { items, topN = 5, lat, lng, radiusKm } = req.body;
    if (!items || !items.length) return { bestStoreCandidates: [] };
    const pids = items.map(i => i.productId);
    let sql, params;
    if (lat && lng) {
      const radDeg = (radiusKm || 10) / 111;
      sql = `SELECT sp.store_id, sp.product_id, sp.price, sp.is_promo, sp.promo_price,
             s.name as store_name, s.city, rc.name as chain_name,
             s.subchain_name,
             ((s.lat - $2) * (s.lat - $2) + (s.lng - $3) * (s.lng - $3)) as dist
             FROM store_price sp
             JOIN store s ON s.id = sp.store_id
             JOIN retailer_chain rc ON rc.id = s.chain_id
             WHERE sp.product_id = ANY($1) AND s.lat IS NOT NULL
             AND s.lat BETWEEN $2 - $4 AND $2 + $4
             AND s.lng BETWEEN $3 - $4 AND $3 + $4`;
      params = [pids, parseFloat(lat), parseFloat(lng), radDeg];
    } else {
      sql = `SELECT sp.store_id, sp.product_id, sp.price, sp.promo_price,
             s.name as store_name, s.city, rc.name as chain_name,
             s.subchain_name
             FROM store_price sp
             JOIN store s ON s.id = sp.store_id
             JOIN retailer_chain rc ON rc.id = s.chain_id
             WHERE sp.product_id = ANY($1)`;
      params = [pids];
    }
    const { rows } = await query(sql, params);
    const promoIdx = await fetchPromoIndex(pids);
    const sm = new Map();
    for (const r of rows) {
      if (!sm.has(r.store_id)) sm.set(r.store_id, { storeName: r.store_name, chainName: r.chain_name, subchainName: r.subchain_name || null, city: r.city, dist: r.dist, prices: new Map(), promos: new Map() });
      const st = sm.get(r.store_id);
      const cur = st.prices.get(r.product_id);
      if (!cur || +r.price < cur) st.prices.set(r.product_id, +r.price);
      if (r.promo_price != null && +r.promo_price > 0) {
        const curP = st.promos.get(r.product_id);
        if (!curP || +r.promo_price < curP) st.promos.set(r.product_id, +r.promo_price);
      }
    }
    const cands = [];
    for (const [sid, s] of sm) {
      let total = 0; const bd = []; let miss = 0; let promoSavings = 0;
      for (const it of items) {
        const p = s.prices.get(it.productId);
        if (p !== undefined) {
          total += p * it.qty; bd.push({ productId: it.productId, price: p, qty: it.qty, subtotal: +(p * it.qty).toFixed(2) });
          // totals stay on regular prices; promo upside is reported separately
          // because promos may carry conditions (min qty / club membership)
          const pp = s.promos.get(it.productId);
          if (pp !== undefined && pp < p) promoSavings += (p - pp) * it.qty;
        }
        else miss++;
      }
      cands.push({ storeId: sid, storeName: s.storeName, chainName: s.chainName, subchainName: s.subchainName, city: s.city, dist: s.dist, total: +total.toFixed(2), availableCount: bd.length, missingCount: miss, promoSavings: +promoSavings.toFixed(2), ...promoTotals(items, sid, s.prices, promoIdx), breakdown: bd });
    }
    cands.sort((a, b) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : a.total - b.total);
    return { bestStoreCandidates: cands.slice(0, topN), totalStoresSearched: sm.size };
  });
}

// --- Shared Lists ---
import crypto from 'crypto';
export async function sharedListRoutes(app: any) {

  // NEW: השוואת סל לפי רשת - סניף אחד לכל רשת
  app.post('/list/by-chain', async (req: any) => {
    const { items } = req.body;
    if (!items || !items.length) return { chains: [] };
    const pids = items.map((i: any) => i.productId);

    const { rows } = await query(`
      SELECT sp.store_id, sp.product_id, sp.price, sp.promo_price,
             s.name as store_name, s.city, rc.name as chain_name,
             s.subchain_name
      FROM store_price sp
      JOIN store s ON s.id = sp.store_id
      JOIN retailer_chain rc ON rc.id = s.chain_id
      WHERE sp.product_id = ANY($1)
        AND s.lat IS NOT NULL
        AND s.city NOT ILIKE '%אילת%'
        AND s.city NOT ILIKE '%אינטרנט%'
        AND s.name NOT ILIKE '%אונליין%'
        AND s.name NOT ILIKE '%online%'
        AND s.name NOT ILIKE '%אינטרנט%'
    `, [pids]);
    const promoIdxBC = await fetchPromoIndex(pids);

    // Group by chain -> store -> products
    const chainMap = new Map<string, Map<number, any>>();
    for (const r of rows) {
      if (!chainMap.has(r.chain_name)) chainMap.set(r.chain_name, new Map());
      const storeMap = chainMap.get(r.chain_name)!;
      if (!storeMap.has(r.store_id)) storeMap.set(r.store_id, {
        storeId: r.store_id, storeName: r.store_name, city: r.city,
        subchainName: r.subchain_name || null, prices: new Map(), promos: new Map()
      });
      const st = storeMap.get(r.store_id)!;
      const cur = st.prices.get(r.product_id);
      if (!cur || +r.price < cur) st.prices.set(r.product_id, +r.price);
      if (r.promo_price != null && +r.promo_price > 0) {
        const curP = st.promos.get(r.product_id);
        if (!curP || +r.promo_price < curP) st.promos.set(r.product_id, +r.promo_price);
      }
    }

    // For each chain, find the best store (most products, then cheapest)
    const results = [];
    for (const [chainName, storeMap] of chainMap) {
      let bestStore: any = null;
      let bestTotal = Infinity;
      let bestAvailable = 0;

      for (const [, store] of storeMap) {
        let total = 0; let available = 0; const bd = []; let promoSavings = 0;
        for (const it of items) {
          const p = store.prices.get(it.productId);
          if (p !== undefined) {
            total += p * it.qty; available++; bd.push({ productId: it.productId, price: p, qty: it.qty, subtotal: +(p * it.qty).toFixed(2) });
            const pp = store.promos.get(it.productId);
            if (pp !== undefined && pp < p) promoSavings += (p - pp) * it.qty;
          }
        }
        if (available > bestAvailable || (available === bestAvailable && total < bestTotal)) {
          bestAvailable = available;
          bestTotal = total;
          bestStore = { ...store, total: +total.toFixed(2), availableCount: available, missingCount: items.length - available, promoSavings: +promoSavings.toFixed(2), ...promoTotals(items, store.storeId, store.prices, promoIdxBC), breakdown: bd };
        }
      }
      if (bestStore) results.push({ chainName, ...bestStore });
    }

    results.sort((a: any, b: any) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : a.total - b.total);
    return { chains: results };
  });

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
  2422651, 2422654, 2423255, 2426049, 2426048, 2422713,
  2425873, 2425876, 2425736, 2426297, 2426296, 2426300,
  2426298, 2426299, 2426302, 2426301, 2426363,
];

export async function onlineListRoutes(app: any) {
  app.post('/online-compare', async (req: any) => {
    const { items, topN = 10 } = req.body;
    if (!items || !items.length) return { bestStoreCandidates: [] };
    const pids = items.map((i: any) => i.productId);
    const { rows } = await query(
      `SELECT sp.store_id, sp.product_id, sp.price, sp.is_promo, sp.promo_price,
              s.name as store_name, s.city, rc.name as chain_name
       FROM store_price sp
       JOIN store s ON s.id = sp.store_id
       JOIN retailer_chain rc ON rc.id = s.chain_id
       WHERE sp.product_id = ANY($1) AND sp.store_id = ANY($2)`,
      [pids, ONLINE_STORE_IDS]
    );
    const promoIdxOC = await fetchPromoIndex(pids, ONLINE_STORE_IDS);
    const sm = new Map();
    for (const r of rows) {
      if (!sm.has(r.store_id)) sm.set(r.store_id, { storeName: r.store_name, chainName: r.chain_name, city: r.city, prices: new Map(), promos: new Map() });
      const st = sm.get(r.store_id);
      const cur = st.prices.get(r.product_id);
      if (!cur || +r.price < cur) st.prices.set(r.product_id, +r.price);
      if (r.promo_price != null && +r.promo_price > 0) {
        const curP = st.promos.get(r.product_id);
        if (!curP || +r.promo_price < curP) st.promos.set(r.product_id, +r.promo_price);
      }
    }
    const cands = [];
    for (const [sid, s] of sm) {
      let total = 0; const bd = []; let miss = 0; let promoSavings = 0;
      for (const it of items) {
        const p = s.prices.get(it.productId);
        if (p !== undefined) {
          total += p * it.qty; bd.push({ productId: it.productId, price: p, qty: it.qty, subtotal: +(p * it.qty).toFixed(2) });
          const pp = s.promos.get(it.productId);
          if (pp !== undefined && pp < p) promoSavings += (p - pp) * it.qty;
        }
        else miss++;
      }
      cands.push({ storeId: sid, storeName: s.storeName, chainName: s.chainName, city: s.city, total: +total.toFixed(2), availableCount: bd.length, missingCount: miss, promoSavings: +promoSavings.toFixed(2), ...promoTotals(items, sid, s.prices, promoIdxOC), breakdown: bd });
    }
    cands.sort((a, b) => a.missingCount !== b.missingCount ? a.missingCount - b.missingCount : a.total - b.total);
    return { bestStoreCandidates: cands.slice(0, topN), totalStoresSearched: sm.size };
  });
}
