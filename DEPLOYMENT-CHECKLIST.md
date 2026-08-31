# Security Fix Deployment Checklist

**Branch:** `security/critical-fixes-2026-08-31`  
**Date:** 2026-08-31  
**Status:** ✅ Code committed, ready for deployment

---

## Pre-Deployment Verification

- [x] All critical fixes applied and committed
- [ ] Backend tests pass (87/87)
- [ ] Frontend TypeScript clean
- [ ] Security audit log reviewed

---

## Deployment Steps

### 1. Merge to Main
```bash
git checkout main
git merge security/critical-fixes-2026-08-31
git push origin main
```

### 2. Wait for Railway Auto-Deploy
- Railway will automatically detect the push and redeploy
- Monitor deployment: https://railway.app/project/nostrum-production
- Expected: Clean deployment, no errors

### 3. **CRITICAL: Set TRUST_PROXY Environment Variable**

**Without this step, rate limiting will NOT work correctly!**

```
1. Go to Railway dashboard
2. Select Nostrum Backend service
3. Click "Variables" tab
4. Add new variable:
   - Name: TRUST_PROXY
   - Value: 1
5. Click "Deploy" or wait for auto-redeploy
```

**Why this is critical:**
- Without TRUST_PROXY=1, all visitors share ONE rate-limit bucket
- A single attacker can exhaust 300 requests/min and lock out the entire API
- This is the #1 HIGH severity finding

---

## Post-Deployment Verification

### Test 1: Rate Limiting Works Per-IP
```bash
B=https://nostrum-production.up.railway.app

# Run 5 sequential requests
for i in {1..5}; do
  echo -n "Request $i: "
  curl -s -D - -o /dev/null "$B/api/health" 2>/dev/null | grep "^ratelimit:" | tr -d '\r'
done

# Expected output:
# Request 1: ratelimit: limit=300, remaining=299, reset=60
# Request 2: ratelimit: limit=300, remaining=298, reset=59
# Request 3: ratelimit: limit=300, remaining=297, reset=58
# Request 4: ratelimit: limit=300, remaining=296, reset=57
# Request 5: ratelimit: limit=300, remaining=295, reset=56

# ✅ PASS: remaining decrements steadily
# ❌ FAIL: remaining jumps around randomly (TRUST_PROXY not set)
```

### Test 2: CSV Formula Injection Fixed
```bash
# Try to inject formula via newsletter signup
curl -X POST "$B/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"=1+1@test.co","locale":"en","consent":true}'

# Then download subscribers CSV as admin
# Open in Excel
# ✅ PASS: Cell shows '=1+1@test.co (literal text, prefixed with quote)
# ❌ FAIL: Cell shows "2" (formula evaluated)
```

### Test 3: Upload Size Limit Works
```bash
# Generate 9MB file
dd if=/dev/zero of=/tmp/large.jpg bs=1M count=9 2>/dev/null

# Try to upload as admin (need valid admin session)
curl -X POST "$B/api/admin/upload" \
  -H "Cookie: authjs.session-token=$ADMIN_TOKEN" \
  -F "file=@/tmp/large.jpg"

# Expected: {"error":"file_too_large"} with 413 status
# ✅ PASS: 413 response immediately
# ❌ FAIL: Server hangs or crashes (OOM)
```

### Test 4: Heavy Rate Limits Applied
```bash
# Hit expensive admin endpoint 20 times rapidly as admin
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "Cookie: authjs.session-token=$ADMIN_TOKEN" \
    "$B/api/admin/customers"
done
echo

# Expected: First 15 are 200, next 5 are 429
# ✅ PASS: 200 200 200 ... (15 times) ... 429 429 429 429 429
# ❌ FAIL: All 200 (limiter not working)
```

### Test 5: Checkout Idempotency Bound to User
```bash
# Two different users use same idempotency key
# Expected: Each gets their OWN session, not shared

# This requires manual testing:
# 1. User A starts checkout with key "test-key-123"
# 2. User B starts checkout with key "test-key-123"
# 3. Each should see their own cart/email, not the other's

# ✅ PASS: Sessions are independent per user
# ❌ FAIL: User B sees User A's cart
```

---

## Monitoring (First 24 Hours)

### Railway Logs
Monitor for:
- `[rate-limit-store]` errors
- `file_too_large` responses (legitimate rejections)
- `[invoice] Response stream error` (expected on client disconnect, now logged)
- CSV exports with quoted formulas (`'=...`)

### Expected Log Patterns (GOOD)
```
[checkout] created session cs_... for idempotency key: ...
[checkout] returning cached session for idempotency key: ...
[invoice] Response stream error (likely client disconnect): ...
```

### Alerts (BAD)
```
❌ ECONNRESET from Redis
❌ Uncaught exception
❌ Process exiting with code 1
❌ 429 responses when TRUST_PROXY not set
```

---

## Rollback Plan

If issues arise:

### Option 1: Quick Rollback
```bash
git revert HEAD
git push origin main
# Railway auto-deploys previous version
```

### Option 2: Revert TRUST_PROXY Only
If rate limiting causes issues (unlikely):
```
Railway dashboard → Variables → Remove TRUST_PROXY
Redeploy
```

Note: This reverts to the vulnerable state where all users share one bucket.

---

## Success Criteria

✅ All post-deployment tests pass  
✅ No 500 errors in logs  
✅ Rate limiting works per-IP  
✅ Admin panel loads normally  
✅ Checkout flow works  
✅ CSV exports show quoted formulas  
✅ Upload rejects >8MB files immediately  

---

## Next Steps (Non-Critical)

After 24-48 hours of stable operation, address medium/low severity findings:

1. **M-1:** Narrow guest order query scope (5 min fix)
2. **M-2:** Add double-opt-in to newsletter (4 hours)
3. **M-5, M-6:** Fix Redis error handling (1 hour)
4. **Pagination:** Add to all admin list endpoints (2 hours)
5. **CAPTCHA:** Add to contact/newsletter forms (2 hours)

See `SECURITY-AUDIT-2026-08-31.md` for full list.

---

## Support Contact

If deployment issues arise:
- Check Railway logs first
- Review this checklist
- Verify TRUST_PROXY=1 is set
- Run post-deployment verification tests

---

**CRITICAL REMINDER:** The #1 priority after deployment is setting `TRUST_PROXY=1` in Railway. Without it, rate limiting does not work correctly.
