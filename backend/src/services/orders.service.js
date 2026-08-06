// Orders service · the swap point for the future storefront.
//
// Everything the portals need goes through these functions and the
// response shapes below. When the client picks Shopify or Stripe,
// reimplement this module against that API (map their order object to
// serializeOrder's shape) and the routes + UI stay untouched.
const { Order, ORDER_STATUSES } = require('../models/order.model');
const { Counter } = require('../models/counter.model');
const Product = require('../models/product.model');
const { escapeRegex } = require('../middlewares/sanitize.middleware');
const mailer = require('./mailer.service');

// Statuses the customer portal shows as "active" (still moving).
const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'shipped'];

// Tracking-page templates for the carriers the client is likely to use
// (Spanish market). Unknown carriers simply get no link, only the code.
const TRACKING_URL_TEMPLATES = {
  seur: (code) => `https://www.seur.com/livetracking/?segOnlineIdentificador=${code}`,
  'correos express': (code) =>
    `https://s.correosexpress.com/search?s=${code}`,
  correos: (code) =>
    `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${code}`,
  mrw: (code) => `https://www.mrw.es/seguimiento_envios/MRW_resultados_consultas.asp?enviament=${code}`,
  gls: (code) => `https://gls-group.eu/ES/es/seguimiento-envio?match=${code}`,
  dhl: (code) => `https://www.dhl.com/es-es/home/tracking.html?tracking-id=${code}`,
  ups: (code) => `https://www.ups.com/track?tracknum=${code}`,
};

function trackingUrlFor(carrier, trackingCode) {
  if (!carrier || !trackingCode) return null;
  const template = TRACKING_URL_TEMPLATES[carrier.trim().toLowerCase()];
  return template ? template(encodeURIComponent(trackingCode)) : null;
}

// Thrown by createOrder when an item can't be covered by current stock;
// the future checkout route maps it to a 409 for the storefront.
class OutOfStockError extends Error {
  constructor(item) {
    super(`Out of stock: ${item.productSlug} ${item.sizeId} ×${item.qty}`);
    this.code = 'OUT_OF_STOCK';
    this.item = { productSlug: item.productSlug, sizeId: item.sizeId, qty: item.qty };
  }
}

function serializeOrder(order, { detail = false } = {}) {
  const base = {
    id: String(order._id),
    number: order.number,
    status: order.status,
    total: order.total,
    currency: order.currency,
    placedAt: order.placedAt,
    itemsCount: order.items.reduce((a, i) => a + i.qty, 0),
    itemsSummary: order.items
      .map((i) => `${i.sizeLabel} ×${i.qty}`)
      .join(' · '),
  };
  if (!detail) return base;
  return {
    ...base,
    email: order.email,
    items: order.items,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    statusHistory: order.statusHistory,
    shippingAddress: order.shippingAddress,
    carrier: order.carrier,
    trackingCode: order.trackingCode,
    trackingUrl: trackingUrlFor(order.carrier, order.trackingCode),
    updatedAt: order.updatedAt,
  };
}

async function listOrdersForUser(userId) {
  const orders = await Order.find({ userId }).sort({ placedAt: -1 }).lean();
  return orders.map((o) => ({
    ...serializeOrder(o),
    active: ACTIVE_STATUSES.includes(o.status),
  }));
}

async function getOrderForUser(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  return order ? serializeOrder(order, { detail: true }) : null;
}

// Admin: unrestricted read + status transitions.
async function listAllOrders({ status, q } = {}) {
  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.status = status;
  if (q && typeof q === 'string') {
    // User-typed search box → escape before building a regex, otherwise
    // "(" 500s and crafted patterns can ReDoS the process.
    const safe = escapeRegex(q.slice(0, 120));
    filter.$or = [
      { number: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  const orders = await Order.find(filter).sort({ placedAt: -1 }).limit(200).lean();
  return orders.map((o) => ({ ...serializeOrder(o), email: o.email }));
}

async function getOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  return order ? serializeOrder(order, { detail: true }) : null;
}

async function updateOrderStatus(orderId, status, { carrier, trackingCode } = {}) {
  if (!ORDER_STATUSES.includes(status)) return null;
  const previous = await Order.findById(orderId).lean();
  if (!previous) return null;
  const updates = {
    status,
    updatedAt: new Date(),
    $push: { statusHistory: { status, at: new Date() } },
  };
  if (typeof carrier === 'string') updates.carrier = carrier.slice(0, 60) || null;
  if (typeof trackingCode === 'string')
    updates.trackingCode = trackingCode.slice(0, 60) || null;
  const order = await Order.findByIdAndUpdate(orderId, updates, {
    new: true,
  }).lean();
  if (!order) return null;
  const detail = serializeOrder(order, { detail: true });
  // Transition side effects fire once, on entering the status.
  if (status === 'shipped' && previous.status !== 'shipped') {
    mailer.sendShippingUpdate(detail).catch((err) =>
      console.error('[orders] shipping mail failed:', err.message)
    );
  }
  if (status === 'cancelled' && previous.status !== 'cancelled') {
    await restockItems(order.items);
  }
  return detail;
}

// Return an order's units to the per-size stock counters (cancellation).
// Products missing from the DB (or sizes since removed) are skipped —
// there is nothing to restock into.
async function restockItems(items) {
  for (const item of items || []) {
    await Product.updateOne(
      { slug: item.productSlug, 'sizes.id': item.sizeId },
      { $inc: { 'sizes.$.stock': item.qty } }
    );
  }
}

// Atomically consume stock for every line item, or throw OutOfStockError
// and leave stock exactly as it was. The filter only matches when the
// size still has enough units, so concurrent orders can't oversell.
async function consumeStock(items) {
  const taken = [];
  for (const item of items || []) {
    const hit = await Product.findOneAndUpdate(
      {
        slug: item.productSlug,
        active: true,
        sizes: { $elemMatch: { id: item.sizeId, stock: { $gte: item.qty } } },
      },
      { $inc: { 'sizes.$[size].stock': -item.qty } },
      { arrayFilters: [{ 'size.id': item.sizeId }] }
    );
    if (!hit) {
      await restockItems(taken); // roll back what this order already took
      throw new OutOfStockError(item);
    }
    taken.push(item);
  }
}

// Raw doc for the invoice PDF (needs everything).
async function getOrderDoc(orderId) {
  return Order.findById(orderId).lean();
}

// The creation seam. Checkout does not exist yet (Shopify vs Stripe is
// still the client's call), but when it lands it MUST create orders
// through here so the confirmation email fires with it. If the client
// picks Shopify, reimplement this against their API and keep the
// sendOrderConfirmation call (or move to Shopify's notifications).
// Collision-safe order numbers: "NST-2026-0001", per-year sequence via
// an atomic counter. Gaps (e.g. a failed create after numbering) are
// fine; duplicates are impossible.
async function nextOrderNumber(now = new Date()) {
  const year = now.getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `orders-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  ).lean();
  return `NST-${year}-${String(counter.seq).padStart(4, '0')}`;
}

async function createOrder(payload) {
  // Stock is consumed up front and returned if persisting fails, so the
  // counters in the admin shop editor always match reality. Throws
  // OutOfStockError before anything is written when an item can't be
  // covered — checkout should surface that as "no longer available".
  await consumeStock(payload.items);
  let order;
  try {
    if (!payload.number) payload.number = await nextOrderNumber();
    order = await Order.create(payload);
  } catch (err) {
    await restockItems(payload.items);
    throw err;
  }
  mailer.sendOrderConfirmation(order).catch((err) =>
    console.error('[orders] confirmation mail failed:', err.message)
  );
  return serializeOrder(order.toObject(), { detail: true });
}

// Guest order tracking: exact order number + the email the order was
// placed with. Works for logged-in customers' orders too (same proof of
// ownership), which keeps the lookup page account-agnostic.
async function getOrderByNumberAndEmail(number, email) {
  if (typeof number !== 'string' || typeof email !== 'string') return null;
  const order = await Order.findOne({
    number: number.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
  }).lean();
  return order ? serializeOrder(order, { detail: true }) : null;
}

module.exports = {
  ACTIVE_STATUSES,
  ORDER_STATUSES,
  OutOfStockError,
  serializeOrder,
  trackingUrlFor,
  listOrdersForUser,
  getOrderForUser,
  getOrderByNumberAndEmail,
  listAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderDoc,
  createOrder,
  nextOrderNumber,
};
