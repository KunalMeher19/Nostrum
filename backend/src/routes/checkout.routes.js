// POST /api/checkout · create a Stripe Checkout Session.
//
// Validates cart lines against the live products collection (never trust
// browser prices), creates a Stripe Checkout Session in hosted-UI mode,
// and returns the session URL for the frontend to redirect to.
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

const router = express.Router();

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
    // 1. Parse + coarse-validate the incoming cart lines.
    // ------------------------------------------------------------------
    const { items, locale } = req.body ?? {};

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
    const slugs = [...new Set(items.map((i) => i.slug))];
    const products = await Product.find({
      slug: { $in: slugs },
      active: true,
    }).lean();

    const productMap = Object.fromEntries(products.map((p) => [p.slug, p]));

    const lineItems = [];
    for (const item of items) {
      const product = productMap[item.slug];
      if (!product) {
        return res.status(409).json({ error: 'product_not_found', slug: item.slug });
      }
      const size = product.sizes?.find((s) => s.id === item.sizeId);
      if (!size) {
        return res.status(409).json({ error: 'size_not_found', slug: item.slug, sizeId: item.sizeId });
      }
      if (typeof size.stock === 'number' && size.stock < item.qty) {
        return res.status(409).json({
          error: 'out_of_stock',
          slug: item.slug,
          sizeId: item.sizeId,
          available: size.stock,
        });
      }

      // Stripe line_items take unit_amount in the SMALLEST currency unit
      // (cents). Round to avoid float drift.
      const unitCents = Math.round(size.price * 100);
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${product.name} — ${size.label}`,
            description: product.subtitle ?? undefined,
            images: product.images?.length ? [product.images[0]] : [],
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

    // ------------------------------------------------------------------
    // 3. Optional: pre-fill the email for logged-in users.
    // ------------------------------------------------------------------
    const session = await readSession(req);
    const customerEmail = session?.email ?? undefined;

    // ------------------------------------------------------------------
    // 4. Build success/cancel URLs (locale-aware, 5 locales).
    // ------------------------------------------------------------------
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const localePrefix = LOCALE_MAP[locale] ? `/${locale}` : '/en';

    // {CHECKOUT_SESSION_ID} is a Stripe template literal — NOT a JS
    // template string. Stripe substitutes it server-side after payment.
    const successUrl = `${frontendUrl}${localePrefix}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}${localePrefix}/shop/checkout/cancel`;

    // ------------------------------------------------------------------
    // 5. Create the Stripe Checkout Session.
    // ------------------------------------------------------------------
    const shippingCost = shippingCents();

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      // Stripe collects the shipping address; we freeze a copy into the
      // order record when the webhook fires.
      shipping_address_collection: {
        allowed_countries: [
          'ES', 'FR', 'DE', 'IT', 'PT', 'GB', 'NL', 'BE', 'AT', 'CH',
          'PL', 'SE', 'DK', 'NO', 'FI', 'IE', 'GR', 'HR', 'CZ', 'SK',
          'RO', 'HU', 'SI', 'LT', 'LV', 'EE', 'BG', 'CY', 'LU', 'MT',
          'US', 'CA', 'AU',
        ],
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: LOCALE_MAP[locale] ?? 'auto',
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

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Carry the cart payload + user id in metadata so the webhook can
    // build the order without re-fetching the session's line_items.
    sessionParams.metadata = {
      cartJson: JSON.stringify(
        items.map((i) => ({ slug: i.slug, sizeId: i.sizeId, qty: i.qty }))
      ),
      locale: locale ?? 'en',
      ...(session?.uid ? { userId: String(session.uid) } : {}),
    };

    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: stripeSession.url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
