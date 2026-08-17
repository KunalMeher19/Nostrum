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
const contentRoutes = require('./routes/content.routes');
const contactRoutes = require('./routes/contact.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const productsRoutes = require('./routes/products.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const stripeRoutes = require('./routes/stripe.routes');

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
  .map((s) => s.trim().replace(/\/+$/, '')) // strip trailing slashes
  .filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, origin ?? false);
    cb(null, false);
  },
  credentials: true,
});

app.use(corsMiddleware);

// OPTIONS preflight must be answered immediately — before any auth
// middleware runs. Without this, a disallowed-origin OPTIONS request
// falls through to requireAdmin and returns 401 with no CORS headers,
// which the browser reports as a CORS error instead of an auth error.
app.options('*', corsMiddleware, (req, res) => res.sendStatus(204));

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

// Body parsing: JSON for all routes except:
//   /api/admin/upload — reads the raw multipart stream itself
//   /api/stripe/webhook — Stripe signature verification requires the exact
//       raw bytes; express.raw() is applied inside stripe.routes.js instead.
// Applying express.json to either would consume the stream before the
// handler sees it.
app.use((req, res, next) => {
  if (req.path === '/api/admin/upload') return next();
  if (req.path === '/api/stripe/webhook') return next();
  express.json({ limit: '200kb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/admin/upload') return next();
  if (req.path === '/api/stripe/webhook') return next();
  sanitizeBody(req, res, next);
});

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
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/checkout', checkoutRoutes);
// Stripe webhook — mounted at /api/stripe so the raw-body middleware
// inside stripe.routes.js matches /api/stripe/webhook exactly.
app.use('/api/stripe', stripeRoutes);

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
