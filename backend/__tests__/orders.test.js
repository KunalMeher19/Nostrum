// Orders service + routes · stock consumption, shipping-status side
// effects, tracking URLs, and the public guest lookup. Runs against the
// throwaway test database.
const request = require('supertest');
const { customerSession, connectTestDb, dropAndCloseTestDb } = require('../test/helpers');

const app = require('../src/app');
const { Order } = require('../src/models/order.model');
const Product = require('../src/models/product.model');
const orders = require('../src/services/orders.service');
const mailer = require('../src/services/mailer.service');

beforeAll(connectTestDb);
afterAll(dropAndCloseTestDb);
afterEach(async () => {
  jest.restoreAllMocks();
  await Order.deleteMany({});
  await Product.deleteMany({});
});

async function seedProduct(overrides = {}) {
  return Product.create({
    slug: 'nostrum-5l',
    name: 'Nostrum 5L',
    sizes: [
      { id: '5l', label: '5 L', price: 35, stock: 10 },
      { id: '500ml', label: '500 ml', price: 12, stock: 4 },
    ],
    defaultSizeId: '5l',
    active: true,
    ...overrides,
  });
}

function orderPayload(overrides = {}) {
  return {
    number: 'NST-2026-9001',
    email: 'guest@example.com',
    items: [
      {
        productSlug: 'nostrum-5l',
        productName: 'Nostrum 5L',
        sizeId: '5l',
        sizeLabel: '5 L',
        unitPrice: 35,
        qty: 2,
        discount: 0,
        lineTotal: 70,
      },
    ],
    subtotal: 70,
    shippingCost: 6,
    total: 76,
    placedAt: new Date(),
    statusHistory: [{ status: 'placed', at: new Date() }],
    ...overrides,
  };
}

async function stockOf(sizeId) {
  const p = await Product.findOne({ slug: 'nostrum-5l' }).lean();
  return p.sizes.find((s) => s.id === sizeId).stock;
}

describe('orders.service.createOrder · stock consumption', () => {
  it('creates a guest order (no userId) and decrements the size stock', async () => {
    await seedProduct();
    const confirm = jest
      .spyOn(mailer, 'sendOrderConfirmation')
      .mockResolvedValue(undefined);
    const order = await orders.createOrder(orderPayload());
    expect(order.number).toBe('NST-2026-9001');
    expect(await stockOf('5l')).toBe(8);
    expect(confirm).toHaveBeenCalledTimes(1);
    const doc = await Order.findOne({ number: 'NST-2026-9001' }).lean();
    expect(doc.userId).toBeNull();
  });

  it('rejects with OUT_OF_STOCK and leaves stock untouched when qty exceeds stock', async () => {
    await seedProduct();
    const payload = orderPayload({
      items: [{ ...orderPayload().items[0], qty: 11, lineTotal: 385 }],
    });
    await expect(orders.createOrder(payload)).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
      item: { productSlug: 'nostrum-5l', sizeId: '5l', qty: 11 },
    });
    expect(await stockOf('5l')).toBe(10);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('rolls back already-taken lines when a later line is out of stock', async () => {
    await seedProduct();
    const base = orderPayload().items[0];
    const payload = orderPayload({
      items: [
        base, // 2 × 5l — available
        { ...base, sizeId: '500ml', sizeLabel: '500 ml', qty: 5, lineTotal: 60 }, // only 4 left
      ],
    });
    await expect(orders.createOrder(payload)).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
    });
    expect(await stockOf('5l')).toBe(10);
    expect(await stockOf('500ml')).toBe(4);
  });

  it('treats inactive or unknown products as out of stock', async () => {
    await seedProduct({ active: false });
    await expect(orders.createOrder(orderPayload())).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
    });
  });
});

describe('orders.service.updateOrderStatus · transition side effects', () => {
  it('fires the shipping mail once on entering shipped, with the tracking link', async () => {
    await seedProduct();
    jest.spyOn(mailer, 'sendOrderConfirmation').mockResolvedValue(undefined);
    const shipMail = jest
      .spyOn(mailer, 'sendShippingUpdate')
      .mockResolvedValue(undefined);
    const created = await orders.createOrder(orderPayload());

    const shipped = await orders.updateOrderStatus(created.id, 'shipped', {
      carrier: 'SEUR',
      trackingCode: 'SE123456',
    });
    expect(shipped.status).toBe('shipped');
    expect(shipped.trackingUrl).toContain('seur.com');
    expect(shipped.trackingUrl).toContain('SE123456');
    expect(shipMail).toHaveBeenCalledTimes(1);
    expect(shipMail.mock.calls[0][0].trackingUrl).toContain('seur.com');

    // Re-saving the same status (admin edits the tracking code) must not
    // send the customer a second mail.
    await orders.updateOrderStatus(created.id, 'shipped', {
      trackingCode: 'SE999999',
    });
    expect(shipMail).toHaveBeenCalledTimes(1);
  });

  it('returns units to stock on cancellation, once, even if cancelled twice', async () => {
    await seedProduct();
    jest.spyOn(mailer, 'sendOrderConfirmation').mockResolvedValue(undefined);
    const created = await orders.createOrder(orderPayload());
    expect(await stockOf('5l')).toBe(8);

    await orders.updateOrderStatus(created.id, 'cancelled');
    expect(await stockOf('5l')).toBe(10);

    await orders.updateOrderStatus(created.id, 'cancelled');
    expect(await stockOf('5l')).toBe(10);
  });

  it('leaves no tracking link for an unknown carrier', async () => {
    expect(orders.trackingUrlFor('Paco Transportes', 'X1')).toBeNull();
    expect(orders.trackingUrlFor('Correos Express', 'CX42')).toContain(
      'correosexpress.com'
    );
    expect(orders.trackingUrlFor(null, 'X1')).toBeNull();
    expect(orders.trackingUrlFor('SEUR', null)).toBeNull();
  });
});

describe('POST /api/orders/lookup · guest order tracking', () => {
  async function seedGuestOrder() {
    return Order.create(orderPayload());
  }

  it('returns the order detail for the exact number + email pair', async () => {
    await seedGuestOrder();
    const res = await request(app)
      .post('/api/orders/lookup')
      .send({ number: 'nst-2026-9001', email: 'Guest@Example.com' });
    expect(res.status).toBe(200);
    expect(res.body.order.number).toBe('NST-2026-9001');
    expect(res.body.order.status).toBe('placed');
    expect(res.body.order.statusHistory).toHaveLength(1);
  });

  it('404s on a wrong email and validates input', async () => {
    await seedGuestOrder();
    const wrong = await request(app)
      .post('/api/orders/lookup')
      .send({ number: 'NST-2026-9001', email: 'someone-else@example.com' });
    expect(wrong.status).toBe(404);

    const noNumber = await request(app)
      .post('/api/orders/lookup')
      .send({ email: 'guest@example.com' });
    expect(noNumber.status).toBe(400);
    expect(noNumber.body.error).toBe('number_required');

    const badEmail = await request(app)
      .post('/api/orders/lookup')
      .send({ number: 'NST-2026-9001', email: 'nope' });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error).toBe('invalid_email');
  });

  it('keeps the authenticated order list working for account orders', async () => {
    const uid = '64b000000000000000000001';
    await Order.create(orderPayload({ number: 'NST-2026-9002', userId: uid }));
    const res = await request(app)
      .get('/api/orders')
      .set('Cookie', customerSession());
    expect(res.status).toBe(200);
    expect(res.body.orders.map((o) => o.number)).toEqual(['NST-2026-9002']);
  });
});
