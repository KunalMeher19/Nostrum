// Ops + admin hardening · boot env validation, DB-backed admin gate,
// audit trail, order number generator, and the cross-site mutation
// guard. Runs against the throwaway test database.
const request = require('supertest');
const {
  adminSession,
  connectTestDb,
  dropAndCloseTestDb,
  seedSessionUsers,
} = require('../test/helpers');

const app = require('../src/app');
const { assertBootEnv } = require('../src/config/env.config');
const User = require('../src/models/user.model');
const { Order } = require('../src/models/order.model');
const { Counter } = require('../src/models/counter.model');
const { AuditEvent } = require('../src/models/audit-event.model');
const orders = require('../src/services/orders.service');

const ADMIN_UID = '64b000000000000000000009';

beforeAll(connectTestDb);
afterAll(dropAndCloseTestDb);
afterEach(async () => {
  await Order.deleteMany({});
  await Counter.deleteMany({});
  await AuditEvent.deleteMany({});
});

function orderDoc(overrides = {}) {
  return {
    number: 'NST-TEST-7001',
    email: 'buyer@test.local',
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
    statusHistory: [{ status: 'placed', at: new Date() }],
    ...overrides,
  };
}

describe('assertBootEnv', () => {
  const base = { MONGODB_URI: 'mongodb://x', AUTH_SECRET: 'a'.repeat(40) };

  it('passes a complete dev env and fails on missing basics', () => {
    expect(() => assertBootEnv({ env: base })).not.toThrow();
    expect(() => assertBootEnv({ env: { AUTH_SECRET: 'x' } })).toThrow(/MONGODB_URI/);
    expect(() => assertBootEnv({ env: { MONGODB_URI: 'mongodb://x' } })).toThrow(
      /AUTH_SECRET/
    );
  });

  it('production refuses localhost CORS, missing CORS, and short secrets', () => {
    const prod = { ...base, NODE_ENV: 'production' };
    expect(() => assertBootEnv({ env: prod })).toThrow(/CORS_ORIGIN/);
    expect(() =>
      assertBootEnv({ env: { ...prod, CORS_ORIGIN: 'http://localhost:3000' } })
    ).toThrow(/localhost/);
    expect(() =>
      assertBootEnv({ env: { ...prod, CORS_ORIGIN: 'https://nostrum.com', AUTH_SECRET: 'short' } })
    ).toThrow(/32 chars/);
    expect(() =>
      assertBootEnv({ env: { ...prod, CORS_ORIGIN: 'https://nostrum.com' } })
    ).not.toThrow();
  });
});

describe('requireAdmin · role re-checked in the DB', () => {
  it('locks out an admin session the moment the DB role is revoked', async () => {
    // Token still says admin, DB says customer → 403 immediately.
    await User.updateOne({ _id: ADMIN_UID }, { $set: { role: 'customer' } });
    const demoted = await request(app)
      .get('/api/admin/orders')
      .set('Cookie', adminSession());
    expect(demoted.status).toBe(403);

    await User.updateOne({ _id: ADMIN_UID }, { $set: { role: 'admin' } });
    const restored = await request(app)
      .get('/api/admin/orders')
      .set('Cookie', adminSession());
    expect(restored.status).toBe(200);
  });

  it('rejects an admin-claiming token with no user document behind it', async () => {
    const ghost = adminSession({ uid: '64b0000000000000000000ff' });
    const res = await request(app).get('/api/admin/orders').set('Cookie', ghost);
    expect(res.status).toBe(403);
  });
});

describe('audit trail', () => {
  beforeEach(seedSessionUsers);

  it('records order status changes with actor, target and meta', async () => {
    const order = await Order.create(orderDoc());
    const res = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set('Cookie', adminSession())
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    // recordAudit is fire-and-forget; give the write a beat to land.
    await new Promise((r) => setTimeout(r, 50));
    const event = await AuditEvent.findOne({ action: 'order.status' }).lean();
    expect(event).toBeTruthy();
    expect(event.actorId).toBe(ADMIN_UID);
    expect(event.target).toBe(String(order._id));
    expect(event.meta.status).toBe('confirmed');
  });

  it('records bulk PII exports and serves the trail read-only', async () => {
    const csv = await request(app)
      .get('/api/admin/customers.csv')
      .set('Cookie', adminSession());
    expect(csv.status).toBe(200);
    await new Promise((r) => setTimeout(r, 50));
    const list = await request(app)
      .get('/api/admin/audit-events')
      .set('Cookie', adminSession());
    expect(list.status).toBe(200);
    const actions = list.body.events.map((e) => e.action);
    expect(actions).toContain('export.customers');
  });
});

describe('order number generator', () => {
  it('mints sequential per-year numbers atomically', async () => {
    const year = new Date().getFullYear();
    const first = await orders.nextOrderNumber();
    const second = await orders.nextOrderNumber();
    expect(first).toBe(`NST-${year}-0001`);
    expect(second).toBe(`NST-${year}-0002`);
  });

  it('createOrder auto-assigns a number when the payload has none', async () => {
    const Product = require('../src/models/product.model');
    await Product.create({
      slug: 'oli',
      name: 'Oli',
      sizes: [{ id: '5l', label: '5L', price: 35, stock: 3 }],
      active: true,
    });
    const mailer = require('../src/services/mailer.service');
    const spy = jest.spyOn(mailer, 'sendOrderConfirmation').mockResolvedValue();
    const payload = orderDoc();
    delete payload.number;
    const order = await orders.createOrder(payload);
    expect(order.number).toMatch(/^NST-\d{4}-\d{4}$/);
    await Product.deleteMany({});
    spy.mockRestore();
  });
});

describe('cross-site mutation guard', () => {
  const body = {
    name: 'Marta',
    email: 'marta@example.com',
    topic: 'general',
    message: 'Hola, una consulta sobre el aceite.',
  };

  it('rejects mutations from an unlisted Origin', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('Origin', 'https://evil.example')
      .send(body);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('origin_not_allowed');
  });

  it('allows the configured origin and origin-less clients', async () => {
    const allowed = await request(app)
      .post('/api/contact')
      .set('Origin', 'http://localhost:3000')
      .send(body);
    expect(allowed.status).toBe(201);
    const originless = await request(app).post('/api/contact').send(body);
    expect(originless.status).toBe(201);
  });

  it('no longer parses HTML-form bodies (urlencoded dropped)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .type('form')
      .send('name=Marta&email=marta%40example.com&topic=general&message=hola');
    expect(res.status).toBe(400); // body never parsed → validation fails
  });
});
