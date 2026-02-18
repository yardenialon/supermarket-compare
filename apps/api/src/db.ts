import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 20, ssl: { rejectUnauthorized: false } });
export async function query(text, params) { return pool.query(text, params); }
export { pool };
