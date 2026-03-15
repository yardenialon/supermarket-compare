import pg from 'pg';
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  max: 10, 
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// keepalive — מונע מ-Neon לעבור למצב Idle
setInterval(async () => {
  try { await pool.query('SELECT 1'); } catch {}
}, 4 * 60 * 1000);

export async function query(text, params?) { return pool.query(text, params); }
export { pool };
