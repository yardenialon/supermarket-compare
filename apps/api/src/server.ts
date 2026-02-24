import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { searchRoutes } from './modules/search/routes.js';
import { productRoutes } from './modules/product/routes.js';
import { listRoutes, sharedListRoutes, onlineListRoutes } from './modules/list/routes.js';
import { storeRoutes } from './modules/store/routes.js';
import { statusRoutes } from './modules/status/routes.js';
const app = Fastify({ logger: true });
async function main() {
  await app.register(cors, { origin: process.env.CORS_ORIGIN || '*' });
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  await app.register(searchRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(listRoutes, { prefix: '/api' });
  await app.register(sharedListRoutes, { prefix: '/api' });
  await app.register(onlineListRoutes, { prefix: '/api' });
  await app.register(storeRoutes, { prefix: '/api' });
  await app.register(statusRoutes);
  const port = parseInt(process.env.API_PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });
}
main().catch(err => { console.error(err); process.exit(1); });

// TEMP: test open israel supermarkets API
app.get('/api/test-open-api', async () => {
  const res = await fetch('https://data.openisraelisupermarkets.co.il/analytics/promotions/product/7290004131074', {
    headers: { 'Authorization': 'Bearer 6e509ff7-00a4-490b-baa5-dde6e17e53fc' }
  });
  return res.json();
});
