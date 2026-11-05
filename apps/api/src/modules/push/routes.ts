import { FastifyInstance } from 'fastify';
import { query } from '../../db.js';

export async function pushRoutes(app: FastifyInstance) {
  // first whitespace-separated token only: if the env var was pasted with
  // extra lines (it happened — VAPID_PRIVATE_KEY ended up inside it and was
  // served publicly), nothing beyond the public key ever leaves the server
  app.get('/push/vapid-key', async () => ({
    publicKey: (process.env.VAPID_PUBLIC_KEY || '').trim().split(/\s+/)[0] || null
  }));

  app.post('/push/subscribe', async (req, reply) => {
    const { endpoint, p256dh, auth } = req.body as any;
    if (!endpoint || !p256dh || !auth)
      return reply.code(400).send({ error: 'חסרים פרטים' });
    const token = (req.cookies as any)?.session_token;
    let userId = null;
    if (token) {
      const res = await query('SELECT user_id FROM session WHERE token=$1 AND expires_at > NOW()', [token]);
      if (res.rows.length) userId = (res.rows[0] as any).user_id;
    }
    await query(`
      INSERT INTO push_subscription (endpoint, p256dh, auth, user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) DO UPDATE 
      SET p256dh=$2, auth=$3, user_id=COALESCE($4, push_subscription.user_id), last_used=NOW()
    `, [endpoint, p256dh, auth, userId]);
    return { success: true };
  });

  app.post('/push/unsubscribe', async (req, reply) => {
    const { endpoint } = req.body as any;
    if (!endpoint) return reply.code(400).send({ error: 'חסר endpoint' });
    await query('DELETE FROM push_subscription WHERE endpoint=$1', [endpoint]);
    return { success: true };
  });

  app.post('/push/send-test', async (req, reply) => {
    // fail closed — this can blast every subscriber, admin only
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;
    if (!ADMIN_PASSWORD || (req.headers as any)['x-admin-key'] !== ADMIN_PASSWORD)
      return reply.code(401).send({ error: 'Unauthorized' });
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
      return reply.code(503).send({ error: 'VAPID keys not configured' });

    const webpush = await import('web-push');
    webpush.default.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@savy.co.il',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { endpoint, title, body, url } = req.body as any;
    const payload = JSON.stringify({ title: title || 'Savy', body: body || 'התראת טסט!', url: url || '/' });
    try {
      if (endpoint) {
        const res = await query('SELECT * FROM push_subscription WHERE endpoint=$1', [endpoint]);
        if (!res.rows.length) return reply.code(404).send({ error: 'לא נמצא' });
        const sub = res.rows[0] as any;
        await webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      } else {
        const res = await query('SELECT * FROM push_subscription LIMIT 100', []);
        await Promise.allSettled(
          res.rows.map((sub: any) =>
            webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          )
        );
      }
      return { success: true };
    } catch (e: any) {
      return reply.code(500).send({ error: e.message });
    }
  });
}
