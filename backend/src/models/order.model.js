// Order model · the swappable order data layer.
//
// The client has not yet decided between Shopify and Stripe for the
// storefront; until then orders live here in MongoDB, seeded with
// realistic mock data against the local catalog. The portal and admin
// only ever talk to /api/orders + /api/admin/orders, so swapping the
// source later means reimplementing those routes against the chosen
// provider (mapping their order object to this same response shape),
// with zero UI changes.
const { mongoose } = require('../db/db');

// Shipping lifecycle shown in both portals. Cancelled sits outside the
// forward flow. "Active" orders (customer portal) = placed → shipped.
const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },
    sizeId: { type: String, required: true },
    sizeLabel: { type: String, required: true },
    unitPrice: { type: Number, required: true }, // EUR at time of order
    qty: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // pack tier fraction applied
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

// Frozen copy of the shipping address at order time (the user's
// editable profile address may change later; the order must not).
const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    line1: String,
    line2: String,
    city: String,
    region: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-facing order number, e.g. "NST-2026-0412".
    number: { type: String, required: true, unique: true },
    // Null for guest-checkout orders (brief requires guest checkout).
    // Guests retrieve their order via number + email (orders/lookup).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    email: { type: String, required: true }, // snapshot for admin/export
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'placed',
      index: true,
    },
    // Full status history — drives the timeline in the customer portal.
    statusHistory: { type: [statusEventSchema], default: [] },
    shippingAddress: { type: addressSchema, default: null },
    carrier: { type: String, default: null }, // e.g. "SEUR", "Correos Express"
    trackingCode: { type: String, default: null },
    stripeSessionId: { type: String, default: null }, // Stripe Checkout Session ID
    placedAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'orders', versionKey: false }
);

module.exports = {
  Order: mongoose.models.Order || mongoose.model('Order', orderSchema),
  ORDER_STATUSES,
};
