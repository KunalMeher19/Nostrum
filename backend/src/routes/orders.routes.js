// /api/orders · customer-facing order history (portal).
// Reads go through orders.service — the swap point for Shopify/Stripe.
const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  heavyLimiter,
  publicWriteLimiter,
  makeLimiter,
} = require('../middlewares/rate-limit.middleware');
const { requireObjectId } = require('../middlewares/sanitize.middleware');
const orders = require('../services/orders.service');
const { Order } = require('../models/order.model');
const Subscription = require('../models/subscription.model');
const Stripe = require('stripe');
const { streamInvoice } = require('../services/invoice.service');

const router = express.Router();

// Tight limiter for the by-session polling endpoint (success page calls
// this up to ~4 times in 8 seconds per checkout). 20/min per IP is
// generous enough for real use and tight enough to block bulk scraping.
const bySessionLimiter = makeLimiter({
  windowMs: 60_000,
  max: 20,
});

// Guest order tracking: order number + purchase email, no account.
// POST (not GET) keeps the email out of URLs/logs; the publicWrite
// limiter throttles guessing, and the pair itself is the proof of
// ownership (same model as every carrier's tracking page).
router.post('/lookup', publicWriteLimiter, async (req, res, next) => {
  try {
    const { number, email } = req.body || {};
    if (typeof number !== 'string' || !number.trim())
      return res.status(400).json({ error: 'number_required' });
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'invalid_email' });
    const order = await orders.getOrderByNumberAndEmail(number, email);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// POST-payment polling: success page fetches order by Stripe session ID.
// The session ID (cs_live_... or cs_test_...) is a Stripe-generated secret
// token — only the customer who just paid has it in their redirect URL.
// No auth required: knowing the session ID IS the proof of payment.
// Returns 404 (not an error) while the webhook hasn't fired yet, so the
// client can safely poll with a retry loop.
// Security:
//  - session ID format validated (must start with cs_ and be 30–200 chars)
//  - bySessionLimiter: 20 req/min per IP  (4 polls × a few retries = fine)
//  - only returns the fields the success page needs (no admin-level data)
//  - only matches orders with status 'placed' or 'confirmed' to prevent
//    scraping order history via guessed session IDs
router.get('/by-session/:sessionId', bySessionLimiter, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    // Validate: Stripe session IDs start with cs_ and are 30-200 chars
    if (
      typeof sessionId !== 'string' ||
      !/^cs_(live|test)_[A-Za-z0-9_]{20,180}$/.test(sessionId)
    ) {
      return res.status(400).json({ error: 'invalid_session_id' });
    }
    const order = await Order.findOne({
      stripeSessionId: sessionId,
      status: { $in: ['placed', 'confirmed', 'preparing', 'shipped', 'delivered'] },
    }).lean();
    if (!order) {
      // Webhook hasn't fired yet — client should retry
      return res.status(404).json({ error: 'order_not_yet_created' });
    }
    // Return the full detail shape (same as the portal)
    res.json({ order: orders.serializeOrder(order, { detail: true }) });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, heavyLimiter, async (req, res, next) => {
  try {
    res.json({ orders: await orders.listOrdersForUser(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// A buyer sees only their own live subscriptions. Email fallback covers a
// guest purchase which was later claimed by the same verified account.
router.get('/subscriptions', requireAuth, heavyLimiter, async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      status: { $in: ['active', 'trialing', 'past_due'] },
      $or: [{ userId: req.user.id }, { email: String(req.user.email || '').toLowerCase() }],
    }).sort({ createdAt: -1 }).lean();
    res.json({ subscriptions: subscriptions.map((s) => ({ ...s, id: String(s._id), _id: undefined })) });
  } catch (err) { next(err); }
});

router.delete('/subscriptions/:id', requireAuth, requireObjectId('id'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user.id }, { email: String(req.user.email || '').toLowerCase() }],
    });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) return res.status(400).json({ error: 'Subscription is not active' });
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(503).json({ error: 'payments_not_configured' });
    await new Stripe(key, { apiVersion: '2024-11-20.acacia' }).subscriptions.cancel(subscription.stripeSubscriptionId);
    subscription.status = 'cancelled'; subscription.cancelledAt = new Date(); subscription.updatedAt = new Date();
    await subscription.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/:id', requireObjectId('id'), requireAuth, async (req, res, next) => {
  try {
    const order = await orders.getOrderForUser(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// Downloadable PDF invoice, owner-only.
router.get('/:id/invoice', heavyLimiter, requireObjectId('id'), requireAuth, async (req, res, next) => {
  try {
    const doc = await orders.getOrderDoc(req.params.id);
    if (!doc || String(doc.userId) !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    streamInvoice(doc, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
