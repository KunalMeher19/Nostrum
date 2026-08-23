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
| `STRIPE_SECRET_KEY` | yes (checkout) | Stripe secret key (`sk_live_…` for production or `sk_test_…` for testing). Get from Stripe Dashboard → Developers → API keys. Without it, `POST /api/checkout` returns 503. **Test mode keys start with `sk_test_`, live mode keys start with `sk_live_`.** |
| `STRIPE_WEBHOOK_SECRET` | yes (checkout) | Webhook signing secret (`whsec_…`). Get from Stripe Dashboard → Developers → Webhooks → Add endpoint → set URL to `https://nostrum-production.up.railway.app/api/stripe/webhook` → select event `checkout.session.completed` → save → reveal signing secret. Required to verify webhook events and prevent spoofing. |
| `SHIPPING_COST_EUR` | optional | Flat shipping fee in EUR cents added to every order. Defaults to 0 (free shipping). E.g. `490` = €4.90, `1200` = €12.00. Update when client confirms courier rates. |

## Launch checklist

1. `AUTH_SECRET` identical in both envs; both apps reach the same MongoDB.
2. Seed the admin: `cd backend && npm run seed:admin` (then change the password) or set `ADMIN_EMAILS`.
3. Google OAuth: set credentials, add the production redirect URI in Google Cloud Console, and TEST sign-in on the deployed site. This broke on the client's previous site; it must not here.
4. `TRUST_PROXY` set; confirm rate limiting keys per client IP (429s show per-IP, not global).
5. `CORS_ORIGIN` lists exactly the production origins.
6. Run `cd backend && npm test` (full suite) and `npm run build` at root.
7. Smoke: contact form submit, newsletter subscribe → unsubscribe link, admin CSV exports, invoice PDF download, journal pages.

## Stripe Payment Setup (Step-by-step)

**CRITICAL: Client confirmed Stripe as the payment gateway. Payment system is fully built and idempotent. Only keys are needed to go live.**

### 1. Get Stripe API Keys

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to: **Developers** → **API keys**
3. Copy the **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
   - **For testing:** Use test mode keys first
   - **For production:** Activate your account and use live mode keys

### 2. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to: **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://nostrum-production.up.railway.app/api/stripe/webhook`
4. Click **Select events**
5. Search and select: `checkout.session.completed`
6. Click **Add endpoint**
7. Click on the newly created webhook endpoint
8. Click **Reveal** under **Signing secret** (starts with `whsec_…`)
9. Copy this signing secret

### 3. Add Keys to Railway

1. Go to Railway dashboard: https://railway.app
2. Select your **Nostrum backend** project
3. Go to **Variables** tab
4. Add these environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx  (or sk_live_xxxxx for production)
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   SHIPPING_COST_EUR=0  (or amount in cents, e.g. 490 for €4.90)
   ```
5. Click **Deploy** to restart the backend with new variables

### 4. Test the Payment Flow

**Test Mode (recommended first):**
1. Use test keys (`sk_test_...`)
2. Cart → Checkout button redirects to Stripe hosted page
3. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
4. Complete payment → redirects to success page
5. Check Railway logs: should see `[stripe webhook] order created: NST-2026-XXXX`
6. Check admin portal: order should appear with status "placed"
7. Customer should receive order confirmation email (when Resend is configured)

**Test card numbers (Stripe test mode):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

**Live Mode (after testing):**
1. Activate Stripe account (add business details)
2. Replace `STRIPE_SECRET_KEY` with live key (`sk_live_...`)
3. Create new webhook endpoint for live mode (same URL)
4. Replace `STRIPE_WEBHOOK_SECRET` with live webhook secret
5. Deploy backend
6. Real payments will now be processed

### 5. Idempotency & Error Handling

✅ **Already implemented:**
- Multiple checkout clicks → same session (no duplicate charges)
- Network retries → same session returned from cache
- Webhook retries → idempotent order creation (no duplicates)
- Out-of-stock race → automatic cancellation + refund notice
- Payment failures → user-friendly error messages
- Stock consumption → atomic, no overselling

### 6. Monitoring

After going live, monitor these in Stripe Dashboard:
- **Payments** → see all successful charges
- **Logs** → webhook delivery status
- **Events** → raw event data for debugging

In Railway logs, look for:
- `[checkout] created session {id} for idempotency key: {key}` → checkout initiated
- `[stripe webhook] order created: NST-2026-XXXX (session {id})` → order confirmed
- `[stripe webhook] OUT_OF_STOCK on session {id}` → stock issue (requires manual refund)

## Still blocked on the client (do before/at launch when provided)

- **Stripe keys** (CRITICAL PATH - see above for complete setup instructions)
- Email provider (Resend): wire `src/lib/auth/mailer.ts` + `backend/src/services/mailer.service.js` (instructions in each header).
- Real contact details + WhatsApp number (placeholders in `ContactSection.tsx` / `SiteFooter`).
- Legal pages (privacy, legal notice, cookies text) and the invoice legal identity (`backend/src/services/invoice.service.js`).
- Real shop catalog (admin can now enter products directly, waiting for photos/prices).
