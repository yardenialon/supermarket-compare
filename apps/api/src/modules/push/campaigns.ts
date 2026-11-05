import { query } from '../../db.js';

// Weekly push campaigns ("המתכון המשתלם של השבוע" and future campaigns).
//
// Split of responsibilities, chosen so no new secrets are needed anywhere:
// - A GitHub Actions cron (weekly-recipe-push.yml) computes the week's best
//   recipe from live prices/promos and INSERTs a row into push_campaign
//   (it already holds DATABASE_URL).
// - This worker, which runs inside the API where the VAPID keys live, polls
//   for pending campaigns and delivers them to every push subscriber.
// There is deliberately no public "send" endpoint — nothing to abuse.

const israelHour = () =>
  parseInt(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jerusalem' }).format(new Date()));

async function ensureTable() {
  await query(`CREATE TABLE IF NOT EXISTS push_campaign (
    id serial PRIMARY KEY,
    week text UNIQUE NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    url text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT NOW(),
    sent_at timestamptz,
    sent_count int DEFAULT 0,
    fail_count int DEFAULT 0
  )`);
  // personal price alerts: each subscription may carry the shopping-list
  // items it watches ({productId, name, basePrice}), synced from the client
  await query(`ALTER TABLE push_subscription ADD COLUMN IF NOT EXISTS watched_items jsonb`);
  await query(`CREATE TABLE IF NOT EXISTS push_alert_run (
    day date PRIMARY KEY,
    subs_checked int DEFAULT 0,
    alerts_sent int DEFAULT 0
  )`);
}

function getWebpush() {
  return import('web-push').then(({ default: webpush }) => {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@savy.co.il',
      (process.env.VAPID_PUBLIC_KEY || '').trim().split(/\s+/)[0],
      process.env.VAPID_PRIVATE_KEY!
    );
    return webpush;
  });
}

async function deleteIfGone(endpoint: string, err: any) {
  const code = err?.statusCode;
  if (code === 404 || code === 410) {
    await query('DELETE FROM push_subscription WHERE endpoint=$1', [endpoint]).catch(() => {});
  }
}

// ─── Personal price-drop alerts ──────────────────────────────────────
// Runs once a day in the early evening (after the 15:00 UTC price update
// lands) and pushes each subscriber whose watched list items dropped.
const DROP_PCT = 0.08;   // at least 8% down from the user's baseline
const DROP_MIN = 1;      // and at least ₪1 — a 10-agorot dip isn't news

async function processAlerts() {
  const h = israelHour();
  if (h < 18 || h >= 22) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  // once per day, atomically
  const claim = await query(
    `INSERT INTO push_alert_run (day) VALUES (CURRENT_DATE) ON CONFLICT (day) DO NOTHING RETURNING day`);
  if (!claim.rows.length) return;

  const subs = await query(
    `SELECT endpoint, p256dh, auth, watched_items FROM push_subscription
     WHERE watched_items IS NOT NULL AND jsonb_array_length(watched_items) > 0`);
  if (!subs.rows.length) {
    await query(`UPDATE push_alert_run SET subs_checked=0, alerts_sent=0 WHERE day=CURRENT_DATE`);
    return;
  }
  console.log(`[price-alerts] checking ${subs.rows.length} subscriptions`);

  // one price lookup for every watched product across all subscribers
  const allIds = [...new Set((subs.rows as any[]).flatMap((s) =>
    (s.watched_items as any[]).map((i) => Number(i.productId)).filter(Boolean)))];
  const priceRows = await query(`SELECT id, min_price FROM product WHERE id = ANY($1)`, [allIds]);
  const price = new Map((priceRows.rows as any[]).map((r) => [Number(r.id), r.min_price == null ? null : +r.min_price]));

  const webpush = await getWebpush();
  let alertsSent = 0;

  for (const sub of subs.rows as any[]) {
    const items = sub.watched_items as { productId: number; name: string; basePrice: number }[];
    const drops: { name: string; now: number; was: number }[] = [];
    let changed = false;

    for (const it of items) {
      const cur = price.get(Number(it.productId));
      if (cur == null || !(it.basePrice > 0)) continue;
      if (it.basePrice - cur >= Math.max(DROP_MIN, it.basePrice * DROP_PCT)) {
        drops.push({ name: it.name, now: cur, was: it.basePrice });
        it.basePrice = cur; // re-baseline so the same drop never alerts twice
        changed = true;
      } else if (cur > it.basePrice * 1.05) {
        it.basePrice = cur; // price went up — future drops measured from reality
        changed = true;
      }
    }

    if (drops.length) {
      drops.sort((a, b) => (b.was - b.now) / b.was - (a.was - a.now) / a.was);
      const top = drops[0];
      const pct = Math.round(((top.was - top.now) / top.was) * 100);
      const more = drops.length - 1;
      const payload = JSON.stringify({
        title: '📉 ירידת מחיר ברשימה שלך!',
        body: `${top.name}: ₪${top.now.toFixed(2)} (היה ₪${top.was.toFixed(2)}, ‎-${pct}%)` +
          (more > 0 ? ` · ועוד ${more === 1 ? 'מוצר אחד' : `${more} מוצרים`} שירדו` : '') +
          ' · בדקו איפה הכי זול ←',
        url: '/?tab=list',
      });
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        alertsSent++;
      } catch (e: any) {
        await deleteIfGone(sub.endpoint, e);
      }
    }
    if (changed) {
      await query('UPDATE push_subscription SET watched_items=$1 WHERE endpoint=$2',
        [JSON.stringify(items), sub.endpoint]).catch(() => {});
    }
  }

  await query(`UPDATE push_alert_run SET subs_checked=$1, alerts_sent=$2 WHERE day=CURRENT_DATE`,
    [subs.rows.length, alertsSent]);
  console.log(`[price-alerts] done: subs=${subs.rows.length} alerts=${alertsSent}`);
}

async function processPending() {
  // waking hours only — a nightly poll would also wake the scale-to-zero DB
  const h = israelHour();
  if (h < 7 || h >= 22) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  // claim exactly one pending campaign (atomic against restarts/doubles)
  const { rows } = await query(
    `UPDATE push_campaign SET status='sending'
     WHERE id = (SELECT id FROM push_campaign WHERE status='pending' ORDER BY id LIMIT 1)
     RETURNING *`);
  if (!rows.length) return;
  const camp = rows[0] as any;
  console.log(`[push-campaign] sending week=${camp.week} slug=${camp.slug}`);

  const webpush = await getWebpush();
  const payload = JSON.stringify({ title: camp.title, body: camp.body, url: camp.url });

  const subs = await query('SELECT endpoint, p256dh, auth FROM push_subscription');
  let sent = 0, failed = 0;
  const BATCH = 50;
  for (let i = 0; i < subs.rows.length; i += BATCH) {
    const batch = subs.rows.slice(i, i + BATCH) as any[];
    const results = await Promise.allSettled(batch.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
    ));
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled') { sent++; continue; }
      failed++;
      await deleteIfGone(batch[j].endpoint, r.reason); // expired/revoked subscription
    }
  }

  await query(
    `UPDATE push_campaign SET status='sent', sent_at=NOW(), sent_count=$1, fail_count=$2 WHERE id=$3`,
    [sent, failed, camp.id]);
  console.log(`[push-campaign] done week=${camp.week}: sent=${sent} failed=${failed}`);
}

export function startCampaignWorker() {
  ensureTable().catch((e) => console.error('[push-campaign] ensureTable:', e.message));
  const tick = () => {
    processPending().catch((e) => console.error('[push-campaign]', e.message));
    processAlerts().catch((e) => console.error('[price-alerts]', e.message));
  };
  // first check a minute after boot, then every 15 minutes
  setTimeout(tick, 60 * 1000);
  setInterval(tick, 15 * 60 * 1000);
}
