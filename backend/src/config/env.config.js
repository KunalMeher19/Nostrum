// Boot-time environment validation · fail fast, loudly, before listen.
//
// Philosophy: a missing variable in development is an inconvenience; in
// production it is a silent outage (CORS_ORIGIN defaulting to localhost
// kills the portal) or a silent weakness (short AUTH_SECRET). So dev
// only enforces what the process literally cannot run without, and
// production refuses to start on anything misconfigured.

function assertBootEnv({ env = process.env } = {}) {
  const errors = [];
  const warnings = [];
  const isProd = env.NODE_ENV === 'production';

  if (!env.MONGODB_URI) errors.push('MONGODB_URI is not set.');
  if (!env.AUTH_SECRET) {
    errors.push('AUTH_SECRET is not set (must match the Next.js app).');
  } else if (isProd && env.AUTH_SECRET.length < 32) {
    errors.push('AUTH_SECRET is shorter than 32 chars; generate one with `npx auth secret`.');
  }

  if (isProd) {
    const origins = (env.CORS_ORIGIN || '').trim();
    if (!origins) {
      errors.push('CORS_ORIGIN is not set; the API would only accept localhost:3000.');
    } else if (/localhost|127\.0\.0\.1/.test(origins)) {
      errors.push('CORS_ORIGIN contains a localhost origin in production.');
    }
    if (!env.TRUST_PROXY) {
      // Not fatal: a bare VM with no proxy is legitimate. But behind
      // Vercel/nginx/CF (the expected deploys) forgetting this merges
      // every visitor into one rate-limit bucket.
      warnings.push(
        'TRUST_PROXY is not set; if the API sits behind a reverse proxy, rate limits will key on the proxy IP.'
      );
    }
  }

  for (const w of warnings) console.warn(`[env] WARNING: ${w}`);
  if (errors.length) {
    throw new Error(
      `Refusing to start, environment is misconfigured:\n${errors
        .map((e) => `  - ${e}`)
        .join('\n')}`
    );
  }
}

module.exports = { assertBootEnv };
