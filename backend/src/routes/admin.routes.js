// /api/admin · role-gated admin API (orders, customers, products).
const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
const { writeLimiter, heavyLimiter } = require('../middlewares/rate-limit.middleware');
const { requireObjectId } = require('../middlewares/sanitize.middleware');
const orders = require('../services/orders.service');
const { streamInvoice } = require('../services/invoice.service');
const { recordAudit } = require('../services/audit.service');
const { AuditEvent } = require('../models/audit-event.model');
const { Order } = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const { Exhibit, MUSEUM_ROOMS } = require('../models/exhibit.model');
const SiteContent = require('../models/site-content.model');
const Subscriber = require('../models/subscriber.model');
const { ContactMessage } = require('../models/contact-message.model');

const router = express.Router();

// Tier limiters mount BEFORE the auth gate so unauthenticated probing
// burns the prober's budget instead of free 401s forever.
router.use('/customers.csv', heavyLimiter);
router.use('/newsletter/subscribers.csv', heavyLimiter);
router.use('/orders/:id/invoice', heavyLimiter);
router.use('/orders/:id/status', writeLimiter);
router.use('/products/:id', writeLimiter);
router.use('/products', writeLimiter);
router.use('/upload', writeLimiter);
router.use('/posts', writeLimiter);
router.use('/exhibits', writeLimiter);
router.use('/content', writeLimiter);

// requireAdmin re-reads the role from the users collection on every
// request, so revoking admin in the DB locks this router out instantly.
router.use(requireAuth, requireAdmin);

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

router.get('/orders/:id', requireObjectId('id'), async (req, res, next) => {
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
router.patch('/orders/:id/status', requireObjectId('id'), async (req, res, next) => {
  try {
    const { status, carrier, trackingCode } = req.body || {};
    const order = await orders.updateOrderStatus(req.params.id, status, {
      carrier,
      trackingCode,
    });
    if (!order) return res.status(400).json({ error: 'Invalid status or order' });
    recordAudit(req, 'order.status', req.params.id, {
      number: order.number,
      status: order.status,
      carrier: order.carrier,
      trackingCode: order.trackingCode,
    });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id/invoice', requireObjectId('id'), async (req, res, next) => {
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
    const s = u.shipping || {};
    return {
      id: String(u._id),
      name: u.name ?? '',
      email: u.email,
      role: u.role ?? 'customer',
      locale: u.locale ?? '',
      gdprConsentAt: u.gdprConsentAt ?? null,
      marketingConsentAt: u.marketingConsentAt ?? null,
      createdAt: u.createdAt ?? null,
      orderCount: c ? c.count : 0,
      orderTotal: c ? Math.round(c.total * 100) / 100 : 0,
      // Shipping / contact details registered by the customer
      shipping: {
        fullName: s.fullName ?? '',
        line1: s.line1 ?? '',
        line2: s.line2 ?? '',
        city: s.city ?? '',
        region: s.region ?? '',
        postalCode: s.postalCode ?? '',
        country: s.country ?? '',
        phone: s.phone ?? '',
      },
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
    const header =
      'name,email,phone,address_line1,address_line2,city,region,postal_code,country,' +
      'consent_date,marketing_consent,signup_date,locale,order_count,order_total_eur';
    const lines = rows.map((r) => {
      const s = r.shipping || {};
      return [
        esc(r.name),
        esc(r.email),
        esc(s.phone),
        esc(s.line1),
        esc(s.line2),
        esc(s.city),
        esc(s.region),
        esc(s.postalCode),
        esc(s.country),
        esc(r.gdprConsentAt ? new Date(r.gdprConsentAt).toISOString().slice(0, 10) : ''),
        r.marketingConsentAt ? 'yes' : '',
        esc(r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
        esc(r.locale),
        r.orderCount,
        r.orderTotal.toFixed(2),
      ].join(',');
    });
    const csv = [header, ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nostrum-customers-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    recordAudit(req, 'export.customers', null, { rows: rows.length });
    res.send('﻿' + csv); // BOM so Excel opens UTF-8 accents correctly
  } catch (err) {
    next(err);
  }
});

/* ── Newsletter subscribers (email-marketing export) ──────────────── */

router.get('/newsletter/subscribers', async (req, res, next) => {
  try {
    const subs = await Subscriber.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      subscribers: subs.map((s) => ({
        id: String(s._id),
        email: s.email,
        locale: s.locale ?? '',
        consentAt: s.consentAt ?? null,
        unsubscribedAt: s.unsubscribedAt ?? null,
        createdAt: s.createdAt ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// CSV export mirroring customers.csv: BOM so Excel opens UTF-8 right.
// Unsubscribed addresses are included with their date so the marketing
// tool can suppress them (GDPR: never mail past an unsubscribe).
router.get('/newsletter/subscribers.csv', async (req, res, next) => {
  try {
    const subs = await Subscriber.find({}).sort({ createdAt: -1 }).lean();
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    const header = 'email,locale,consent_date,unsubscribed_date,signup_date';
    const lines = subs.map((s) =>
      [esc(s.email), esc(s.locale), day(s.consentAt), day(s.unsubscribedAt), day(s.createdAt)].join(',')
    );
    const csv = [header, ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nostrum-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    recordAudit(req, 'export.subscribers', null, { rows: subs.length });
    res.send('﻿' + csv); // BOM so Excel opens UTF-8 accents correctly
  } catch (err) {
    next(err);
  }
});

/* ── Audit trail (read-only) ──────────────────────────────────────── */

router.get('/audit-events', async (req, res, next) => {
  try {
    const events = await AuditEvent.find({}).sort({ at: -1 }).limit(200).lean();
    res.json({
      events: events.map((e) => ({ ...e, id: String(e._id), _id: undefined })),
    });
  } catch (err) {
    next(err);
  }
});

/* ── Contact messages (read-only inbox) ───────────────────────────── */

router.get('/contact-messages', async (req, res, next) => {
  try {
    const msgs = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({
      messages: msgs.map((m) => ({ ...m, id: String(m._id), _id: undefined })),
    });
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
router.patch('/products/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const b = req.body || {};
    const updates = {};
    if (typeof b.name === 'string' && b.name.trim()) updates.name = b.name.trim().slice(0, 120);
    if (typeof b.subtitle === 'string') updates.subtitle = b.subtitle.trim().slice(0, 160);
    if (typeof b.description === 'string') updates.description = b.description.trim().slice(0, 2000);
    if (typeof b.category === 'string') updates.category = b.category.trim().slice(0, 60);
    if (typeof b.active === 'boolean') updates.active = b.active;
    if (typeof b.featured === 'boolean') updates.featured = b.featured;
    if (typeof b.defaultSizeId === 'string') updates.defaultSizeId = b.defaultSizeId;
    if (Array.isArray(b.images)) {
      updates.images = b.images.filter((u) => typeof u === 'string' && u.trim()).slice(0, 10);
    }
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
    recordAudit(req, 'product.update', product.slug, {
      fields: Object.keys(updates),
    });
    res.json({ product: { ...product, id: String(product._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

// Create new product
router.post('/products', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || !String(b.name).trim()) {
      return res.status(400).json({ error: 'name_required' });
    }
    // Auto-generate slug from name; ensure uniqueness
    const base = String(b.name).toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'product';
    let slug = base;
    for (let n = 2; await Product.exists({ slug }); n++) slug = `${base}-${n}`;

    const sizes = Array.isArray(b.sizes)
      ? b.sizes.filter((s) => s && typeof s.id === 'string' && s.id.trim()).map((s) => ({
          id: s.id.trim().slice(0, 30),
          label: String(s.label ?? s.id).slice(0, 30),
          price: Math.max(0, Number(s.price) || 0),
          stock: Math.max(0, Math.floor(Number(s.stock) || 0)),
        }))
      : [];
    if (!sizes.length) return res.status(400).json({ error: 'at_least_one_size' });

    const product = await Product.create({
      slug,
      name: String(b.name).trim().slice(0, 120),
      subtitle: typeof b.subtitle === 'string' ? b.subtitle.trim().slice(0, 160) : '',
      description: typeof b.description === 'string' ? b.description.trim().slice(0, 2000) : '',
      category: typeof b.category === 'string' ? b.category.trim().slice(0, 60) : '',
      images: Array.isArray(b.images) ? b.images.filter((u) => typeof u === 'string').slice(0, 10) : [],
      sizes,
      defaultSizeId: sizes[0]?.id ?? null,
      packs: [],
      active: b.active !== false,
      featured: b.featured === true,
    });
    recordAudit(req, 'product.create', slug, { name: product.name });
    res.status(201).json({ product: { ...product.toObject(), id: String(product._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete('/products/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const gone = await Product.findByIdAndDelete(req.params.id).lean();
    if (!gone) return res.status(404).json({ error: 'Product not found' });
    recordAudit(req, 'product.delete', gone.slug);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Image upload via ImageKit (multipart/form-data, single file "image")
router.post('/upload', async (req, res, next) => {
  try {
    const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
    const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
      return res.status(503).json({ error: 'imagekit_not_configured' });
    }

    // Collect the raw multipart body manually (no disk writes — stream into memory)
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', (c) => chunks.push(c));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const rawBody = Buffer.concat(chunks);

    // Parse boundary from Content-Type header
    const ct = req.headers['content-type'] || '';
    const boundaryMatch = ct.match(/boundary=([^\s;]+)/);
    if (!boundaryMatch) return res.status(400).json({ error: 'missing_boundary' });
    const boundary = boundaryMatch[1];

    // Split parts by boundary
    const parts = rawBody.toString('binary').split(`--${boundary}`);
    let fileBuffer = null;
    let fileName = 'upload.jpg';
    let mimeType = 'image/jpeg';

    for (const part of parts) {
      if (!part.includes('Content-Disposition')) continue;
      const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
      if (!headerSection.includes('filename=')) continue;
      const nameMatch = headerSection.match(/filename="([^"]+)"/);
      const ctMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/);
      if (nameMatch) fileName = nameMatch[1];
      if (ctMatch) mimeType = ctMatch[1].trim();
      // body is everything after the double CRLF, minus the trailing \r\n
      const bodyStr = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');
      fileBuffer = Buffer.from(bodyStr, 'binary');
      break;
    }

    if (!fileBuffer) return res.status(400).json({ error: 'no_file' });
    if (fileBuffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'file_too_large' });

    // Validate MIME
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: 'invalid_file_type' });

    // Upload to ImageKit via their REST API
    const FormData = (await import('node:stream')).Transform; // just checking node version
    const https = require('https');
    const boundary2 = `----NodeBoundary${Date.now()}`;
    const base64File = fileBuffer.toString('base64');

    const ikBody = [
      `--${boundary2}`,
      `Content-Disposition: form-data; name="file"`,
      '',
      base64File,
      `--${boundary2}`,
      `Content-Disposition: form-data; name="fileName"`,
      '',
      fileName,
      `--${boundary2}`,
      `Content-Disposition: form-data; name="folder"`,
      '',
      '/nostrum/products',
      `--${boundary2}--`,
    ].join('\r\n');

    const auth = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

    const ikUrl = new URL('https://upload.imagekit.io/api/v1/files/upload');
    const ikResult = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: ikUrl.hostname,
        path: ikUrl.pathname,
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': `multipart/form-data; boundary=${boundary2}`,
          'Content-Length': Buffer.byteLength(ikBody),
        },
      }, (resp) => {
        let data = '';
        resp.on('data', (d) => (data += d));
        resp.on('end', () => {
          try { resolve({ status: resp.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: resp.statusCode, body: data }); }
        });
      });
      req2.on('error', reject);
      req2.write(ikBody);
      req2.end();
    });

    if (ikResult.status !== 200) {
      console.error('ImageKit upload failed:', ikResult.body);
      return res.status(502).json({ error: 'upload_failed' });
    }

    recordAudit(req, 'image.upload', ikResult.body.fileId, { name: fileName });
    res.json({ url: ikResult.body.url, fileId: ikResult.body.fileId });
  } catch (err) {
    next(err);
  }
});

/* ── Journal: posts (blog authoring) ──────────────────────────────── */

function slugify(title) {
  return String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents (ES/CA titles)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(title) {
  const base = slugify(title) || 'post';
  let slug = base;
  for (let n = 2; await Post.exists({ slug }); n++) slug = `${base}-${n}`;
  return slug;
}

function postFields(body) {
  const b = body || {};
  const updates = {};
  if (typeof b.title === 'string' && b.title.trim())
    updates.title = b.title.trim().slice(0, 160);
  if (typeof b.excerpt === 'string') updates.excerpt = b.excerpt.trim().slice(0, 300);
  if (typeof b.body === 'string') updates.body = b.body.slice(0, 20000);
  if (typeof b.coverImage === 'string')
    updates.coverImage = b.coverImage.slice(0, 300) || null;
  return updates;
}

router.get('/posts', async (req, res, next) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      posts: posts.map((p) => ({ ...p, id: String(p._id), _id: undefined })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/posts', async (req, res, next) => {
  try {
    const fields = postFields(req.body);
    if (!fields.title) return res.status(400).json({ error: 'title_required' });
    const publish = req.body?.status === 'published';
    const post = await Post.create({
      ...fields,
      slug: await uniqueSlug(fields.title),
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? new Date() : null,
    });
    recordAudit(req, 'post.create', post.slug, { status: post.status });
    res.status(201).json({ post: { ...post.toObject(), id: String(post._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const updates = { ...postFields(req.body), updatedAt: new Date() };
    if (req.body?.status === 'published' || req.body?.status === 'draft') {
      updates.status = req.body.status;
      if (req.body.status === 'published') {
        const existing = await Post.findById(req.params.id).lean();
        if (!existing) return res.status(404).json({ error: 'Post not found' });
        if (!existing.publishedAt) updates.publishedAt = new Date();
      }
    }
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    recordAudit(req, 'post.update', post.slug, { fields: Object.keys(updates) });
    res.json({ post: { ...post, id: String(post._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const gone = await Post.findByIdAndDelete(req.params.id).lean();
    if (!gone) return res.status(404).json({ error: 'Post not found' });
    recordAudit(req, 'post.delete', gone.slug);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── Journal: museum exhibits ─────────────────────────────────────── */

function exhibitFields(body) {
  const b = body || {};
  const updates = {};
  if (typeof b.title === 'string' && b.title.trim())
    updates.title = b.title.trim().slice(0, 120);
  if (typeof b.caption === 'string') updates.caption = b.caption.trim().slice(0, 500);
  if (typeof b.image === 'string' && b.image.trim())
    updates.image = b.image.trim().slice(0, 300);
  if (MUSEUM_ROOMS.includes(b.room)) updates.room = b.room;
  if (Number.isFinite(Number(b.order))) updates.order = Math.floor(Number(b.order));
  if (typeof b.published === 'boolean') updates.published = b.published;
  return updates;
}

router.get('/exhibits', async (req, res, next) => {
  try {
    const exhibits = await Exhibit.find({}).lean();
    exhibits.sort(
      (a, b) =>
        MUSEUM_ROOMS.indexOf(a.room) - MUSEUM_ROOMS.indexOf(b.room) ||
        a.order - b.order
    );
    res.json({
      exhibits: exhibits.map((e) => ({ ...e, id: String(e._id), _id: undefined })),
      rooms: MUSEUM_ROOMS,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/exhibits', async (req, res, next) => {
  try {
    const fields = exhibitFields(req.body);
    if (!fields.title || !fields.image)
      return res.status(400).json({ error: 'title_and_image_required' });
    const exhibit = await Exhibit.create(fields);
    recordAudit(req, 'exhibit.create', String(exhibit._id), { room: exhibit.room });
    res
      .status(201)
      .json({ exhibit: { ...exhibit.toObject(), id: String(exhibit._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

router.patch('/exhibits/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const exhibit = await Exhibit.findByIdAndUpdate(
      req.params.id,
      { $set: exhibitFields(req.body) },
      { new: true }
    ).lean();
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });
    recordAudit(req, 'exhibit.update', req.params.id);
    res.json({ exhibit: { ...exhibit, id: String(exhibit._id), _id: undefined } });
  } catch (err) {
    next(err);
  }
});

router.delete('/exhibits/:id', requireObjectId('id'), async (req, res, next) => {
  try {
    const gone = await Exhibit.findByIdAndDelete(req.params.id).lean();
    if (!gone) return res.status(404).json({ error: 'Exhibit not found' });
    recordAudit(req, 'exhibit.delete', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── Site content (editable sections, e.g. /origins process images) ── */

const CONTENT_KEYS = ['process-images'];

function processImageSteps(body) {
  const raw = body?.steps;
  if (!Array.isArray(raw)) return null;
  // Positions are significant (index N = process step N), so cleared
  // slots are kept as empty urls rather than dropped.
  return raw.slice(0, 10).map((s) => {
    // src lands in <img>/next-image — only site paths and https allowed
    // (blocks javascript:/data: URLs).
    const url = typeof s?.url === 'string' ? s.url.trim().slice(0, 300) : '';
    const alt = typeof s?.alt === 'string' ? s.alt.trim().slice(0, 160) : '';
    return { url: /^(\/|https:\/\/)/.test(url) ? url : '', alt };
  });
}

router.get('/content/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ error: 'unknown_content_key' });
    }
    const doc = await SiteContent.findOne({ key }).lean();
    res.json({ key, value: doc?.value ?? null });
  } catch (err) {
    next(err);
  }
});

router.put('/content/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ error: 'unknown_content_key' });
    }
    const steps = processImageSteps(req.body);
    if (!steps) return res.status(400).json({ error: 'steps_required' });
    const doc = await SiteContent.findOneAndUpdate(
      { key },
      { $set: { value: { steps } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    recordAudit(req, 'content.update', key, { steps: steps.length });
    res.json({ key, value: doc.value });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
