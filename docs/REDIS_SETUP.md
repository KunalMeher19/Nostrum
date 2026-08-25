# Redis Setup for Stripe Idempotency Cache

## Overview

The Stripe checkout system now uses **Redis** for idempotency caching instead of in-memory storage. This provides:

✅ **Shared cache** across multiple backend instances (horizontal scaling)  
✅ **Persistent cache** that survives backend restarts  
✅ **Better reliability** for production deployments  
✅ **Automatic fallback** to in-memory when Redis is unavailable  

---

## What Changed

### Before (In-Memory)
- Cache lived in Node.js process memory
- Lost on backend restart
- Not shared across multiple instances
- Periodic cleanup needed

### After (Redis)
- Cache stored in Redis with automatic TTL expiration
- Survives backend restarts
- Shared across all backend instances
- Redis handles cleanup automatically
- Graceful fallback to in-memory if Redis is unavailable

---

## Setup Instructions

### Option 1: Railway Redis (Recommended)

Railway provides managed Redis with automatic backups and monitoring.

1. **Add Redis to your Railway project:**
   - Open your Railway project
   - Click **+ New**
   - Select **Database** → **Add Redis**
   - Railway will provision a Redis instance

2. **Copy the Redis URL:**
   - Click on the Redis service
   - Go to **Connect** tab
   - Copy the **Redis URL** (format: `redis://default:password@host:port`)

3. **Add to backend environment:**
   - Go to your **backend service** in Railway
   - Click **Variables** tab
   - Add new variable:
     ```
     REDIS_URL=redis://default:password@host:port
     ```
   - Railway will auto-deploy with the new variable

4. **Verify connection:**
   - Check Railway logs for: `[redis] connected` (no error messages)
   - If you see `[redis] connection error`, verify the URL is correct

### Option 2: External Redis (Upstash, Redis Cloud, etc.)

If you want to use an external Redis service:

1. **Create a Redis instance:**
   - **Upstash**: https://upstash.com (generous free tier, serverless)
   - **Redis Cloud**: https://redis.com/cloud (free 30MB)
   - **AWS ElastiCache**: for AWS deployments

2. **Get the connection URL:**
   - Format: `redis://username:password@host:port`
   - For Upstash: `redis://default:password@region.upstash.io:port`

3. **Add to Railway backend:**
   ```
   REDIS_URL=redis://your-redis-url
   ```

### Option 3: No Redis (Development/Single Instance)

If you don't set `REDIS_URL`, the system automatically falls back to in-memory cache:

- ✅ Works fine for development
- ✅ Works fine for single backend instance
- ⚠️ Not recommended for production with multiple instances
- ⚠️ Cache lost on backend restart

**No code changes needed** - the system detects Redis availability automatically.

---

## Environment Variable

Add this to your **Railway backend** environment variables:

```bash
REDIS_URL=redis://default:password@host:port
```

### Format Variants

Different Redis providers use different URL formats:

```bash
# Railway Redis
REDIS_URL=redis://default:password@containers-us-west-1.railway.app:6379

# Upstash
REDIS_URL=redis://default:password@us1-brief-mouse-12345.upstash.io:6379

# Redis Cloud
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345

# Local development
REDIS_URL=redis://localhost:6379
```

**Note:** The URL must start with `redis://` (not `rediss://` for TLS - ioredis handles TLS automatically if needed)

---

## How It Works

### Cache Key Format

```
checkout:{idempotencyKey}
```

Example: `checkout:1kx2m3n4-abc123def456ghi789`

### Cache Value

Stores the Stripe session ID:
```
cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0
```

### TTL (Time To Live)

- **24 hours** (86400 seconds)
- Automatically expires after TTL
- No manual cleanup needed

### Flow Diagram

```
User clicks checkout
    ↓
Frontend sends idempotency key
    ↓
Backend checks Redis: GET checkout:{key}
    ↓
┌─────────────┬──────────────┐
│ Cache Hit   │  Cache Miss  │
├─────────────┼──────────────┤
│ Validate    │  Create new  │
│ session in  │  Stripe      │
│ Stripe      │  session     │
│     ↓       │      ↓       │
│ Return      │  Store in    │
│ cached URL  │  Redis with  │
│             │  24h TTL     │
│             │      ↓       │
│             │  Return URL  │
└─────────────┴──────────────┘
```

---

## Benefits of Redis

### 1. Horizontal Scaling
Multiple backend instances share the same cache:
```
Backend Instance 1 ──┐
Backend Instance 2 ──┼──> Redis Cache
Backend Instance 3 ──┘
```

Without Redis, each instance has its own memory cache → user might hit different instances → duplicate sessions possible.

### 2. Restart Persistence
Cache survives backend restarts:
```
Before: User clicks checkout → backend restarts → cache lost → new session
After:  User clicks checkout → backend restarts → cache in Redis → same session
```

### 3. Better Resource Usage
Redis manages memory efficiently:
- Automatic eviction policies
- Memory limits configurable
- No cleanup code needed in application

### 4. Monitoring
Redis provides metrics:
- Cache hit rate
- Memory usage
- Key expiration stats
- Connection health

---

## Testing

### Verify Redis Connection

After adding `REDIS_URL` to Railway:

1. **Check logs:**
   ```
   [checkout] created session cs_xxx for idempotency key: 1234-abc
   ```
   (No Redis errors = connected successfully)

2. **Test idempotency:**
   - Click checkout button
   - Wait 2 seconds
   - Click again
   - Should see in logs: `[checkout] returning cached session for idempotency key: 1234-abc`

3. **Test persistence:**
   - Click checkout
   - Restart backend (Railway dashboard → restart)
   - Click checkout again with same cart within 10 minutes
   - Should return cached session (not create new one)

### Verify Fallback to In-Memory

Remove `REDIS_URL` temporarily:

1. Backend should start without errors
2. Checkout should still work
3. Logs show no Redis connection attempts
4. Cache lives in memory (lost on restart)

---

## Monitoring

### Railway Dashboard

- **Redis service** → Metrics tab
  - Connected clients
  - Memory usage
  - Commands per second

### Backend Logs

**Successful cache hit (Redis):**
```
[checkout] returning cached session for idempotency key: 1234-abc
```

**New session created:**
```
[checkout] created session cs_xxx for idempotency key: 1234-abc
```

**Redis connection error:**
```
[redis] connection error: ECONNREFUSED
```
(System falls back to in-memory automatically)

---

## Troubleshooting

### Issue: Backend won't start after adding REDIS_URL

**Cause:** Invalid Redis URL format

**Solution:** 
- Verify URL format: `redis://default:password@host:port`
- Check for typos in password/host
- Ensure no trailing slashes

### Issue: Cache not shared between instances

**Cause:** Each instance using different Redis or no REDIS_URL set

**Solution:**
- Verify all backend instances have same `REDIS_URL`
- Check Railway logs for Redis connection success

### Issue: Sessions expiring too quickly

**Cause:** Expected behavior - 24h TTL

**Solution:**
- Client-side idempotency key expires after 10 minutes (by design)
- After 10 minutes, user should checkout again (generates new key)
- This is correct behavior - prevents stale sessions

### Issue: Redis memory full

**Cause:** Too many cached sessions

**Solution:**
- Railway Redis has automatic eviction
- Increase Redis memory limit if needed
- 24h TTL ensures old sessions are cleaned up

---

## Cost Considerations

### Railway Redis Pricing

- **Free tier**: Not available for Redis
- **Starter**: ~$5/month for 256MB
- **Production**: ~$10/month for 1GB

**Usage estimate for Nostrum:**
- Average session ID: ~70 bytes
- With idempotency key: ~100 bytes per entry
- 1MB = ~10,000 cached sessions
- 256MB = ~2.5 million cached sessions

**Recommendation:** 256MB is more than enough unless you have millions of daily checkouts.

### Upstash Pricing (Alternative)

- **Free tier**: 10,000 commands/day
- **Pay-as-you-go**: $0.20 per 100k commands
- **Serverless**: No idle costs

**Usage estimate:**
- 1 checkout = 2 Redis commands (GET + SET)
- 5,000 checkouts/day = 10,000 commands = FREE
- 50,000 checkouts/day = 100k commands = $0.20/day = $6/month

---

## Migration Path

### Current State (In-Memory)
Already deployed and working.

### With Redis (Recommended)
1. Add Railway Redis service (takes 1 minute)
2. Copy Redis URL
3. Add `REDIS_URL` to backend variables
4. Deploy automatically
5. Verify in logs (no errors = success)

### No Changes Required To:
- Frontend code
- Stripe configuration
- Order creation flow
- Webhook handling
- Any other part of the system

---

## Summary

**What you need to do:**

1. Add Redis service in Railway (or use external Redis)
2. Copy the Redis URL
3. Add to backend environment: `REDIS_URL=redis://...`
4. Deploy (happens automatically)

**What you get:**

✅ Shared cache across all backend instances  
✅ Cache survives restarts  
✅ Better reliability  
✅ Production-ready architecture  
✅ Automatic fallback if Redis is down  

**Cost:** ~$5-10/month for Railway Redis (or free tier from Upstash)

**Effort:** 5 minutes to set up

**Recommended:** YES for production, especially if you plan to scale horizontally.
