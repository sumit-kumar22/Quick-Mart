import http from 'node:http';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { cache } from './services/cache.js';
import { seedDatabase } from './config/seed.js';
import { setupSocketIO } from './sockets/index.js';
import { repo } from './data-access/repo.js';
import { COLLECTIONS } from './config/constants.js';
import app from './app.js';

async function start() {
  await connectDb();
  await cache.connect();

  if (env.seedOnStart) {
    try {
      await seedDatabase();
    } catch (err) {
      console.warn(`[server] seed skipped: ${err.message}`);
    }
  } else if (process.env.SEED_ON_START !== 'false') {
    const count = await repo.count(COLLECTIONS.USERS, {});
    if (count === 0) console.warn('[server] database is empty — run `npm run seed` to load demo data');
  }

  const server = http.createServer(app);
  setupSocketIO(server);

  server.listen(env.port, () => {
    console.log(`[server] QuickMart API running at http://localhost:${env.port}${env.apiPrefix}`);
    console.log(`[server] Client origin: ${env.clientUrl}`);
  });

  const shutdown = async () => {
    console.log('\n[server] shutting down...');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[server] fatal startup error', err);
  process.exit(1);
});