# Nostrum · Deployment Guide

Two apps deploy together:

- **Frontend**: Next.js (repo root). Owns pages, Auth.js sessions, auth API routes.
- **Backend**: Express (`backend/`). Owns orders, products, journal, contact, newsletter, admin APIs. Verifies the SAME Auth.js session cookie.

## Environment variables

### Shared secret (critical)

| Var | Where | Notes |
|---|---|---|
| `AUTH_SECRET` | `.env.local` AND `backend/.env` | MUST be identical in both. The Express API decrypts the Auth.js session JWE with it. Rotate both together. |

### Frontend (`.env.local`)

| Var | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Same `nostrum` database as the backend (shared `users` collection). |
| `NEXT_PUBLIC_API_URL` | yes (prod) | Public URL of the Express API, e.g. `https://api.nostrum.com`. Defaults to `http://localhost:5000`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | before launch | PENDING CLIENT. Google sign-in must be tested end to end before launch (hard requirement). |
| `ADMIN_EMAILS` | optional | Comma list auto-promoted to admin on sign-in. |
| `RESEND_API_KEY` | later | PENDING CLIENT. Until set, all mail is console-logged (see `src/lib/auth/mailer.ts`). |
| `NEXT_PUBLIC_GA_ID` | later | GA4 property id. Unset = analytics fully off. Even when set, GA only loads after cookie-banner accept. |

### Backend (`backend/.env`)

| Var | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Production MongoDB (Atlas or managed). Local Windows service is dev-only. |
| `CORS_ORIGIN` | yes (prod) | Comma allowlist of frontend origins, e.g. `https://nostrum.com,https://www.nostrum.com`. Never a wildcard. The API refuses to boot in production if unset or containing localhost, and the same list gates cross-site mutations (Origin check). |
| `TRUST_PROXY` | yes (prod) | Number of proxy hops (Vercel/nginx/CF: usually `1`). Without it every visitor shares the proxy's rate-limit bucket. |
| `FRONTEND_URL` | yes (prod) | Used to build unsubscribe links in newsletter mails. Defaults to `http://localhost:3000`. |
| `CONTACT_INBOX` | yes (prod) | Where contact-form submissions are relayed. PENDING CLIENT (real house inbox). |
| `PORT` | optional | Defaults to 5000. |
| `SHUTDOWN_GRACE_MS` | optional | Drain window for graceful shutdown (default 10000). In-flight requests get this long on SIGTERM before a hard exit. |
| `REDIS_URL` | when scaling | Optional. Set to move rate-limit buckets to Redis so multiple API instances share budgets. Unset = in-memory (fine for one instance). |
| `RATE_*` | optional | Tune limiter tiers without a deploy; see `backend/src/config/rate-limit.config.js` (global/write/heavy/anon/publicWrite). |

## Launch checklist

1. `AUTH_SECRET` identical in both envs; both apps reach the same MongoDB.
2. Seed the admin: `cd backend && npm run seed:admin` (then change the password) or set `ADMIN_EMAILS`.
3. Google OAuth: set credentials, add the production redirect URI in Google Cloud Console, and TEST sign-in on the deployed site. This broke on the client's previous site; it must not here.
4. `TRUST_PROXY` set; confirm rate limiting keys per client IP (429s show per-IP, not global).
5. `CORS_ORIGIN` lists exactly the production origins.
6. Run `cd backend && npm test` (full suite) and `npm run build` at root.
7. Smoke: contact form submit, newsletter subscribe → unsubscribe link, admin CSV exports, invoice PDF download, journal pages.

## Still blocked on the client (do before/at launch when provided)

- Email provider (Resend): wire `src/lib/auth/mailer.ts` + `backend/src/services/mailer.service.js` (instructions in each header).
- Real contact details + WhatsApp number (placeholders in `ContactSection.tsx` / `SiteFooter`).
- Legal pages (privacy, legal notice, cookies text) and the invoice legal identity (`backend/src/services/invoice.service.js`).
- Checkout/payments (Shopify vs Stripe decision) and the real shop catalog.
