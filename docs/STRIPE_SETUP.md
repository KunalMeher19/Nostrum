# Stripe Payment Integration - Environment Variables Guide

## Overview

The Nostrum payment system is **fully implemented** with complete idempotency, error handling, and stock management. Only Stripe API keys are needed to activate checkout.

---

## Required Environment Variables

### Backend (Railway) - 3 Required + 1 Optional Variable

Add these to your Railway backend environment:

#### 1. `STRIPE_SECRET_KEY`
- **What it is:** Your Stripe API secret key
- **Where to get it:**
  1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
  2. Go to **Developers** → **API keys**
  3. Copy the **Secret key**
- **Format:**
  - Test mode: starts with `sk_test_51`
  - Live mode: starts with `sk_live_51`
- **Example:** `sk_test_51` followed by 99 more characters

#### 2. `STRIPE_WEBHOOK_SECRET`
- **What it is:** Webhook signing secret to verify events from Stripe
- **Where to get it:**
  1. In Stripe Dashboard, go to **Developers** → **Webhooks**
  2. Click **Add endpoint**
  3. Enter endpoint URL: `https://nostrum-production.up.railway.app/api/stripe/webhook`
  4. Select event: `checkout.session.completed`
  5. Click **Add endpoint**
  6. Click **Reveal** under **Signing secret**
  7. Copy the secret
- **Format:** `whsec_...` (starts with `whsec_`)
- **Example:** `whsec_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQR`

#### 3. `SHIPPING_COST_EUR` (Optional)
- **What it is:** Flat shipping cost in EUR cents
- **Default:** `0` (free shipping)
- **Examples:**
  - Free shipping: `0`
  - €4.90 shipping: `490`
  - €12.00 shipping: `1200`
  - €7.50 shipping: `750`
- **Note:** This is a temporary flat rate. Can be updated later to dynamic rates based on destination.

#### 4. `REDIS_URL` (Optional but Recommended)
- **What it is:** Redis connection URL for idempotency cache
- **Why use it:**
  - ✅ Cache shared across multiple backend instances (horizontal scaling)
  - ✅ Cache survives backend restarts
  - ✅ Production-ready architecture
  - ✅ Better reliability
- **Where to get it:**
  1. Railway: Add Redis service → Copy connection URL
  2. Upstash: https://upstash.com (generous free tier)
  3. Redis Cloud: https://redis.com/cloud
- **Format:** `redis://default:password@host:port`
- **Example:** `redis://default:abc123@containers-us-west-1.railway.app:6379`
- **Default behavior:** If not set, uses in-memory cache (works fine for single instance, but not recommended for production)
- **Full setup guide:** See `REDIS_SETUP.md` in repo root

---

## Step-by-Step Setup

### Phase 1: Test Mode (Recommended First)

1. **Get Test Keys**
   - Use Stripe test mode keys (`sk_test_...`)
   - No Stripe account activation required
   - No real money involved

2. **Add Redis (Recommended)**
   - In Railway, click **+ New** → **Database** → **Add Redis**
   - Copy the Redis URL from the Connect tab
   - Add to backend variables: `REDIS_URL=redis://...`

3. **Add to Railway**
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   SHIPPING_COST_EUR=0
   REDIS_URL=redis://default:password@host:port  (optional but recommended)
   ```

3. **Deploy Backend**
   - Railway will automatically restart
   - Check logs for Redis connection (if using Redis)
   - Checkout button becomes active

4. **Test Payment**
   - Add products to cart
   - Click checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g., 12/25)
   - CVC: any 3 digits (e.g., 123)
   - Complete payment

5. **Verify**
   - Success page shows
   - Check Railway logs for: `[stripe webhook] order created: NST-2026-XXXX`
   - Order appears in admin portal

### Phase 2: Production (After Testing)

1. **Activate Stripe Account**
   - Complete business verification in Stripe
   - Activate live mode

2. **Get Live Keys**
   - Switch to live mode in Stripe Dashboard
   - Copy live secret key (`sk_live_...`)

3. **Create Live Webhook**
   - In live mode: **Developers** → **Webhooks** → **Add endpoint**
   - Same URL: `https://nostrum-production.up.railway.app/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Copy the **live** webhook secret

4. **Update Railway**
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  (replace test with live)
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  (replace test with live)
   SHIPPING_COST_EUR=490  (or your actual shipping cost)
   REDIS_URL=redis://...  (keep the same Redis instance)
   ```

5. **Deploy & Go Live**
   - Real payments now accepted
   - Real cards charged
   - Monitor Stripe Dashboard

---

## Stripe Test Cards

Use these in test mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |
| `4000 0025 0000 3155` | ⚠️ Requires 3D Secure authentication |

All test cards:
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any postal code (e.g., 12345)

More test cards: https://stripe.com/docs/testing

---

## What's Already Implemented

✅ **Idempotency**
- Multiple checkout clicks → same session (no duplicate charges)
- Network retries → cached session returned
- Unique key per checkout attempt (stored in localStorage)
- Keys expire after 10 minutes (fresh checkout allowed)
- **Redis-backed cache** (when REDIS_URL is set) → shared across instances, survives restarts
- **In-memory fallback** (when REDIS_URL is unset) → works for single instance

✅ **Webhook Idempotency**
- Duplicate webhook events → no duplicate orders
- Uses `stripeSessionId` as idempotency key
- Race conditions handled (duplicate session/order number detection)

✅ **Error Handling**
- Out of stock → order cancelled, admin notified for refund
- Product removed → graceful handling, admin notified
- Payment failures → user-friendly error messages
- Network issues → Stripe auto-retries webhook
- Database errors → 500 response triggers Stripe retry

✅ **Stock Management**
- Atomic stock consumption (no overselling)
- Concurrent orders handled safely
- Stock restored on cancellation
- Pre-flight stock check + webhook atomic check

✅ **Security**
- Webhook signature verification (prevents spoofing)
- Server-side price validation (never trust browser)
- Rate limiting on checkout endpoint
- CORS + CSRF protection
- Idempotency prevents replay attacks

✅ **User Experience**
- Loading states during checkout
- Specific error messages (out of stock, service unavailable)
- Success page clears cart + idempotency key
- Locale-aware Stripe checkout page
- Email pre-filled for logged-in users

---

## Monitoring After Launch

### In Stripe Dashboard

1. **Payments Tab**
   - See all successful charges
   - Filter by status, amount, date
   - Refund from here if needed

2. **Webhooks Tab**
   - Monitor delivery success rate
   - View failed deliveries (auto-retried)
   - Check event logs

3. **Events Tab**
   - Raw event data for debugging
   - Search by session ID or customer

### In Railway Logs

Look for these messages:

**Successful checkout:**
```
[checkout] created session cs_test_xxx for idempotency key: 1234567890-abc123def456
[stripe webhook] order created: NST-2026-0001 (session cs_test_xxx)
```

**Out of stock (rare):**
```
[stripe webhook] OUT_OF_STOCK on session cs_test_xxx: {"productSlug":"nostrum","sizeId":"5l","qty":10}
[stripe webhook] payment intent: pi_xxx
```

**Idempotency working:**
```
[checkout] returning cached session for idempotency key: 1234567890-abc123def456
```

---

## Common Issues & Solutions

### Issue: Checkout returns 503
- **Cause:** `STRIPE_SECRET_KEY` not set or invalid
- **Solution:** Verify key in Railway, ensure no extra spaces

### Issue: Order not created after payment
- **Cause:** Webhook not configured or `STRIPE_WEBHOOK_SECRET` wrong
- **Solution:** Check webhook endpoint in Stripe, verify signing secret

### Issue: Webhook failing with 400
- **Cause:** Signature verification failed
- **Solution:** Regenerate webhook, copy new secret to Railway

### Issue: Out of stock after payment
- **Cause:** Stock depleted between checkout and webhook
- **Solution:** Order auto-cancelled, admin sees it, manual refund via Stripe

### Issue: Multiple orders created
- **Cause:** Should not happen (idempotency prevents this)
- **Solution:** Check Railway logs, contact developer

---

## Tax Configuration (Future)

Currently disabled. To enable Spanish IVA:

1. Add Spanish tax registration to Stripe account
2. In `backend/src/routes/checkout.routes.js`, uncomment line:
   ```javascript
   automatic_tax: { enabled: true }
   ```
3. Redeploy backend
4. Stripe will calculate and collect IVA automatically

---

## Summary

**YOU NEED TO PROVIDE:**
1. `STRIPE_SECRET_KEY` (from Stripe Dashboard → API keys) - **REQUIRED**
2. `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard → Webhooks) - **REQUIRED**
3. `SHIPPING_COST_EUR` (optional, defaults to 0) - **OPTIONAL**
4. `REDIS_URL` (from Railway Redis or Upstash) - **OPTIONAL BUT RECOMMENDED**

**ADD THESE TO:** Railway backend environment variables

**THEN:** Deploy backend → Checkout goes live immediately

**NO CODE CHANGES NEEDED** - Everything is already built and tested.

**Redis Benefits:**
- ✅ Shared cache across multiple backend instances
- ✅ Cache survives restarts
- ✅ Production-ready
- ✅ Automatic fallback if not configured

**Redis Setup:** See `REDIS_SETUP.md` for complete guide (5 minutes to set up)
