import { query } from '../../db.js';
import crypto from 'crypto';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const JWT_SECRET = process.env.JWT_SECRET!;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '+972' + digits.slice(1);
  if (digits.startsWith('972')) return '+' + digits;
  return '+' + digits;
}

async function sendWhatsApp(to: string, code: string): Promise<boolean> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const body = new URLSearchParams({
      From: TWILIO_FROM,
      To: `whatsapp:${to}`,
      Body: `קוד האימות שלך ל-Savy הוא: *${code}*\nהקוד תקף ל-10 דקות.`,
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function authRoutes(app: any) {
  // שלח OTP
  app.post('/auth/send-otp', async (req: any, reply: any) => {
    const { phone } = req.body;
    if (!phone) return reply.code(400).send({ error: 'מספר טלפון חסר' });

    const normalizedPhone = normalizePhone(phone);

    // מחק OTP ישנים
    await query('DELETE FROM otp WHERE phone=$1 OR expires_at < NOW()', [normalizedPhone]);

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 דקות

    await query(
      'INSERT INTO otp (phone, code, expires_at) VALUES ($1, $2, $3)',
      [normalizedPhone, code, expiresAt]
    );

    const sent = await sendWhatsApp(normalizedPhone, code);
    if (!sent) return reply.code(500).send({ error: 'שגיאה בשליחת הודעה' });

    return { success: true, phone: normalizedPhone };
  });

  // אמת OTP
  app.post('/auth/verify-otp', async (req: any, reply: any) => {
    const { phone, code } = req.body;
    if (!phone || !code) return reply.code(400).send({ error: 'חסרים פרטים' });

    const normalizedPhone = normalizePhone(phone);

    const otpRes = await query(
      'SELECT id FROM otp WHERE phone=$1 AND code=$2 AND expires_at > NOW() AND used=FALSE',
      [normalizedPhone, code]
    );

    if (!otpRes.rows.length) {
      return reply.code(401).send({ error: 'קוד שגוי או שפג תוקפו' });
    }

    // סמן OTP כמשומש
    await query('UPDATE otp SET used=TRUE WHERE id=$1', [(otpRes.rows[0] as any).id]);

    // צור או מצא יוזר
    let userRes = await query('SELECT id, phone, name FROM "user" WHERE phone=$1', [normalizedPhone]);
    if (!userRes.rows.length) {
      userRes = await query(
        'INSERT INTO "user" (phone) VALUES ($1) RETURNING id, phone, name',
        [normalizedPhone]
      );
    }
    const user = userRes.rows[0] as any;

    // צור session
    const token = generateToken();
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 יום
    await query(
      'INSERT INTO session (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, sessionExpires]
    );

    reply.setCookie('session_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: sessionExpires,
    });

    return { success: true, user };
  });

  // מי אני
  app.get('/auth/me', async (req: any, reply: any) => {
    const token = req.cookies?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });

    const res = await query(
      `SELECT u.id, u.phone, u.name
       FROM session s JOIN "user" u ON u.id = s.user_id
       WHERE s.token=$1 AND s.expires_at > NOW()`,
      [token]
    );

    if (!res.rows.length) return reply.code(401).send({ error: 'סשן לא תקף' });
    return { user: res.rows[0] };
  });

  // התנתקות
  app.post('/auth/logout', async (req: any, reply: any) => {
    const token = req.cookies?.session_token;
    if (token) await query('DELETE FROM session WHERE token=$1', [token]);
    reply.clearCookie('session_token', { path: '/' });
    return { success: true };
  });

  // שמור סל לענן
  app.post('/auth/cart', async (req: any, reply: any) => {
    const token = req.cookies?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });

    const sessionRes = await query(
      'SELECT user_id FROM session WHERE token=$1 AND expires_at > NOW()',
      [token]
    );
    if (!sessionRes.rows.length) return reply.code(401).send({ error: 'סשן לא תקף' });

    const { name, items } = req.body;
    const userId = (sessionRes.rows[0] as any).user_id;

    await query(
      `INSERT INTO cart (user_id, name, items)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET name=$2, items=$3, updated_at=NOW()`,
      [userId, name || 'הסל שלי', JSON.stringify(items)]
    );

    return { success: true };
  });

  // טען סל מהענן
  app.get('/auth/cart', async (req: any, reply: any) => {
    const token = req.cookies?.session_token;
    if (!token) return reply.code(401).send({ error: 'לא מחובר' });

    const res = await query(
      `SELECT c.name, c.items, c.updated_at
       FROM cart c
       JOIN session s ON s.user_id = c.user_id
       WHERE s.token=$1 AND s.expires_at > NOW()`,
      [token]
    );

    if (!res.rows.length) return { cart: null };
    return { cart: res.rows[0] };
  });
}
