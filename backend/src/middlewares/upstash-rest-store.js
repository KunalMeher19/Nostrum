// Custom rate-limit store for Upstash REST API
//
// rate-limit-redis requires Lua script support (EVAL/EVALSHA) which
// Upstash REST API doesn't expose. This implements a compatible store
// using basic Redis commands (GET/SET/INCR/EXPIRE) that work over HTTP.

class UpstashRestStore {
  constructor(client, prefix = 'rl:') {
    this.client = client;
    this.prefix = prefix;
  }

  async increment(key) {
    const prefixedKey = this.prefix + key;

    try {
      // INCR returns the new value after increment
      const hits = await this.client.incr(prefixedKey);

      // If this is the first hit (hits === 1), set expiration
      if (hits === 1) {
        // Default to 60 seconds; the limiter will call resetKey with the correct windowMs
        await this.client.expire(prefixedKey, 60);
      }

      // Get TTL to return resetTime
      const ttl = await this.client.ttl(prefixedKey);
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

      return {
        totalHits: hits,
        resetTime,
      };
    } catch (err) {
      console.error('[rate-limit-store] Upstash increment error:', err);
      // express-rate-limit does NOT have an automatic in-memory fallback
      // Returning undefined causes TypeError when it tries to destructure
      // Instead, fail closed: throw so express-rate-limit returns 500
      // This is safer than allowing unlimited requests
      throw new Error('Rate limit store unavailable');
    }
  }

  async decrement(key) {
    const prefixedKey = this.prefix + key;

    try {
      const hits = await this.client.decr(prefixedKey);
      return {
        totalHits: Math.max(0, hits),
      };
    } catch (err) {
      console.error('[rate-limit-store] Upstash decrement error:', err);
      throw new Error('Rate limit store unavailable');
    }
  }

  async resetKey(key) {
    const prefixedKey = this.prefix + key;

    try {
      await this.client.del(prefixedKey);
    } catch (err) {
      console.error('[redis] resetKey failed:', err.message);
    }
  }

  // Initialize the store (called by express-rate-limit)
  async init(options) {
    // Store windowMs for proper TTL setting
    this.windowMs = options.windowMs;

    // Override increment to use the correct windowMs
    const originalIncrement = this.increment.bind(this);
    this.increment = async (key) => {
      const prefixedKey = this.prefix + key;

      try {
        const hits = await this.client.incr(prefixedKey);

        if (hits === 1) {
          // Set expiration in seconds (windowMs is in milliseconds)
          await this.client.expire(prefixedKey, Math.ceil(this.windowMs / 1000));
        }

        const ttl = await this.client.ttl(prefixedKey);
        const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

        return {
          totalHits: hits,
          resetTime,
        };
      } catch (err) {
        console.error('[redis] increment failed:', err.message);
        return undefined;
      }
    };
  }
}

module.exports = { UpstashRestStore };
