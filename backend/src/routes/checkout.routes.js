// POST /api/checkout · create a Stripe Checkout Session with idempotency.
//
// Validates cart lines against the live products collection (never trust
// browser prices), creates a Stripe Checkout Session in hosted-UI mode,
// and returns the session URL for the frontend to redirect to.
//
// IDEMPOTENCY: accepts an idempotencyKey from the client. If a session
// was already created with that key (within 24h), returns the existing
// session instead of creating a duplicate. Prevents double-charging when
// the user clicks checkout multiple times or the browser retries a failed
// request.
//
// REDIS-BACKED: when REDIS_URL is set, idempotency cache is stored in
// Redis (shared across all backend instances, survives restarts). When
// REDIS_URL is unset, falls back to in-memory cache (single instance, dev).
//
// Shipping: flat fee from SHIPPING_COST_EUR env var (cents, default 0)
// while the client decides on courier services. Swap to Stripe Shipping
// Rates when the client confirms the carrier + pricing.
//
// Guest checkout: Stripe collects the email; logged-in users get their
// email pre-filled via customer_email. Orders are NEVER created here —
// they are created inside the webhook on checkout.session.completed so
// no amount is charged without a confirmed order record.
const express = require('express');
const Stripe = require('stripe');
const Product = require('../models/product.model');
const { readSession } = require('../middlewares/auth.middleware');
const { publicWriteLimiter } = require('../middlewares/rate-limit.middleware');
const { getRedis } = require('../db/redis');

const router = express.Router();

// Cache TTL: 24 hours (86400 seconds in Redis, ms for in-memory)
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

// In-memory fallback cache (used when REDIS_URL is unset).
// Structure: Map<idempotencyKey, { sessionId, createdAt }>
const memoryCache = new Map();

// Periodic cleanup of expired in-memory entries (runs every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.createdAt > CACHE_TTL_MS) {
      memoryCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Get cached session ID for an idempotency key (Redis or in-memory).
async function getCachedSession(idempotencyKey) {
  const redis = getRedis();
  if (redis) {
    // Redis mode: read from Redis
    const sessionId = await redis.get(`checkout:${idempotencyKey}`);
    return sessionId; // null if not found or expired
  } else {
    // In-memory mode: read from Map
    const cached = memoryCache.get(idempotencyKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return cached.sessionId;
    }
    return null;
  }
}

// Cache a session ID for an idempotency key (Redis or in-memory).
async function setCachedSession(idempotencyKey, sessionId) {
  const redis = getRedis();
  if (redis) {
    // Redis mode: store with TTL
    await redis.setex(`checkout:${idempotencyKey}`, CACHE_TTL_SECONDS, sessionId);
  } else {
    // In-memory mode: store with timestamp
    memoryCache.set(idempotencyKey, {
      sessionId,
      createdAt: Date.now(),
    });
  }
}

// Stripe client — lazy so the process boots cleanly without the key
// (dev / CI). Returns null when unconfigured; callers return 503.
let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' });
  return _stripe;
}

// Flat shipping in EUR cents (0 = free shipping placeholder).
function shippingCents() {
  const raw = parseInt(process.env.SHIPPING_COST_EUR ?? '0', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

// Locale → Stripe-accepted locale mapping (best-effort; 'auto' is the
// safe fallback that lets Stripe pick from the browser's Accept-Language).
const LOCALE_MAP = {
  en: 'en',
  es: 'es',
  ca: 'auto', // Stripe has no 'ca'; 'auto' lets it detect
  it: 'it',
  el: 'el',
};

router.post('/', publicWriteLimiter, async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'payments_not_configured' });
    }

    // ------------------------------------------------------------------
    // 1. Parse + coarse-validate the incoming cart lines + idempotency key + shipping address.
    // ------------------------------------------------------------------
    const { items, locale, idempotencyKey, shippingAddress } = req.body ?? {};

    // Idempotency key is required to prevent duplicate charges
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 100) {
      return res.status(400).json({ error: 'invalid_idempotency_key' });
    }

    // Check if we already created a session for this idempotency key
    const cachedSessionId = await getCachedSession(idempotencyKey);
    if (cachedSessionId) {
      try {
        // Verify the session still exists in Stripe
        const session = await stripe.checkout.sessions.retrieve(cachedSessionId);
        if (session && session.url) {
          console.log(`[checkout] returning cached session for idempotency key: ${idempotencyKey}`);
          return res.json({ url: session.url, cached: true });
        }
      } catch (err) {
        // Session expired or deleted — continue to create a new one
        console.warn(`[checkout] cached session ${cachedSessionId} not found; creating new session`);
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'cart_empty' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'cart_too_large' });
    }

    for (const item of items) {
      if (
        typeof item.slug !== 'string' ||
        typeof item.sizeId !== 'string' ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 999
      ) {
        return res.status(400).json({ error: 'invalid_cart_item' });
      }
    }

    // ------------------------------------------------------------------
    // 2. Server-side price lookup. Never use browser-supplied prices.
    // ------------------------------------------------------------------

    // Get frontend URL early - needed for converting relative image paths to absolute URLs
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

    const slugs = [...new Set(items.map((i) => i.slug))];
    const products = await Product.find({
      slug: { $in: slugs },
      active: true,
    }).lean();

    const productMap = Object.fromEntries(products.map((p) => [p.slug, p]));

    const lineItems = [];
    let hasStockIssue = false;
    let stockErrorDetail = null;

    for (const item of items) {
      const product = productMap[item.slug];
      if (!product) {
        return res.status(409).json({ error: 'product_not_found', slug: item.slug });
      }
      const size = product.sizes?.find((s) => s.id === item.sizeId);
      if (!size) {
        return res.status(409).json({ error: 'size_not_found', slug: item.slug, sizeId: item.sizeId });
      }

      // Pre-check stock availability (webhook will do atomic check again)
      if (typeof size.stock === 'number' && size.stock < item.qty) {
        hasStockIssue = true;
        stockErrorDetail = {
          error: 'out_of_stock',
          slug: item.slug,
          sizeId: item.sizeId,
          available: size.stock,
          requested: item.qty,
        };
        break;
      }

      // Stripe line_items take unit_amount in the SMALLEST currency unit
      // (cents). Round to avoid float drift.
      const unitCents = Math.round(size.price * 100);

      // Stripe requires absolute URLs for images. Convert relative paths to absolute.
      let productImages = [];
      if (product.images?.length) {
        const firstImage = product.images[0];
        // If it's already an absolute URL (starts with http), use as-is
        if (firstImage.startsWith('http')) {
          productImages = [firstImage];
        } else {
          // Relative path - prepend frontend URL
          productImages = [`${frontendUrl}${firstImage}`];
        }
      }

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${product.name} — ${size.label}`,
            description: product.subtitle ?? undefined,
            images: productImages,
            metadata: {
              productSlug: product.slug,
              sizeId: size.id,
            },
          },
          unit_amount: unitCents,
        },
        quantity: item.qty,
      });
    }

    if (hasStockIssue) {
      return res.status(409).json(stockErrorDetail);
    }

    // ------------------------------------------------------------------
    // 3. Optional: pre-fill the email for logged-in users.
    //    AND: Pre-fill shipping address from the checkout page.
    // ------------------------------------------------------------------
    const session = await readSession(req);
    const customerEmail = session?.email ?? shippingAddress?.email ?? undefined;

    // ------------------------------------------------------------------
    // 4. Build success/cancel URLs (locale-aware, 5 locales).
    // ------------------------------------------------------------------
    // frontendUrl already defined above (needed for image URLs)
    const localePrefix = LOCALE_MAP[locale] ? `/${locale}` : '/en';

    // {CHECKOUT_SESSION_ID} is a Stripe template literal — NOT a JS
    // template string. Stripe substitutes it server-side after payment.
    const successUrl = `${frontendUrl}${localePrefix}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}${localePrefix}/shop/checkout/cancel`;

    // ------------------------------------------------------------------
    // 5. Create the Stripe Checkout Session with Stripe's idempotency.
    // ------------------------------------------------------------------
    const shippingCost = shippingCents();

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      // NO longer collect shipping address - it's already collected on our /checkout page
      // Instead, we'll pass the pre-filled address via customer_details and shipping_details
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: LOCALE_MAP[locale] ?? 'auto',
      // Payment intent data for better tracking
      payment_intent_data: {
        metadata: {
          idempotencyKey,
        },
      },
      // Pre-fill customer email and phone from the checkout form
      customer_email: customerEmail,
      // Automatic tax is disabled until the client adds their Spanish tax
      // registration to Stripe. Enable with: automatic_tax: { enabled: true }
    };

    // Attach a flat shipping option only when a non-zero cost is configured.
    if (shippingCost > 0) {
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shippingCost, currency: 'eur' },
            display_name: 'Standard shipping',
          },
        },
      ];
    }

    // Carry the cart payload + user id + idempotency key in metadata so
    // the webhook can build the order without re-fetching the session's
    // line_items and can implement its own idempotency check.
    sessionParams.metadata = {
      cartJson: JSON.stringify(
        items.map((i) => ({ slug: i.slug, sizeId: i.sizeId, qty: i.qty }))
      ),
      locale: locale ?? 'en',
      idempotencyKey,
      ...(session?.uid ? { userId: String(session.uid) } : {}),
      ...(shippingAddress
        ? {
            shipName: String(shippingAddress.fullName ?? '').slice(0, 500),
            shipEmail: String(shippingAddress.email ?? '').slice(0, 500),
            shipPhone: String(shippingAddress.phone ?? '').slice(0, 500),
            shipLine1: String(shippingAddress.line1 ?? '').slice(0, 500),
            shipLine2: String(shippingAddress.line2 ?? '').slice(0, 500),
            shipCity: String(shippingAddress.city ?? '').slice(0, 500),
            shipRegion: String(shippingAddress.region ?? '').slice(0, 500),
            shipPostalCode: String(shippingAddress.postalCode ?? '').slice(0, 500),
            shipCountry: String(shippingAddress.country ?? '').slice(0, 500),
          }
        : {}),
    };

    // Use Stripe's native idempotency by passing the key as a request option.
    // This ensures that if the exact same request is sent twice (network retry,
    // user double-click), Stripe returns the same session instead of creating
    // a duplicate charge.
    const stripeSession = await stripe.checkout.sessions.create(
      sessionParams,
      {
        idempotencyKey: `checkout_${idempotencyKey}`,
      }
    );

    // Cache the session for fast repeated requests (Redis or in-memory)
    await setCachedSession(idempotencyKey, stripeSession.id);

    console.log(`[checkout] created session ${stripeSession.id} for idempotency key: ${idempotencyKey}`);

    res.json({ url: stripeSession.url });
  } catch (err) {
    // Stripe errors
    if (err.type === 'StripeCardError') {
      return res.status(402).json({ error: 'card_declined', message: err.message });
    }
    if (err.type === 'StripeInvalidRequestError') {
      console.error('[checkout] Stripe invalid request:', err.message);
      return res.status(400).json({ error: 'invalid_request' });
    }
    if (err.type === 'StripeAPIError' || err.type === 'StripeConnectionError') {
      console.error('[checkout] Stripe API error:', err.message);
      return res.status(503).json({ error: 'payment_service_unavailable' });
    }
    next(err);
  }
});

module.exports = router;
