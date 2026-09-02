import pg from 'pg';
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  max: 10, 
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// keepalive חכם — רק בשעות פעילות (06:00–24:00 שעון ישראל).
// בלילה אין שאילתות דופק, כך ש-Neon יכול לרדת לאפס (scale to zero)
// ולחסוך שעות מחשוב. גולש בודד בלילה ישלם cold start של ~שנייה.
const israelHour = () =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jerusalem' }).format(new Date()));

setInterval(async () => {
  if (israelHour() < 6) return;
  try { await pool.query('SELECT 1'); } catch {}
}, 4 * 60 * 1000);

export async function query(text, params?) { return pool.query(text, params); }
export { pool };
