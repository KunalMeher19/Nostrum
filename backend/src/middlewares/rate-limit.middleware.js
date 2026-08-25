// Rate limiting · express-rate-limit with tiered budgets.
//
// Keying: per client IP (the library's default key generator, which
// handles IPv6 subnets correctly). Behind a reverse proxy set
// TRUST_PROXY=<hops> so req.ip is the real client, not the proxy —
// otherwise every visitor would share the proxy's bucket.
//
// Store: in-memory (per process) by default — fine for a single
// instance. Set REDIS_URL to move the buckets to Redis (rate-limit-redis
// via src/db/redis.js) so horizontally-scaled instances share budgets.
// Alternatively, use UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// for HTTP-based Redis access (no DNS issues on Railway).
const { rateLimit } = require('express-rate-limit');
const tiers = require('../config/rate-limit.config');
const { getRedis, isRestClient } = require('../db/redis');
const { UpstashRestStore } = require('./upstash-rest-store');

const SESSION_COOKIE = 'authjs.session-token'; // matches auth.middleware

// Deliberately a cheap string check, NOT a decrypt: verifying the JWE
// here would double the crypto work on every request just to pick a
// rate tier. Known trade-off: a scanner can skip the anon tier by
// sending any cookie with this name — it then still faces the global
// tier (300/min) and 401s at every auth gate. Acceptable.
function hasSessionCookie(req) {
  return (req.headers.cookie || '').includes(SESSION_COOKIE);
}

// One shared-store factory per limiter (each limiter needs its own
// prefix so tiers don't collide on the same Redis keys).
let storeSeq = 0;
function makeStore() {
  const redis = getRedis();
  if (!redis) return undefined; // in-memory default

  // Check if it's a REST client (Upstash REST API)
  if (isRestClient(redis)) {
    return new UpstashRestStore(redis, `rl:${storeSeq++}:`);
  }

  // Native ioredis client - use rate-limit-redis
  const { RedisStore } = require('rate-limit-redis');
  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${storeSeq++}:`,
  });
}

function makeLimiter(tier, options = {}) {
  return rateLimit({
    windowMs: tier.windowMs,
    limit: tier.max,
    standardHeaders: 'draft-7', // RateLimit + Retry-After headers
    legacyHeaders: false,
    store: makeStore(),
    // JSON body consistent with the rest of the API. Genuine clients
    // (the portals) surface this as a soft "slow down" state.
    handler: (req, res) => {
      res.status(429).json({
        error: 'too_many_requests',
        retryAfterSeconds: Math.ceil(tier.windowMs / 1000),
      });
    },
    ...options,
  });
}

// Global backstop for the whole API.
const globalLimiter = makeLimiter(tiers.global);

// Tighter budget for requests that carry no session at all — scanners,
// brute-force probes, 401 farming. Signed-in traffic skips this tier
// (it already passed the global limiter and must authenticate anyway).
const anonLimiter = makeLimiter(tiers.anon, {
  skip: hasSessionCookie,
});

// Mutations: profile updates, order status changes, product edits.
const writeLimiter = makeLimiter(tiers.write);

// Expensive responses: PDF invoices, CSV exports.
const heavyLimiter = makeLimiter(tiers.heavy);

// Public unauthenticated writes: contact form, newsletter signup.
const publicWriteLimiter = makeLimiter(tiers.publicWrite);

module.exports = {
  globalLimiter,
  anonLimiter,
  writeLimiter,
  heavyLimiter,
  publicWriteLimiter,
  makeLimiter,
};
