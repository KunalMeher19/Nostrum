// Auth middleware · verifies the Auth.js (NextAuth v5) session cookie.
//
// Auth.js v5 issues ENCRYPTED JWTs (JWE, dir + A256CBC-HS512) with a key
// derived from AUTH_SECRET via HKDF, salted with the cookie name. Sharing
// AUTH_SECRET between the Next.js app and this API lets Express decrypt
// the same session the browser already holds — no second login system.
//
// The frontend calls this API with `credentials: "include"`, so the
// session cookie rides along on same-site requests in dev (localhost).
const { jwtDecrypt } = require('jose');
const { hkdfSync } = require('crypto');
const User = require('../models/user.model');

const SESSION_COOKIES = [
  'authjs.session-token', // http (dev)
  '__Secure-authjs.session-token', // https (prod)
];

const keyCache = new Map();

function deriveKey(salt) {
  if (!keyCache.has(salt)) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('Missing AUTH_SECRET environment variable');
    keyCache.set(
      salt,
      new Uint8Array(
        hkdfSync(
          'sha256',
          secret,
          salt,
          `Auth.js Generated Encryption Key (${salt})`,
          64
        )
      )
    );
  }
  return keyCache.get(salt);
}

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

/** Extracts and decrypts the session token; returns payload or null. */
async function readSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  for (const name of SESSION_COOKIES) {
    let raw = cookies[name];
    if (!raw) {
      // Chunked cookies (large sessions) come as name.0, name.1, ...
      const chunks = Object.keys(cookies)
        .filter((k) => k.startsWith(`${name}.`))
        .sort()
        .map((k) => cookies[k]);
      raw = chunks.length ? chunks.join('') : null;
    }
    if (!raw) continue;
    try {
      const { payload } = await jwtDecrypt(raw, deriveKey(name), {
        clockTolerance: 15,
      });
      return payload;
    } catch {
      // Try the next cookie name.
    }
  }
  return null;
}

/** Requires a signed-in user. Attaches req.user = { id, email, name, role }. */
const requireAuth = async (req, res, next) => {
  try {
    const payload = await readSession(req);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });
    req.user = {
      id: String(payload.uid ?? payload.sub ?? ''),
      email: payload.email ?? null,
      name: payload.name ?? null,
      role: payload.role ?? 'customer',
    };
    next();
  } catch (err) {
    next(err);
  }
};

/** Requires a specific role (use after requireAuth). Trusts the role
 * claim inside the session token — fine for customer-tier gating. */
const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

/** Admin gate with instant revocation (use after requireAuth).
 *
 * The role inside the JWE is only as fresh as the session (up to its
 * full lifetime): a demoted or deleted admin would keep admin power
 * until expiry. Admin routes guard customer PII and shop money, so
 * they re-read the CURRENT role from the users collection on every
 * request — one indexed _id lookup. Customer routes keep trusting the
 * token; this cost is for the blast-radius tier only. */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'admin' || !/^[a-f0-9]{24}$/i.test(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const current = await User.findById(req.user.id).select('role').lean();
    if (!current || current.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, requireRole, requireAdmin, readSession };
