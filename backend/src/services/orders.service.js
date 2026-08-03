// Orders service · the swap point for the future storefront.
//
// Everything the portals need goes through these functions and the
// response shapes below. When the client picks Shopify or Stripe,
// reimplement this module against that API (map their order object to
// serializeOrder's shape) and the routes + UI stay untouched.
const { Order, ORDER_STATUSES } = require('../models/order.model');

// Statuses the customer portal shows as "active" (still moving).
const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'shipped'];

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
  if (q) {
    filter.$or = [
      { number: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
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
  return order ? serializeOrder(order, { detail: true }) : null;
}

// Raw doc for the invoice PDF (needs everything).
async function getOrderDoc(orderId) {
  return Order.findById(orderId).lean();
}

module.exports = {
  ACTIVE_STATUSES,
  ORDER_STATUSES,
  serializeOrder,
  listOrdersForUser,
  getOrderForUser,
  listAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderDoc,
};
