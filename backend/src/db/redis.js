// Redis client · OPTIONAL, for horizontally-scaled deployments.
//
// When REDIS_URL is set (e.g. redis://host:6379), rate-limit buckets
// move to Redis so every API instance shares the same budgets. When it
// is unset (local dev, single instance, tests) this exports null and
// the limiters keep their in-memory stores — zero behavior change.
let client = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    // Lazy require: ioredis is only loaded when actually configured.
    const Redis = require('ioredis');
    client = new Redis(process.env.REDIS_URL, {
      // Upstash-compatible settings: TLS required, family 6 for IPv6 support
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
      family: 6, // Upstash uses IPv6
      // Fail fast instead of queueing commands forever if Redis is down;
      // express-rate-limit then surfaces the error, not a hung request.
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      // Upstash connection timeout
      connectTimeout: 10000,
      // Keep connection alive
      keepAlive: 30000,
    });
    client.on('error', (err) => console.error('[redis]', err.message));
    client.on('connect', () => console.log('[redis] connected to Upstash'));
  }
  return client;
}

module.exports = { getRedis };
