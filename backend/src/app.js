const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const {
  globalLimiter,
  anonLimiter,
} = require('./middlewares/rate-limit.middleware');
const { sanitizeBody } = require('./middlewares/sanitize.middleware');

const healthRoutes = require('./routes/health.routes');
const meRoutes = require('./routes/me.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');
const journalRoutes = require('./routes/journal.routes');
const contactRoutes = require('./routes/contact.routes');
const newsletterRoutes = require('./routes/newsletter.routes');

const app = express();

// Behind a reverse proxy (Vercel/nginx/CF) set TRUST_PROXY to the number
// of hops so req.ip — and therefore rate-limit buckets — is the real
// client address. 0 (default) = trust nothing, use the socket address.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

// "simple" query parser: query values are flat strings, never nested
// objects — closes ?email[$ne]=x style operator injection via req.query.
app.set('query parser', 'simple');

app.use(helmet());

// CORS: explicit allowlist only. Never a wildcard — this API runs on
// credentials (session cookie), and `*` + credentials is both invalid
// per spec and a misconfiguration trap. Unlisted origins get no CORS
// headers at all (same-origin / server-to-server calls still work).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, origin ?? false);
      cb(null, false);
    },
    credentials: true,
  })
);

// Cross-site mutation guard: browsers attach the Origin header to every
// cross-origin (and most same-origin) non-GET request. A mutation
// arriving from an origin we don't serve is rejected outright — CSRF
// belt-and-braces on top of SameSite=Lax cookies and CORS. Requests
// with NO Origin (curl, server-to-server, supertest) pass: they can't
// carry a victim's cookie, which is the attack this blocks.
app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin)) return next();
  res.status(403).json({ error: 'origin_not_allowed' });
});

// Body limits: portal payloads are tiny (profile, status changes,
// product edits, journal posts). 200kb caps memory abuse while leaving
// generous headroom for post content. JSON ONLY — no urlencoded parser:
// nothing consumes form bodies, and refusing them removes the classic
// no-preflight HTML-form request class entirely.
app.use(express.json({ limit: '200kb' }));
app.use(sanitizeBody);

// Rate limiting: global backstop for every request, plus a tighter
// budget for cookie-less traffic (scanners / brute-force probes).
// Route files add stricter tiers for writes and heavy responses.
app.use('/api', globalLimiter, anonLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/me', meRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler. Client mistakes map to 4xx; everything else is
// a 500 whose details stay in the logs — never in the response.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json' });
  }
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: 'invalid_request' });
  }
  const status = err.status || 500;
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({
    error: status < 500 && err.message ? err.message : 'Internal server error',
  });
});

module.exports = app;
