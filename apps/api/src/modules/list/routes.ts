import { query } from '../../db.js';
export async function listRoutes(app) {
  app.post('/list', async (req) => {
    const { items, topN = 5 } = req.body;
    const pids = items.map(i => i.productId);
    const rows = (await query('SELECT sp.store_id, sp.product_id, sp.price, s.name as store_name, s.city, rc.name as chain_name FROM store_price sp JOIN store s ON s.id=sp.store_id JOIN retailer_chain rc ON rc.id=s.chain_id WHERE sp.product_id=ANY($1)', [pids])).rows;
    const sm = new Map();
    for (const r of rows) { if (sm.has(r.store_id) === false) sm.set(r.store_id, { storeName:r.store_name, chainName:r.chain_name, city:r.city, prices:new Map() }); sm.get(r.store_id).prices.set(r.product_id, +r.price); }
    const cands = [];
    for (const [sid, s] of sm) { let total=0; const bd=[]; const miss=[];
      for (const it of items) { const p=s.prices.get(it.productId); if(p!==undefined){total+=p*it.qty;bd.push({productId:it.productId,price:p,qty:it.qty,subtotal:+(p*it.qty).toFixed(2)})}else miss.push(it.productId); }
      cands.push({storeId:sid,storeName:s.storeName,chainName:s.chainName,city:s.city,total:+total.toFixed(2),availableCount:bd.length,missingCount:miss.length,breakdown:bd}); }
    cands.sort((a,b)=>a.missingCount!==b.missingCount?a.missingCount-b.missingCount:a.total-b.total);
    return { bestStoreCandidates: cands.slice(0,topN), totalStoresSearched:sm.size };
  });
}
