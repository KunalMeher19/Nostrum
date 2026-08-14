// Seed realistic DEMO customers so the client can review the admin
// (Customers tab, order management, delivery statuses) and the customer
// portal with believable data before real customers exist.
//
// Demo customers use @nostrum-demo.local addresses so they are obvious
// in every list/export and trivial to remove:
//
//   npm run seed:customers            → create demo customers (idempotent)
//   npm run seed:customers -- --reset → delete demo customers + their orders
//
// After seeding, run `npm run seed:orders` to give every user (demo and
// real) 2–4 orders across the status flow.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDb, mongoose } = require('../src/db/db');
const User = require('../src/models/user.model');
const { Order } = require('../src/models/order.model');

const DEMO_DOMAIN = 'nostrum-demo.local';
// Shared demo password (printed at seed time). Not a secret: these
// accounts exist only so the client can click through the portals.
const DEMO_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD || 'DemoNostrum2026!';

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const DEMO_CUSTOMERS = [
  {
    name: 'Maria Puig',
    email: `maria.puig@${DEMO_DOMAIN}`,
    locale: 'ca',
    gdprConsentAt: daysAgo(210),
    marketingConsentAt: daysAgo(210),
    createdAt: daysAgo(210),
    shipping: {
      fullName: 'Maria Puig',
      line1: 'Carrer Major 8',
      line2: '',
      city: 'Tortosa',
      region: 'Catalunya',
      postalCode: '43500',
      country: 'Spain',
      phone: '+34 611 234 001',
    },
  },
  {
    name: 'Jordi Ferrer',
    email: `jordi.ferrer@${DEMO_DOMAIN}`,
    locale: 'es',
    gdprConsentAt: daysAgo(160),
    marketingConsentAt: null, // opted out
    createdAt: daysAgo(160),
    shipping: {
      fullName: 'Jordi Ferrer',
      line1: 'Av. Diagonal 412, 3º 2ª',
      line2: '',
      city: 'Barcelona',
      region: 'Catalunya',
      postalCode: '08006',
      country: 'Spain',
      phone: '+34 622 345 002',
    },
  },
  {
    name: 'Lucia Ricci',
    email: `lucia.ricci@${DEMO_DOMAIN}`,
    locale: 'it',
    gdprConsentAt: daysAgo(120),
    marketingConsentAt: daysAgo(95), // opted in later
    createdAt: daysAgo(120),
    shipping: {
      fullName: 'Lucia Ricci',
      line1: 'Via Garibaldi 27',
      line2: '',
      city: 'Genova',
      region: 'Liguria',
      postalCode: '16124',
      country: 'Italy',
      phone: '+39 333 456 003',
    },
  },
  {
    name: 'Tom Whitfield',
    email: `tom.whitfield@${DEMO_DOMAIN}`,
    locale: 'en',
    gdprConsentAt: daysAgo(75),
    marketingConsentAt: daysAgo(75),
    createdAt: daysAgo(75),
    shipping: {
      fullName: 'Tom Whitfield',
      line1: '14 Elm Grove',
      line2: '',
      city: 'Bristol',
      region: '',
      postalCode: 'BS6 5QP',
      country: 'United Kingdom',
      phone: '+44 7700 900 004',
    },
  },
  {
    name: 'Anna Vidal',
    email: `anna.vidal@${DEMO_DOMAIN}`,
    locale: 'ca',
    gdprConsentAt: daysAgo(40),
    marketingConsentAt: null, // opted out
    createdAt: daysAgo(40),
    shipping: {
      fullName: 'Anna Vidal',
      line1: 'Rambla Nova 45',
      line2: '',
      city: 'Tarragona',
      region: 'Catalunya',
      postalCode: '43003',
      country: 'Spain',
      phone: '+34 633 567 005',
    },
  },
  {
    name: 'Klaus Weber',
    email: `klaus.weber@${DEMO_DOMAIN}`,
    locale: 'en',
    gdprConsentAt: daysAgo(12),
    marketingConsentAt: daysAgo(12),
    createdAt: daysAgo(12),
    shipping: {
      fullName: 'Klaus Weber',
      line1: 'Lindenstraße 3',
      line2: '',
      city: 'Freiburg',
      region: 'Baden-Württemberg',
      postalCode: '79098',
      country: 'Germany',
      phone: '+49 151 2345 006',
    },
  },
];

async function main() {
  const reset = process.argv.includes('--reset');
  await connectDb();

  if (reset) {
    const users = await User.find({ email: { $regex: `@${DEMO_DOMAIN}$` } }).lean();
    const ids = users.map((u) => u._id);
    if (ids.length) {
      const orders = await Order.deleteMany({ userId: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
      console.log(`Removed ${users.length} demo customers and ${orders.deletedCount} of their orders.`);
    } else {
      console.log('No demo customers found.');
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let created = 0;
  for (const c of DEMO_CUSTOMERS) {
    const existing = await User.findOne({ email: c.email });
    if (existing) {
      console.log(`"${c.email}" already exists, skipping.`);
      continue;
    }
    await User.create({ ...c, role: 'customer', emailVerified: c.createdAt, passwordHash });
    created += 1;
    console.log(`Created "${c.name}" <${c.email}>.`);
  }

  if (created) {
    console.log(`\nDemo password for all of them: ${DEMO_PASSWORD}`);
    console.log('Run "npm run seed:orders" next to give them order history.');
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
