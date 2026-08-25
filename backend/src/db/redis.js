// Redis client · OPTIONAL, for horizontally-scaled deployments.
//
// When REDIS_URL is set (e.g. redis://host:6379), rate-limit buckets
// move to Redis so every API instance shares the same budgets. When it
// is unset (local dev, single instance, tests) this exports null and
// the limiters keep their in-memory stores — zero behavior change.
//
// For Upstash: supports both native Redis protocol and REST API. If DNS
// resolution fails (Railway networking issue), set UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN instead.
let client = null;

function getRedis() {
  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) return null;
  if (!client) {
    // Try native Redis protocol first (ioredis) — supports all commands including
    // Lua scripts needed by rate-limit-redis. Only fall back to REST API if this fails.
    if (process.env.REDIS_URL) {
      const Redis = require('ioredis');

      // Upstash uses TLS even with redis:// URLs (not rediss://)
      const isUpstash = process.env.REDIS_URL.includes('upstash.io');
      const needsTls = process.env.REDIS_URL.startsWith('rediss://') || isUpstash;

      client = new Redis(process.env.REDIS_URL, {
        // Upstash-compatible settings: TLS required, family 6 for IPv6 support
        tls: needsTls ? {} : undefined,
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
      client.on('connect', () => console.log('[redis] connected via native Redis protocol'));
      return client;
    }

    // Upstash REST API fallback: rate-limit-redis needs Lua script support
    // (EVAL/EVALSHA) which the REST client doesn't fully expose. If you see
    // rate-limit errors, set REDIS_URL (native protocol) instead.
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('[redis] REST API detected but rate-limit-redis needs native protocol; using in-memory rate limiting');
      return null;
    }
  }
  return client;
}

module.exports = { getRedis };
