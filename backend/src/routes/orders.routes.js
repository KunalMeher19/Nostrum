// /api/orders · customer-facing order history (portal).
// Reads go through orders.service — the swap point for Shopify/Stripe.
const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const orders = require('../services/orders.service');
const { streamInvoice } = require('../services/invoice.service');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json({ orders: await orders.listOrdersForUser(req.user.id) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await orders.getOrderForUser(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// Downloadable PDF invoice, owner-only.
router.get('/:id/invoice', requireAuth, async (req, res, next) => {
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
