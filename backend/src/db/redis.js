// Redis client · OPTIONAL, for horizontally-scaled deployments.
//
// When REDIS_URL is set (e.g. redis://host:6379), rate-limit buckets
// move to Redis so every API instance shares the same budgets. When it
// is unset (local dev, single instance, tests) this exports null and
// the limiters keep their in-memory stores — zero behavior change.
//
// For Upstash: supports both native Redis protocol and REST API. If DNS
// resolution fails (Railway networking issue), use UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN for HTTP-based access.
let client = null;
let restClient = null;

function getRedis() {
  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) return null;

  if (!client && !restClient) {
    // Priority 1: Try native Redis protocol (ioredis) — supports all commands
    if (process.env.REDIS_URL) {
      const Redis = require('ioredis');

      // Upstash uses TLS even with redis:// URLs (not rediss://)
      const isUpstash = process.env.REDIS_URL.includes('upstash.io');
      const needsTls = process.env.REDIS_URL.startsWith('rediss://') || isUpstash;

      client = new Redis(process.env.REDIS_URL, {
        tls: needsTls ? {} : undefined,
        family: 6, // Upstash uses IPv6
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        keepAlive: 30000,
      });

      client.on('error', (err) => {
        if (err.code === 'ENOTFOUND' || err.message.includes('getaddrinfo')) {
          console.error('[redis] DNS resolution failed; falling back to REST API if available');
          client = null; // Mark as failed so we try REST next
        } else {
          console.error('[redis]', err.message);
        }
      });

      client.on('connect', () => console.log('[redis] connected via native Redis protocol'));
      return client;
    }

    // Priority 2: Upstash REST API (HTTP-based, no DNS issues on Railway)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = require('@upstash/redis');
      restClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('[redis] connected via Upstash REST API');
      return restClient;
    }
  }

  return client || restClient;
}

// Check if the client is a REST client (vs native ioredis)
function isRestClient(redis) {
  return redis && typeof redis.get === 'function' && !redis.call;
}

module.exports = { getRedis, isRestClient };
