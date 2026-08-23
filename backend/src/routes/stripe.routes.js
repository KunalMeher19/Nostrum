// POST /api/stripe/webhook · verify + handle Stripe events with idempotency.
//
// This route MUST be mounted BEFORE express.json so it receives the raw
// request body — Stripe's signature check requires the exact bytes that
// were signed. See app.js for the exclusion pattern.
//
// Orders are ONLY created here, never from the success-redirect page.
// The redirect can be hit by the user refreshing, navigating back, etc.
// The webhook fires exactly once per completed payment (Stripe retries on
// non-2xx until acknowledged) — that's the safe creation point.
//
// IDEMPOTENCY: uses stripeSessionId as the idempotency key. If an order
// already exists for a given session ID, returns success without creating
// a duplicate order. This prevents double-order creation when Stripe
// retries the webhook or sends duplicate events.
const express = require('express');
const Stripe = require('stripe');
const orders = require('../services/orders.service');
const Product = require('../models/product.model');
const { Order } = require('../models/order.model');

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

// Build the order payload from a completed Stripe Checkout Session.
// The cart is carried in session.metadata.cartJson so we don't have to
// list the session's line_items (which requires an extra API call and
// doesn't give us the internal slug/sizeId we need for stock consumption).
async function buildOrderPayload(session) {
  const cart = JSON.parse(session.metadata?.cartJson ?? '[]');
  const locale = session.metadata?.locale ?? 'en';
  const userId = session.metadata?.userId ?? null;
  const idempotencyKey = session.metadata?.idempotencyKey ?? null;

  // Re-fetch server-side prices (the cart metadata holds the slug/sizeId
  // the browser sent; prices come from the DB, not from Stripe or the
  // metadata, so they match the moment the session was created).
  const slugs = [...new Set(cart.map((i) => i.slug))];
  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const productMap = Object.fromEntries(products.map((p) => [p.slug, p]));

  const items = [];
  let subtotal = 0;

  for (const ci of cart) {
    const product = productMap[ci.slug];
    const size = product?.sizes?.find((s) => s.id === ci.sizeId);
    if (!product || !size) {
      // Product was removed between session creation and fulfilment.
      // Charge already went through — skip the line (stock can't be
      // consumed for a ghost item). This is an edge case; the admin
      // will see the order with a missing line and handle it manually.
      console.warn(`[webhook] product/size not found at fulfilment: ${ci.slug}/${ci.sizeId}`);
      continue;
    }
    const unitPrice = size.price;
    const lineTotal = Math.round(unitPrice * ci.qty * 100) / 100;
    subtotal += lineTotal;
    items.push({
      productSlug: product.slug,
      productName: product.name,
      sizeId: size.id,
      sizeLabel: size.label,
      unitPrice,
      qty: ci.qty,
      discount: 0,
      lineTotal,
    });
  }

  // Stripe stores amounts in cents; convert back to EUR.
  const shippingCost = (session.shipping_cost?.amount_total ?? 0) / 100;
  const total = Math.round((subtotal + shippingCost) * 100) / 100;

  // Stripe shipping_details shape → our addressSchema shape.
  const sd = session.shipping_details;
  const shippingAddress = sd
    ? {
        fullName: sd.name ?? '',
        line1: sd.address?.line1 ?? '',
        line2: sd.address?.line2 ?? '',
        city: sd.address?.city ?? '',
        region: sd.address?.state ?? '',
        postalCode: sd.address?.postal_code ?? '',
        country: sd.address?.country ?? '',
        phone: session.customer_details?.phone ?? '',
      }
    : null;

  return {
    userId: userId ?? null,
    email: session.customer_details?.email ?? session.customer_email ?? '',
    items,
    subtotal,
    shippingCost,
    total,
    currency: 'EUR',
    status: 'placed',
    statusHistory: [{ status: 'placed', at: new Date() }],
    shippingAddress,
    placedAt: new Date(),
    // Store the Stripe session id for idempotency and reference
    stripeSessionId: session.id,
    // Store the payment intent id for refunds
    stripePaymentIntentId: session.payment_intent ?? null,
    // Store the client's idempotency key
    idempotencyKey,
    // Locale is carried through metadata (used in future per-locale emails).
    locale,
  };
}

// Raw-body middleware for this router only (must come before express.json
// in the middleware chain — see app.js exclusion pattern).
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      console.error('[stripe webhook] STRIPE_SECRET_KEY not set');
      return res.status(503).json({ error: 'payments_not_configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set; rejecting all events');
      return res.status(400).json({ error: 'webhook_not_configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[stripe webhook] signature verification failed:', err.message);
      return res.status(400).json({ error: 'invalid_signature' });
    }

    // Only handle the one event we care about; acknowledge everything else
    // immediately so Stripe doesn't retry other event types forever.
    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    const session = event.data.object;

    // Guard: only create an order when payment was successful.
    if (session.payment_status !== 'paid') {
      console.warn(`[stripe webhook] session ${session.id} not paid (${session.payment_status}); skipping`);
      return res.json({ received: true });
    }

    // ------------------------------------------------------------------
    // IDEMPOTENCY CHECK: If an order already exists for this session,
    // return success immediately without creating a duplicate.
    // ------------------------------------------------------------------
    try {
      const existingOrder = await Order.findOne({
        stripeSessionId: session.id,
      }).lean();

      if (existingOrder) {
        console.log(`[stripe webhook] order already exists for session ${session.id}: ${existingOrder.number}`);
        return res.json({ received: true, orderId: existingOrder.number, duplicate: true });
      }
    } catch (err) {
      console.error('[stripe webhook] idempotency check failed:', err.message);
      // If the check itself fails, return 500 so Stripe retries later
      return res.status(500).json({ error: 'idempotency_check_failed' });
    }

    // ------------------------------------------------------------------
    // Order creation with atomic stock consumption
    // ------------------------------------------------------------------
    try {
      const payload = await buildOrderPayload(session);

      if (payload.items.length === 0) {
        console.error(`[stripe webhook] session ${session.id}: no resolvable items; order not created`);
        // Still return 200 — Stripe has no action to retry here.
        // The payment went through but the cart is empty (products deleted).
        // Admin will need to manually refund via Stripe dashboard.
        return res.json({ received: true, warning: 'no_items' });
      }

      const order = await orders.createOrder(payload);
      console.log(`[stripe webhook] order created: ${order.number} (session ${session.id})`);

      return res.json({ received: true, orderId: order.number });
    } catch (err) {
      if (err.code === 'OUT_OF_STOCK') {
        // Stock ran out between session creation and webhook delivery.
        // This is a rare race condition. Log it with full details.
        console.error(
          `[stripe webhook] OUT_OF_STOCK on session ${session.id}:`,
          JSON.stringify(err.item)
        );
        console.error(`[stripe webhook] payment intent: ${session.payment_intent}`);

        // Return 200 so Stripe doesn't retry — the item is genuinely gone.
        // The payment went through but we can't fulfill the order.
        // Store a partial order record for admin visibility and manual handling.
        try {
          const payload = await buildOrderPayload(session);
          // Create order with cancelled status and a note about the stock issue
          payload.status = 'cancelled';
          payload.statusHistory = [
            { status: 'placed', at: new Date() },
            { status: 'cancelled', at: new Date() },
          ];
          const cancelledOrder = await orders.createOrder(payload);
          console.log(`[stripe webhook] created cancelled order for out-of-stock: ${cancelledOrder.number}`);

          // TODO: Trigger automatic refund via Stripe API
          // await stripe.refunds.create({ payment_intent: session.payment_intent });
          // TODO: Send apology email to customer with refund notification

        } catch (orderErr) {
          console.error('[stripe webhook] failed to create cancelled order record:', orderErr.message);
        }

        return res.json({
          received: true,
          warning: 'out_of_stock',
          requires_manual_refund: true,
          payment_intent: session.payment_intent,
        });
      }

      // Handle duplicate order number race (extremely rare but possible)
      if (err.code === 11000 && err.keyPattern?.number) {
        console.warn(`[stripe webhook] duplicate order number collision for session ${session.id}`);
        // This could mean another webhook instance already created the order
        // Return 200 to acknowledge (don't retry) but log for investigation
        return res.json({ received: true, warning: 'order_number_collision' });
      }

      // Handle duplicate session ID race (also rare)
      if (err.code === 11000 && err.keyPattern?.stripeSessionId) {
        console.warn(`[stripe webhook] duplicate session ID collision for ${session.id}`);
        // Another webhook instance is processing this same session
        return res.json({ received: true, warning: 'session_id_collision' });
      }

      // For any other error (DB down, network issue, etc.) return 500
      // so Stripe retries the webhook later.
      console.error('[stripe webhook] order creation failed:', err.message);
      console.error('[stripe webhook] stack:', err.stack);
      return res.status(500).json({ error: 'order_creation_failed' });
    }
  }
);

module.exports = router;
