import { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../../db.js';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleAuthRoutes(app: FastifyInstance) {
  app.post('/auth/google', async (req, reply) => {
    const { credential } = req.body as any;
    if (!credential) return reply.code(400).send({ error: 'חסר token' });

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) return reply.code(400).send({ error: 'לא ניתן לאמת' });

      const { email, name, picture, sub: googleId } = payload;

      // מצא או צור משתמש
      let userRes = await query(
        'SELECT id, phone, email, name FROM "user" WHERE email = $1 OR google_id = $2',
        [email, googleId]
      );

      let userId: number;
      if (userRes.rows.length) {
        userId = (userRes.rows[0] as any).id;
        // עדכן google_id אם חסר
        await query(
          'UPDATE "user" SET google_id=$1, name=COALESCE(name,$2), picture=COALESCE(picture,$3) WHERE id=$4',
          [googleId, name, picture, userId]
        );
      } else {
        // צור משתמש חדש
        const newUser = await query(
          'INSERT INTO "user" (email, google_id, name, picture) VALUES ($1, $2, $3, $4) RETURNING id',
          [email, googleId, name, picture]
        );
        userId = (newUser.rows[0] as any).id;
      }

      // צור session
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ימים
      await query(
        'INSERT INTO session (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expires]
      );

      reply.setCookie('session_token', token, {
        httpOnly: true, secure: true, sameSite: 'none',
        path: '/', expires
      });

      const user = await query('SELECT id, phone, email, name, picture FROM "user" WHERE id=$1', [userId]);
      return { success: true, user: user.rows[0], token };

    } catch (e: any) {
      return reply.code(401).send({ error: 'אימות נכשל: ' + e.message });
    }
  });
}
