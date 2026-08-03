// /api/admin · role-gated admin API (orders, customers, products).
const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const orders = require('../services/orders.service');
const { streamInvoice } = require('../services/invoice.service');
const { Order } = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

/* ── Orders ───────────────────────────────────────────────────────── */

router.get('/orders', async (req, res, next) => {
  try {
    const list = await orders.listAllOrders({
      status: req.query.status,
      q: req.query.q,
    });
    res.json({ orders: list });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await orders.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// Update shipping status (+ optional carrier / tracking). Reflected in
// the customer portal immediately (same collection).
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, carrier, trackingCode } = req.body || {};
    const order = await orders.updateOrderStatus(req.params.id, status, {
      carrier,
      trackingCode,
    });
    if (!order) return res.status(400).json({ error: 'Invalid status or order' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id/invoice', async (req, res, next) => {
  try {
    const doc = await orders.getOrderDoc(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Order not found' });
    streamInvoice(doc, res);
  } catch (err) {
    next(err);
  }
});

/* ── Customers (email-marketing export) ───────────────────────────── */

async function customerRows() {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  // Order counts per user in one aggregation.
  const counts = await Order.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 }, total: { $sum: '$total' } } },
  ]);
  const byUser = new Map(counts.map((c) => [String(c._id), c]));
  return users.map((u) => {
    const c = byUser.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name ?? '',
      email: u.email,
      role: u.role ?? 'customer',
      locale: u.locale ?? '',
      gdprConsentAt: u.gdprConsentAt ?? null,
      createdAt: u.createdAt ?? null,
      orderCount: c ? c.count : 0,
      orderTotal: c ? Math.round(c.total * 100) / 100 : 0,
    };
  });
}

router.get('/customers', async (req, res, next) => {
  try {
    res.json({ customers: await customerRows() });
  } catch (err) {
    next(err);
  }
});

// CSV export for email marketing: name, email, consent date, orders.
router.get('/customers.csv', async (req, res, next) => {
  try {
    const rows = await customerRows();
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = 'name,email,consent_date,signup_date,locale,order_count,order_total_eur';
    const lines = rows.map((r) =>
      [
        esc(r.name),
        esc(r.email),
        esc(r.gdprConsentAt ? new Date(r.gdprConsentAt).toISOString().slice(0, 10) : ''),
        esc(r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
        esc(r.locale),
        r.orderCount,
        r.orderTotal.toFixed(2),
      ].join(',')
    );
    const csv = [header, ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nostrum-customers-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send('﻿' + csv); // BOM so Excel opens UTF-8 accents correctly
  } catch (err) {
    next(err);
  }
});

/* ── Products (shop management) ───────────────────────────────────── */

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 }).lean();
    res.json({
      products: products.map((p) => ({ ...p, id: String(p._id), _id: undefined })),
    });
  } catch (err) {
    next(err);
  }
});

// Edit name/subtitle/prices/stock/sizes/packs/active. Slug is identity;
// not editable here.
router.patch('/products/:id', async (req, res, next) => {
  try {
    const b = req.body || {};
    const updates = {};
    if (typeof b.name === 'string' && b.name.trim()) updates.name = b.name.trim().slice(0, 120);
    if (typeof b.subtitle === 'string') updates.subtitle = b.subtitle.trim().slice(0, 160);
    if (typeof b.active === 'boolean') updates.active = b.active;
    if (typeof b.defaultSizeId === 'string') updates.defaultSizeId = b.defaultSizeId;
    if (Array.isArray(b.sizes)) {
      updates.sizes = b.sizes
        .filter((s) => s && typeof s.id === 'string' && s.id.trim())
        .map((s) => ({
          id: s.id.trim().slice(0, 30),
          label: String(s.label ?? s.id).slice(0, 30),
          price: Math.max(0, Number(s.price) || 0),
          stock: Math.max(0, Math.floor(Number(s.stock) || 0)),
        }));
      if (!updates.sizes.length) return res.status(400).json({ error: 'At least one size' });
    }
    if (Array.isArray(b.packs)) {
      updates.packs = b.packs
        .filter((p) => p && Number(p.qty) >= 1)
        .map((p) => ({
          qty: Math.floor(Number(p.qty)),
          discount: Math.min(0.9, Math.max(0, Number(p.discount) || 0)),
        }))
        .sort((a, z) => a.qty - z.qty);
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: { ...product, id: String(product._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
