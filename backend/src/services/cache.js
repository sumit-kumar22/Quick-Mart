import { createClient } from 'redis';
import { env } from '../config/env.js';

let client = null;
const memStore = new Map();
const memTimers = new Map();

export const cache = {
  async connect() {
    if (!env.redisUrl) return;
    try {
      client = createClient({ url: env.redisUrl });
      client.on('error', () => {});
      await client.connect();
      console.log('[cache] Redis connected');
    } catch (err) {
      console.warn(`[cache] Redis unavailable, using in-memory cache (${err.message})`);
      client = null;
    }
  },

  async get(key) {
    if (client?.isReady) {
      const raw = await client.get(key);
      return raw == null ? null : JSON.parse(raw);
    }
    const hit = memStore.get(key);
    if (hit == null) return null;
    if (hit.expires && hit.expires < Date.now()) {
      memStore.delete(key);
      return null;
    }
    return hit.value;
  },

  async set(key, value, ttlSeconds = 300) {
    if (client?.isReady) {
      try { await client.set(key, JSON.stringify(value), { EX: ttlSeconds }); } catch { /* noop */ }
      return;
    }
    memStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    const prev = memTimers.get(key);
    if (prev) clearTimeout(prev);
    memTimers.set(
      key,
      setTimeout(() => memStore.delete(key), ttlSeconds * 1000)
    );
  },

  async del(key) {
    if (client?.isReady) {
      try { await client.del(key); } catch { /* noop */ }
      return;
    }
    memStore.delete(key);
    const t = memTimers.get(key);
    if (t) clearTimeout(t);
    memTimers.delete(key);
  },

  async flush() {
    if (client?.isReady) {
      try { await client.flushDb(); } catch { /* noop */ }
    }
    memStore.clear();
    for (const t of memTimers.values()) clearTimeout(t);
    memTimers.clear();
  },

  async disconnect() {
    if (client?.isReady) await client.disconnect();
  },
};

export default cache;