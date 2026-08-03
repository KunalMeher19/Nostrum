// Rate limiting · express-rate-limit with tiered budgets.
//
// Keying: per client IP (the library's default key generator, which
// handles IPv6 subnets correctly). Behind a reverse proxy set
// TRUST_PROXY=<hops> so req.ip is the real client, not the proxy —
// otherwise every visitor would share the proxy's bucket.
//
// Store: in-memory (per process). Fine for a single instance; when the
// API scales horizontally, plug a shared store (rate-limit-redis via
// src/db/redis.js) into makeLimiter() and nothing else changes.
const { rateLimit } = require('express-rate-limit');
const tiers = require('../config/rate-limit.config');

const SESSION_COOKIE = 'authjs.session-token'; // matches auth.middleware

function hasSessionCookie(req) {
  return (req.headers.cookie || '').includes(SESSION_COOKIE);
}

function makeLimiter(tier, options = {}) {
  return rateLimit({
    windowMs: tier.windowMs,
    limit: tier.max,
    standardHeaders: 'draft-7', // RateLimit + Retry-After headers
    legacyHeaders: false,
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

module.exports = { globalLimiter, anonLimiter, writeLimiter, heavyLimiter, makeLimiter };
