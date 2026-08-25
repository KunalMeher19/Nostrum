# Token Blacklisting Implementation

## Overview

Logout token blacklisting has been implemented using Redis to prevent logged-out users from accessing the API. This solves the security gap where Auth.js sessions remain valid after logout until their natural expiration (30 days).

---

## How It Works

### The Problem

**Before blacklisting:**
1. User logs in → gets Auth.js session token (valid 30 days)
2. User logs out → frontend clears cookie
3. **Problem:** If someone captured the token, they can still use it for 30 days
4. Token remains valid until natural expiration

**After blacklisting:**
1. User logs in → gets Auth.js session token (with unique `jti` identifier)
2. User logs out → token's `jti` is blacklisted in Redis + cookie cleared
3. **Solution:** Token is immediately invalid, even if someone has it
4. Any API request with blacklisted token → 401 Unauthorized

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Logout Flow                  │
└─────────────────────────────────────────────────────┘

Frontend                 Backend                 Redis
   │                        │                       │
   │──── POST /api/auth/logout ──────>│             │
   │                        │          │             │
   │                        │──── Read session ──>  │
   │                        │          │             │
   │                        │──── Blacklist jti ──>│
   │                        │          │             │
   │                        │          │  SETEX blacklist:{jti}
   │                        │          │  TTL = token expiry    │
   │                        │<─────────┴─────────────┘
   │<──── 200 OK ───────────│
   │                        │
   │──── signOut() ─────────> (clears cookie)
   │
   └─> Logged out


┌─────────────────────────────────────────────────────┐
│              Subsequent API Request Flow             │
└─────────────────────────────────────────────────────┘

Frontend                 Backend                 Redis
   │                        │                       │
   │──── GET /api/orders ───────────>│              │
   │    (with old token)    │         │              │
   │                        │──── Decrypt token ──> │
   │                        │         │              │
   │                        │──── Check blacklist ──>│
   │                        │         │              │
   │                        │         │  EXISTS blacklist:{jti}
   │                        │         │       │
   │                        │         │<──── YES ────┘
   │                        │         │
   │<──── 401 Unauthorized ─┴─────────┘
   │
   └─> Token blocked!
```

---

## Implementation Details

### Backend Components

**1. Token Blacklist Service** (`backend/src/services/token-blacklist.service.js`)
- Manages blacklisted tokens in Redis
- Automatic TTL expiration (token lifetime)
- Fallback to in-memory Map when Redis unavailable
- Periodic cleanup for in-memory mode

**2. Auth Middleware Update** (`backend/src/middlewares/auth.middleware.js`)
- Checks blacklist before accepting token
- Logs blocked tokens for monitoring
- Returns 401 for blacklisted tokens

**3. Logout Endpoint** (`backend/src/routes/auth.routes.js`)
- `POST /api/auth/logout`
- Extracts `jti` and `exp` from current session
- Blacklists token in Redis with TTL
- Returns success even if already logged out

**4. App Routes** (`backend/src/app.js`)
- Mounted `/api/auth` routes

### Frontend Components

**1. AccountPortal Update** (`src/components/AccountPortal/AccountPortal.tsx`)
- `handleLogout()` function calls backend first
- Blacklists token before clearing cookie
- Graceful error handling (still logs out if blacklist fails)

---

## Redis Storage

### Key Format
```
blacklist:{jti}
```

Example:
```
blacklist:abc123def456ghi789jkl012
```

### Value
```
1
```
(Simple presence check - value doesn't matter)

### TTL (Time To Live)
```
TTL = token.exp - now (in seconds)
```

**Example:**
- Token issued: 2026-08-23 10:00:00
- Token expires: 2026-09-22 10:00:00 (30 days)
- User logs out: 2026-08-25 15:30:00
- Remaining lifetime: 28 days, 18.5 hours = 2,480,400 seconds
- Redis TTL: 2,480,400 seconds

**Result:** Key auto-expires exactly when token would have expired naturally.

---

## Memory Management

### Why Automatic Cleanup Works

**Redis handles expiration automatically:**
- No manual cleanup needed
- Keys deleted when TTL reaches 0
- No memory leaks

**Space efficiency:**
- Each blacklist entry: ~50 bytes (key + value + metadata)
- 1,000 active blacklisted tokens: ~50 KB
- 10,000 active blacklisted tokens: ~500 KB
- 100,000 active blacklisted tokens: ~5 MB

**Typical usage:**
- Average session lifetime: 30 days
- Logout rate: 10% of users/day
- Active users: 1,000
- Blacklisted tokens: ~300 (at any given time)
- Redis memory: ~15 KB

**Redis never fills up because:**
1. ✅ Each key has automatic TTL expiration
2. ✅ Old tokens expire naturally (30 days max)
3. ✅ No perpetual growth possible
4. ✅ Memory usage scales with active logout rate, not total users

---

## Testing

### Test Logout Blacklisting

**1. Setup Redis:**
```bash
# Add to Railway backend
REDIS_URL=redis://default:password@host:port
```

**2. Test the flow:**
```bash
# Login to account
# Open browser DevTools → Application → Cookies
# Copy session token (authjs.session-token)

# Click logout button
# Check Railway logs:
[auth/logout] blacklisted token for user: user@example.com

# Try to use old token (via Postman/curl):
curl -H "Cookie: authjs.session-token=OLD_TOKEN" \
  https://nostrum-production.up.railway.app/api/orders

# Should return: 401 Unauthorized
# Check logs:
[auth] blocked blacklisted token: abc123de...
```

**3. Verify Redis entry:**
```bash
# Connect to Redis (Railway CLI or redis-cli)
redis-cli -h host -p port -a password

# Check if key exists
EXISTS blacklist:abc123def456ghi789

# Check TTL
TTL blacklist:abc123def456ghi789
# Should return remaining seconds (e.g., 2592000 = 30 days)
```

---

## Monitoring

### Railway Logs

**Successful logout:**
```
[auth/logout] blacklisted token for user: user@example.com
```

**Blocked token attempt:**
```
[auth] blocked blacklisted token: abc123de...
```

**Token without jti (warning):**
```
[auth/logout] token missing jti claim, cannot blacklist
```

### Redis Monitoring

**Check blacklisted tokens count:**
```bash
redis-cli -h host -p port -a password
KEYS blacklist:*
# Returns all blacklisted tokens
```

**Check Redis memory usage:**
```bash
INFO memory
# Look for: used_memory_human
```

**Monitor expiration:**
```bash
# Watch keys being deleted in real-time
MONITOR
# Shows all Redis commands including DEL on expiration
```

---

## Security Benefits

### 1. Instant Token Revocation
- ✅ Logged-out users blocked immediately
- ✅ No 30-day vulnerability window
- ✅ Stolen tokens become useless after logout

### 2. Replay Attack Prevention
- ✅ Captured tokens can't be reused after logout
- ✅ Man-in-the-middle attacks mitigated
- ✅ Session hijacking impact limited

### 3. Compliance Benefits
- ✅ GDPR "right to be forgotten" stronger (immediate access revocation)
- ✅ Security audit friendly (logout = instant)
- ✅ Industry best practice

---

## Performance Impact

### Redis Latency
- Blacklist check: ~1ms (Redis GET operation)
- Blacklist write: ~1ms (Redis SETEX operation)
- Total logout latency: +2ms (negligible)

### API Request Overhead
- Every authenticated request: +1ms (blacklist check)
- Acceptable for security benefit
- Redis is designed for this (millions of ops/sec)

### Optimization Opportunities
- Cache blacklist checks in request (if same token used multiple times in one request)
- Batch blacklist checks (if processing multiple tokens)
- Not needed for current scale (premature optimization)

---

## Fallback Behavior

### When Redis Is Unavailable

**In-memory fallback activates automatically:**
- ✅ Blacklist stored in Node.js Map
- ✅ Works for single backend instance
- ⚠️ Not shared across instances
- ⚠️ Lost on restart

**Periodic cleanup (in-memory only):**
- Runs every 5 minutes
- Removes expired entries
- Prevents memory leaks

**Production recommendation:**
- Always use Redis for production
- In-memory is for development only

---

## Common Questions

**Q: What if a user logs out but Redis is down?**
A: Logout still works (cookie cleared), but token isn't blacklisted. Falls back to in-memory for that instance only.

**Q: What if someone never logs out?**
A: Token expires naturally after 30 days. No blacklist entry created, no Redis memory used.

**Q: Can blacklisted tokens be un-blacklisted?**
A: No. Once blacklisted, they remain blocked until natural expiration. This is by design.

**Q: What happens to old blacklist entries?**
A: They auto-expire via Redis TTL. No manual cleanup needed.

**Q: Does this work with Google OAuth?**
A: Yes. All Auth.js sessions (credentials + OAuth) use the same JWT format with `jti`.

**Q: What if Auth.js tokens don't have `jti`?**
A: Current Auth.js v5 includes `jti` by default. If missing, logout still works but token isn't blacklisted (logged as warning).

**Q: How much Redis memory for 1 million users?**
A: Depends on logout rate, not total users. If 10% logout daily = 100,000 active blacklist entries = ~5MB.

**Q: Does this slow down API requests?**
A: Yes, by ~1ms per request (Redis lookup). Imperceptible to users.

---

## Summary

**What was implemented:**
- ✅ Redis-backed token blacklist
- ✅ Automatic TTL expiration
- ✅ In-memory fallback for development
- ✅ Frontend logout integration
- ✅ Backend middleware check
- ✅ Logout endpoint

**What you get:**
- ✅ Instant logout enforcement
- ✅ No token replay after logout
- ✅ Better security posture
- ✅ Minimal performance impact
- ✅ Automatic memory management

**What you need:**
- Redis URL in Railway backend (same Redis as checkout cache)
- No code changes needed
- Works automatically

**Memory usage:**
- Minimal (scales with logout rate)
- Auto-expires (no cleanup needed)
- Never fills up Redis
