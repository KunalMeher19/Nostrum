// Seed realistic mock orders against the local catalog, so the
// customer portal and admin have data before the real storefront
// (Shopify vs Stripe, client's call) lands.
//
// Usage:
//   npm run seed:orders                 → orders for every customer user
//   npm run seed:orders -- --email a@b  → orders for that user only
//   add --reset to wipe existing seeded orders for the target users first
//
// Idempotent-ish: skips users who already have orders unless --reset.
require('dotenv').config();
const { connectDb, mongoose } = require('../src/db/db');
const { Order } = require('../src/models/order.model');
const Product = require('../src/models/product.model');
const User = require('../src/models/user.model');

const CARRIERS = ['SEUR', 'Correos Express', 'DHL'];

// Deterministic-feeling pseudo-random from a seed, so re-seeds for the
// same user produce a similar spread.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tierFor(packs, qty) {
  let best = { qty: 1, discount: 0 };
  for (const t of packs) if (qty >= t.qty) best = t;
  return best;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Forward status flow with the dates walked back from "now".
const FLOW = ['placed', 'confirmed', 'preparing', 'shipped', 'delivered'];

function buildOrder(user, product, rand, index, seq) {
  const daysAgo = index === 0 ? 2 + Math.floor(rand() * 6) : 20 + Math.floor(rand() * 240);
  const placedAt = new Date(Date.now() - daysAgo * 86400000);

  // Recent order sits mid-flow (active); older ones are delivered.
  const stageIdx =
    index === 0
      ? 1 + Math.floor(rand() * 3) // confirmed | preparing | shipped
      : FLOW.length - 1; // delivered
  const status = FLOW[stageIdx];

  let elapsed = 0;
  const statusHistory = FLOW.slice(0, stageIdx + 1).map((s, i) => {
    if (i > 0) elapsed += (6 + rand() * 30) * 3600000;
    return { status: s, at: new Date(placedAt.getTime() + elapsed) };
  });

  const size = product.sizes[Math.floor(rand() * product.sizes.length)];
  const qty = 1 + Math.floor(rand() * 3);
  const tier = tierFor(product.packs, qty);
  const lineTotal = round2(size.price * qty * (1 - tier.discount));
  const shippingCost = lineTotal >= 60 ? 0 : 6.9;

  const year = placedAt.getFullYear();
  const number = `NST-${year}-${String(seq).padStart(4, '0')}`;

  return {
    number,
    userId: user._id,
    email: user.email,
    items: [
      {
        productSlug: product.slug,
        productName: `${product.name} · ${product.subtitle}`,
        sizeId: size.id,
        sizeLabel: size.label,
        unitPrice: size.price,
        qty,
        discount: tier.discount,
        lineTotal,
      },
    ],
    subtotal: lineTotal,
    shippingCost,
    total: round2(lineTotal + shippingCost),
    currency: 'EUR',
    status,
    statusHistory,
    shippingAddress: user.shipping && user.shipping.line1
      ? user.shipping
      : {
          fullName: user.name || 'Nostrum Customer',
          line1: 'Carrer de la Pau 12',
          line2: '',
          city: 'Tarragona',
          region: 'Catalunya',
          postalCode: '43001',
          country: 'Spain',
          phone: '+34 600 000 000',
        },
    carrier: status === 'placed' || status === 'confirmed'
      ? null
      : CARRIERS[Math.floor(rand() * CARRIERS.length)],
    trackingCode:
      stageIdx >= 3 ? `ES${String(Math.floor(rand() * 9e9)).padStart(10, '0')}` : null,
    placedAt,
    updatedAt: statusHistory[statusHistory.length - 1].at,
  };
}

async function main() {
  const emailArgIdx = process.argv.indexOf('--email');
  const targetEmail =
    emailArgIdx > -1 ? String(process.argv[emailArgIdx + 1] || '').toLowerCase() : null;
  const reset = process.argv.includes('--reset');

  await connectDb();

  const product = await Product.findOne({ slug: 'extra-virgin-olive-oil' }).lean();
  if (!product) throw new Error('Run seed:products first.');

  const query = targetEmail ? { email: targetEmail } : {};
  const users = await User.find(query).lean();
  if (!users.length) throw new Error('No matching users found.');

  // Global sequence for order numbers, continuing after the highest one
  // already issued (count-based restarts collide after --reset runs).
  const existingNumbers = await Order.find({}, { number: 1 }).lean();
  let seq =
    existingNumbers.reduce((max, o) => {
      const n = Number(String(o.number).split('-').pop());
      return Number.isFinite(n) && n > max ? n : max;
    }, 100) + 1;

  for (const user of users) {
    if (reset) await Order.deleteMany({ userId: user._id });
    const existing = await Order.countDocuments({ userId: user._id });
    if (existing > 0) {
      console.log(`"${user.email}" already has ${existing} orders, skipping.`);
      continue;
    }
    const rand = mulberry32(
      String(user._id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    );
    const count = 2 + Math.floor(rand() * 3); // 2–4 orders each
    const docs = [];
    for (let i = 0; i < count; i++) docs.push(buildOrder(user, product, rand, i, seq++));
    await Order.insertMany(docs);
    console.log(`Seeded ${count} orders for "${user.email}".`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
