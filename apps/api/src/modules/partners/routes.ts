import { FastifyInstance } from 'fastify';
import { query } from '../../db.js';

// "סאבי לעסקים קטנים" — onboarding applications from independent
// supermarkets, social markets and stock stores. These businesses are not
// covered by the price-transparency law, so their prices enter Savy through
// a manual partnership: the owner leaves details here, we contact them and
// ingest their price list (Excel / POS export / photo) into store_price.

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await query(`CREATE TABLE IF NOT EXISTS partner_application (
    id serial PRIMARY KEY,
    created_at timestamptz DEFAULT NOW(),
    business_name text NOT NULL,
    store_type text,
    city text,
    contact_name text,
    phone text,
    email text,
    message text,
    eligibility text,
    status text NOT NULL DEFAULT 'new'
  )`);
  tableReady = true;
}

// light per-IP throttle: the form is public and unauthenticated
const lastByIp = new Map<string, number>();

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export async function partnerRoutes(app: FastifyInstance) {
  app.post('/partners/apply', async (req, reply) => {
    await ensureTable();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const now = Date.now();
    if (lastByIp.size > 5000) lastByIp.clear();
    if (now - (lastByIp.get(ip) || 0) < 30_000)
      return reply.code(429).send({ error: 'נסו שוב בעוד רגע' });

    const b = (req.body || {}) as Record<string, unknown>;
    const businessName = clean(b.businessName, 120);
    const phone = clean(b.phone, 40);
    const email = clean(b.email, 120);
    if (businessName.length < 2)
      return reply.code(400).send({ error: 'חסר שם העסק' });
    if (!phone && !email)
      return reply.code(400).send({ error: 'צריך טלפון או אימייל כדי שנחזור אליכם' });

    lastByIp.set(ip, now);
    await query(
      `INSERT INTO partner_application
         (business_name, store_type, city, contact_name, phone, email, message, eligibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [businessName, clean(b.storeType, 60), clean(b.city, 60), clean(b.contactName, 80),
       phone, email, clean(b.message, 2000), clean(b.eligibility, 30)]
    );
    return { ok: true };
  });

  // admin-only listing (same gate as push/send-test): fail closed
  app.get('/partners/applications', async (req, reply) => {
    await ensureTable();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;
    if (!ADMIN_PASSWORD || (req.headers as any)['x-admin-key'] !== ADMIN_PASSWORD)
      return reply.code(401).send({ error: 'unauthorized' });
    const res = await query(
      `SELECT * FROM partner_application ORDER BY created_at DESC LIMIT 200`);
    return { applications: res.rows };
  });
}
