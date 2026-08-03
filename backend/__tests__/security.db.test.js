// Integration · runs against a throwaway local MongoDB database
// (nostrum-test). Proves the guards end to end: operator injection is
// stripped before it reaches Mongo, hostile search input can't break
// the admin query, and customers can't read each other's orders.
const request = require('supertest');
const {
  sessionCookie,
  connectTestDb,
  dropAndCloseTestDb,
} = require('../test/helpers');

const app = require('../src/app');
const User = require('../src/models/user.model');
const { Order } = require('../src/models/order.model');

let marta;
let ada;
let admin;
let martaOrder;

beforeAll(async () => {
  await connectTestDb();
  [marta, ada, admin] = await User.create([
    { name: 'Marta', email: 'marta@test.local', role: 'customer' },
    { name: 'Ada', email: 'ada@test.local', role: 'customer' },
    { name: 'Root', email: 'root@test.local', role: 'admin' },
  ]);
  martaOrder = await Order.create({
    number: 'NST-TEST-0001',
    userId: marta._id,
    email: marta.email,
    status: 'delivered',
    currency: 'EUR',
    items: [
      {
        productSlug: 'oli',
        productName: 'Oli',
        sizeId: '5l',
        sizeLabel: '5L',
        unitPrice: 35,
        qty: 1,
        discount: 0,
        lineTotal: 35,
      },
    ],
    subtotal: 35,
    shippingCost: 0,
    total: 35,
    placedAt: new Date(),
    statusHistory: [{ status: 'delivered', at: new Date() }],
  });
});

afterAll(dropAndCloseTestDb);

const asUser = (u) =>
  sessionCookie({ uid: String(u._id), email: u.email, role: u.role });

describe('NoSQL operator injection', () => {
  it('strips $ keys from the profile update body', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Cookie', asUser(marta))
      .send({
        name: 'Marta Updated',
        $set: { role: 'admin' },
        shipping: { city: 'Girona', $where: 'true', 'a.b': 1 },
      });
    expect(res.status).toBe(200);
    const fresh = await User.findById(marta._id).lean();
    expect(fresh.name).toBe('Marta Updated');
    expect(fresh.role).toBe('customer'); // privilege escalation blocked
    expect(fresh.shipping.city).toBe('Girona');
  });

  it('nested query operators never reach Mongo (simple parser)', async () => {
    const res = await request(app)
      .get('/api/admin/orders?status[$ne]=delivered&q[$regex]=.*')
      .set('Cookie', asUser(admin));
    expect(res.status).toBe(200);
    // The [$ne] filter must NOT have excluded the delivered order.
    expect(res.body.orders.map((o) => o.number)).toContain('NST-TEST-0001');
  });
});

describe('regex injection in admin search', () => {
  it('survives hostile regex input like "(" without a 500', async () => {
    const res = await request(app)
      .get('/api/admin/orders?q=(')
      .set('Cookie', asUser(admin));
    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it('treats metacharacters literally, still finds real matches', async () => {
    const res = await request(app)
      .get('/api/admin/orders?q=NST-TEST-0001')
      .set('Cookie', asUser(admin));
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });
});

describe('object-level authorization', () => {
  it("another customer cannot read Marta's order", async () => {
    const res = await request(app)
      .get(`/api/orders/${martaOrder._id}`)
      .set('Cookie', asUser(ada));
    expect(res.status).toBe(404); // not even a 403 hint that it exists
  });

  it("another customer cannot download Marta's invoice", async () => {
    const res = await request(app)
      .get(`/api/orders/${martaOrder._id}/invoice`)
      .set('Cookie', asUser(ada));
    expect(res.status).toBe(404);
  });

  it('the owner still gets her order (guards do not overblock)', async () => {
    const res = await request(app)
      .get(`/api/orders/${martaOrder._id}`)
      .set('Cookie', asUser(marta));
    expect(res.status).toBe(200);
    expect(res.body.order.number).toBe('NST-TEST-0001');
  });
});
