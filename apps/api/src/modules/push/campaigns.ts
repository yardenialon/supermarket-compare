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

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@savy.co.il',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
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
      const code = (r.reason as any)?.statusCode;
      // subscription expired or revoked — clean it up
      if (code === 404 || code === 410) {
        await query('DELETE FROM push_subscription WHERE endpoint=$1', [batch[j].endpoint]).catch(() => {});
      }
    }
  }

  await query(
    `UPDATE push_campaign SET status='sent', sent_at=NOW(), sent_count=$1, fail_count=$2 WHERE id=$3`,
    [sent, failed, camp.id]);
  console.log(`[push-campaign] done week=${camp.week}: sent=${sent} failed=${failed}`);
}

export function startCampaignWorker() {
  ensureTable().catch((e) => console.error('[push-campaign] ensureTable:', e.message));
  // first check a minute after boot, then every 15 minutes
  setTimeout(() => processPending().catch((e) => console.error('[push-campaign]', e.message)), 60 * 1000);
  setInterval(() => processPending().catch((e) => console.error('[push-campaign]', e.message)), 15 * 60 * 1000);
}
