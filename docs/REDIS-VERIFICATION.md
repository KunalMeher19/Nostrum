# Redis Integration Verification Guide

**ISSUE REPORTED 2026-08-25**: Admin panel showing 500 errors due to invalid Redis connection. See **"Critical Fix"** section below.

---

This guide shows you how to verify that Redis is working correctly for payment idempotency and rate limiting.

## Where Redis is Used

Redis powers two critical features:

1. **Payment idempotency cache** (`/api/checkout`) — prevents duplicate charges when users click "checkout" multiple times
2. **Rate limiting** (all endpoints) — shared request budgets across all backend instances

Both fall back to in-memory storage when `REDIS_URL` is not set (local dev, single instance).

---

## 🚨 Critical Fix: Admin Panel 500 Errors (2026-08-25)

**Symptoms:**
- Admin panel shows 500 errors on `/api/proxy/admin/orders` and `/api/proxy/admin/customers`
- Backend logs show: `express-rate-limit: async error during store initialization. Error: Stream isn't writeable and enableOfflineQueue options is false`
- Repeated `[redis] read ECONNRESET` errors

**Root Cause:**  
The backend has a `REDIS_URL` environment variable set in Railway, but the Redis connection is invalid/unreachable. This causes ALL rate-limited routes (including admin routes) to fail during initialization.

**Fix (Recommended - Option 1): Remove Invalid REDIS_URL**

Redis is **OPTIONAL** for single-instance deployments. According to `backend/src/db/redis.js`:
> When REDIS_URL is unset, limiters keep their in-memory stores — zero behavior change.

Since you're running a single Railway instance (not horizontally scaled), **in-memory rate limiting is perfectly fine**.

**Steps:**
1. Go to **Railway dashboard** → Nostrum backend service → **Variables** tab
2. Find `REDIS_URL` in the environment variables list
3. **Delete it** (click the trash icon)
4. Railway will **auto-redeploy** the backend
5. Wait 30-60 seconds for deployment to complete
6. **Verify**: Open admin panel → Orders and Customers tabs should load without errors

**Expected Result:**
- Backend starts without Redis errors
- Rate limiters use in-memory stores (works perfectly for single instance)
- Admin panel loads orders, customers, products normally
- All 500 errors disappear

---

**Fix (Option 2): Provision Real Redis**

If you DO want Redis working:

1. **Add Railway Redis plugin**:
   - Railway dashboard → Add service → Database → Redis
   - Copy the **private network URL** (ends with `.railway.internal`)
   
2. **Update `REDIS_URL`** in backend variables with the correct URL
   
3. **Redeploy** and verify logs show no connection errors

But for now, **Option 1 (removing REDIS_URL) is the fastest fix** and eliminates an unnecessary dependency.

---

## When Would You Need Redis?

Redis becomes necessary when you:
- **Horizontally scale** to multiple Railway instances (2+ containers)
- Need **shared rate-limit buckets** across instances
- Want **persistent idempotency cache** across backend restarts

For a single-instance deployment, in-memory rate limiting is simpler and works perfectly.

---

## Step 1: Verify Redis URL is Set in Railway

1. Open your Railway project dashboard
2. Go to **Backend service** → **Variables** tab
3. Confirm `REDIS_URL` is set and looks like:
   ```
   redis://default:password@redis-12345.railway.internal:6379
   ```
   or
   ```
   rediss://default:password@redis-12345.railway.app:6379
   ```

**If it's missing:**
- Click **"+ New Variable"**
- Name: `REDIS_URL`
- Value: (copy from Railway Redis service dashboard, under "Connect")
- **Important:** Use the **private network URL** (ends with `.railway.internal`), not the public one — it's faster and doesn't count against egress

4. **Redeploy the backend** after adding the variable (Railway should auto-deploy, or click "Deploy")

---

## Step 2: Check Backend Logs (Startup)

When the backend starts with `REDIS_URL` set, you'll see one of these in Railway logs:

### ✅ Success (Redis connected):
```
[redis] connected
```
or silence (no error = success — Redis lazy-loads on first use)

### ❌ Failure (Redis unreachable):
```
[redis] connect ECONNREFUSED
[redis] Error: getaddrinfo ENOTFOUND redis-12345.railway.internal
```

**If you see errors:**
- Verify the `REDIS_URL` format is correct
- Confirm both backend and Redis services are in the same Railway project
- Try the **public Redis URL** as a test (slower but bypasses private network issues)

---

## Step 3: Test Payment Idempotency (Checkout)

This is the **critical verification** — idempotency prevents duplicate charges.

### Test A: Same idempotency key (should reuse session)

1. Open your browser **DevTools** → **Console**
2. Go to `/en/shop/cart` (add items first)
3. Click **"Proceed to checkout"**
4. **Before** it redirects, check the Network tab:
   - Find the `POST /api/checkout` request
   - Look at the **Request Payload** → note the `idempotencyKey` value (e.g., `"1a2b3c4d-xyz123"`)

5. **Go back** to the cart (browser back button)
6. Open **DevTools Console** and run:
   ```javascript
   // Force the same idempotency key
   localStorage.setItem('nostrum_checkout_idempotency', JSON.stringify({
     key: 'TEST_DUPLICATE_KEY_12345',
     timestamp: Date.now()
   }));
   ```

7. Click **"Proceed to checkout"** again
8. Check Railway backend logs — you should see:
   ```
   [checkout] idempotency HIT for key TEST_DUPLICATE_KEY_12345
   [checkout] returning cached session cs_test_...
   ```

**What this proves:**  
✅ Redis is storing and retrieving idempotency keys  
✅ Duplicate checkout requests return the same Stripe session  
✅ No double-charge risk

**If Redis is NOT working:**  
You'd see:
```
[checkout] idempotency MISS for key TEST_DUPLICATE_KEY_12345
[checkout] creating new Stripe session...
```
→ A new session is created every time (bad — means Redis isn't working)

---

### Test B: Different idempotency keys (should create new sessions)

1. Clear the forced key:
   ```javascript
   localStorage.removeItem('nostrum_checkout_idempotency');
   ```

2. Go to cart, click checkout
3. Go back, click checkout again
4. Backend logs should show:
   ```
   [checkout] idempotency MISS for key abc123...
   [checkout] creating new Stripe session cs_test_...
   [checkout] idempotency MISS for key xyz789...
   [checkout] creating new Stripe session cs_test_...
   ```

**What this proves:**  
✅ Each unique key creates a new session (correct behavior)

---

## Step 4: Test Rate Limiting (with Redis)

Rate limiting uses Redis to share request budgets across all backend instances.

### Quick test:

1. Open DevTools Console on any page
2. Run this (spams the health endpoint):
   ```javascript
   for (let i = 0; i < 150; i++) {
     fetch('https://nostrum-production.up.railway.app/health')
       .then(r => console.log(i, r.status));
   }
   ```

3. Check Railway backend logs — you should see:
   ```
   [rate-limit] IP 203.0.113.42 exceeded limit on /health
   ```

**If Redis is working:**  
- The 429 (rate limit) response appears consistently around request #100-120 (global tier limit)
- The counter persists across requests

**If Redis is NOT working:**  
- Each backend instance has its own counter (so the limit is effectively multiplied by the number of instances)
- You might not hit 429 at all with 150 requests if traffic is load-balanced

---

## Step 5: Direct Redis Verification (optional, advanced)

If you want to **directly inspect Redis**, use Railway's Redis CLI:

1. Go to Railway Redis service → **Connect** tab
2. Copy the `redis-cli` command (looks like `redis-cli -u redis://...`)
3. Run it in your local terminal
4. Once connected, run:
   ```redis
   KEYS checkout:*
   ```
   You should see idempotency keys like:
   ```
   1) "checkout:1a2b3c4d-xyz123"
   2) "checkout:9f8e7d6c-abc456"
   ```

5. Check one:
   ```redis
   GET checkout:1a2b3c4d-xyz123
   ```
   Returns the Stripe session ID:
   ```
   "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
   ```

6. Check TTL (time to live):
   ```redis
   TTL checkout:1a2b3c4d-xyz123
   ```
   Should return a number around `86400` (24 hours in seconds), counting down.

---

## Fallback Behavior (No Redis)

If `REDIS_URL` is **not set** or Redis is **unreachable**, the backend **automatically falls back** to in-memory storage:

- **Idempotency cache:** stored in a `Map()` in Node.js memory
- **Rate limiting:** stored in `express-rate-limit`'s default memory store

**This is safe** but has limitations:
- ❌ Cache doesn't survive backend restarts
- ❌ Each backend instance has its own cache (not shared)
- ❌ If Railway scales to 2+ instances, idempotency/rate-limits are per-instance

**For production with 1 Railway instance:** in-memory works fine.  
**For horizontal scaling (2+ instances):** Redis is required.

---

## Logs You Should See (Normal Operation)

### On checkout (Redis working):
```
[checkout] idempotency MISS for key 1a2b3c-xyz (creating new session)
[checkout] cached session cs_test_... for key 1a2b3c-xyz
[checkout] redirecting to Stripe checkout cs_test_...
```

### On duplicate checkout (Redis working):
```
[checkout] idempotency HIT for key 1a2b3c-xyz (reusing session)
[checkout] returning cached session cs_test_...
```

### On webhook (idempotency via MongoDB, not Redis):
```
[stripe webhook] session cs_test_... completed
[stripe webhook] order already exists for session cs_test_...: NO-2025-00042 (duplicate: true)
```
or
```
[stripe webhook] order created: NO-2025-00042 (session cs_test_...)
```

---

## Troubleshooting

### Redis connection fails on startup

**Symptom:**
```
[redis] Error: connect ECONNREFUSED
```

**Fix:**
1. Verify `REDIS_URL` is correct (copy from Redis service dashboard)
2. Use the **private network URL** (`.railway.internal`)
3. Confirm Redis service is **running** (Railway dashboard → Redis service → Deployments)

---

### Idempotency always MISS (never HIT)

**Symptom:**  
Every checkout creates a new session, even with the same `idempotencyKey`

**Possible causes:**
1. **Redis not connected** — check startup logs for connection errors
2. **TTL too short** — keys expire before you test (unlikely, TTL is 24h)
3. **Wrong key format** — frontend sending different keys each time (check Network tab)

**Debug:**
- Add this log in `backend/src/routes/checkout.routes.js` after line 129:
  ```javascript
  console.log(`[checkout] checking cache for key: ${idempotencyKey}`);
  const cachedSessionId = await getCachedSession(idempotencyKey);
  console.log(`[checkout] cache result: ${cachedSessionId || 'MISS'}`);
  ```

---

## Summary Checklist

✅ `REDIS_URL` is set in Railway backend variables  
✅ Backend logs show no Redis connection errors on startup  
✅ Test A (same key) logs show `idempotency HIT` + `returning cached session`  
✅ Test B (different keys) logs show `idempotency MISS` + `creating new Stripe session`  
✅ Rate limit test triggers 429 responses around request #100-120  

**If all 5 pass → Redis is working correctly for payments.**

---

## What Happens if Redis Fails Mid-Request?

The backend is resilient:

- **Idempotency cache:** falls back to allowing the request (better to allow a duplicate than block a real checkout)
- **Rate limiting:** falls back to allowing the request (express-rate-limit behavior on store errors)

You'll see errors in logs:
```
[redis] Command timeout
[rate-limit] store error, allowing request
```

But **checkout still works** — it just loses idempotency protection until Redis reconnects.

---

## Performance Impact

**With Redis:**
- Idempotency check: ~2-5ms (network roundtrip to Railway Redis)
- Rate limit check: ~1-3ms

**Without Redis (in-memory):**
- Idempotency check: <0.1ms (local Map lookup)
- Rate limit check: <0.1ms

The difference is negligible (<10ms per checkout), and Redis enables horizontal scaling.
