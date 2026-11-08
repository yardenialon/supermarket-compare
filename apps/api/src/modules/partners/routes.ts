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

// every application is stored in partner_application first (source of
// truth); this is only the notification layer. Sent through Resend
// (FormSubmit sits behind a Cloudflare browser challenge, so it rejects
// server-to-server calls). Needs RESEND_API_KEY on the API environment;
// without it the notification is skipped and only logged.
const NOTIFY_EMAIL = process.env.PARTNER_NOTIFY_EMAIL || 'yardenialon5@gmail.com';
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function notifyByEmail(fields: Record<string, string>) {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) { console.log('partner notify skipped: RESEND_API_KEY not set'); return; }
  try {
    const rows = Object.entries(fields)
      .filter(([, v]) => v)
      .map(([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f4;white-space:nowrap">${esc(k)}</td>
         <td style="padding:6px 12px">${esc(v)}</td></tr>`)
      .join('');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: process.env.PARTNER_NOTIFY_FROM || 'Savy <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        reply_to: fields['אימייל'] || undefined,
        subject: `🏪 פנייה חדשה מסאבי לעסקים: ${fields['שם העסק']}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif">
                 <h2 style="color:#059669">פנייה חדשה — סאבי לעסקים קטנים</h2>
                 <table style="border-collapse:collapse;border:1px solid #e7e5e4">${rows}</table>
               </div>`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    console.log('partner notify:', res.status, JSON.stringify(data).slice(0, 200));
  } catch (e: any) {
    console.error('partner notify failed:', e?.message);
  }
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
    // fire-and-forget: the user gets their confirmation from the DB insert;
    // the email is a notification and must not delay or fail the response
    void notifyByEmail({
      'שם העסק': businessName,
      'סוג': clean(b.storeType, 60),
      'עיר': clean(b.city, 60),
      'איש קשר': clean(b.contactName, 80),
      'טלפון': phone,
      'אימייל': email,
      'זכאות': clean(b.eligibility, 30),
      'הודעה': clean(b.message, 2000),
    });
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
