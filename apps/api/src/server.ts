import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { searchRoutes } from './modules/search/routes.js';
import { productRoutes } from './modules/product/routes.js';
import { listRoutes, sharedListRoutes, onlineListRoutes } from './modules/list/routes.js';
import { storeRoutes } from './modules/store/routes.js';
import { statusRoutes } from './modules/status/routes.js';
import { receiptRoutes } from './modules/receipt/routes.js';
import { dealsRoutes } from './modules/deals/routes.js';
import { authRoutes } from './modules/auth/routes.js';

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: process.env.CORS_ORIGIN || '*', credentials: true });
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => { try { done(null, JSON.parse(body as string)); } catch(e) { done(e as Error, undefined); } });
  await app.register(cookie);
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  await app.register(searchRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(listRoutes, { prefix: '/api' });
  await app.register(sharedListRoutes, { prefix: '/api' });
  await app.register(onlineListRoutes, { prefix: '/api' });
  await app.register(storeRoutes, { prefix: '/api' });
  await app.register(statusRoutes);
  await app.register(receiptRoutes, { prefix: '/api' });
  await app.register(dealsRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  const port = parseInt(process.env.API_PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });
}
main().catch(err => { console.error(err); process.exit(1); });
