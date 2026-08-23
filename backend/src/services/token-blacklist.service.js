// Token blacklist · Redis-backed logout enforcement.
//
// Auth.js sessions are JWTs with a long TTL (30 days by default). When a
// user signs out via the frontend, Auth.js clears the browser cookie BUT
// the token itself remains valid until expiry — anyone who captured it
// could replay it. This module provides instant logout: blacklist the
// token's jti (unique ID) in Redis, checked on every API request.
//
// Redis key pattern: `blacklist:${jti}`
// TTL: matches the token's remaining lifetime (exp - now)
//
// When REDIS_URL is unset: falls back to in-memory Map (single instance,
// dev mode) with periodic cleanup. Production should always use Redis.
const { getRedis } = require('../db/redis');

// In-memory fallback when Redis is unavailable
const memoryBlacklist = new Map(); // Map<jti, expiresAt>

// Cleanup expired entries every 5 minutes (in-memory only)
setInterval(() => {
  const now = Date.now();
  for (const [jti, expiresAt] of memoryBlacklist.entries()) {
    if (now >= expiresAt) {
      memoryBlacklist.delete(jti);
    }
  }
}, 5 * 60 * 1000);

/**
 * Blacklist a token so it can no longer be used for authentication.
 *
 * @param {string} jti - Token unique identifier (payload.jti)
 * @param {number} exp - Token expiration timestamp (payload.exp, seconds since epoch)
 */
async function blacklistToken(jti, exp) {
  if (!jti) return; // No jti = cannot blacklist

  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = Math.max(0, exp - now);

  if (ttlSeconds === 0) {
    // Token already expired, no need to blacklist
    return;
  }

  if (redis) {
    // Redis mode: store with TTL (auto-expires when token would expire)
    await redis.setex(`blacklist:${jti}`, ttlSeconds, '1');
  } else {
    // In-memory mode: store with expiration timestamp
    memoryBlacklist.set(jti, exp * 1000); // Convert to milliseconds
  }
}

/**
 * Check if a token is blacklisted (logged out).
 *
 * @param {string} jti - Token unique identifier (payload.jti)
 * @returns {Promise<boolean>} - true if blacklisted, false otherwise
 */
async function isBlacklisted(jti) {
  if (!jti) return false; // No jti = cannot be blacklisted

  const redis = getRedis();

  if (redis) {
    // Redis mode: check if key exists
    const exists = await redis.exists(`blacklist:${jti}`);
    return exists === 1;
  } else {
    // In-memory mode: check if exists and not expired
    const expiresAt = memoryBlacklist.get(jti);
    if (!expiresAt) return false;

    const now = Date.now();
    if (now >= expiresAt) {
      memoryBlacklist.delete(jti); // Clean up expired
      return false;
    }

    return true;
  }
}

/**
 * Clear all blacklisted tokens (admin utility, use with caution).
 * Only clears the in-memory fallback; Redis keys expire naturally.
 */
function clearBlacklist() {
  memoryBlacklist.clear();
}

module.exports = {
  blacklistToken,
  isBlacklisted,
  clearBlacklist,
};
