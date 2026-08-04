// Newsletter API · GDPR consent gate, resubscribe upsert, tokenized
// unsubscribe (idempotent, non-enumerating), admin CSV export.
const request = require('supertest');
const crypto = require('crypto');
const {
  adminSession,
  customerSession,
  connectTestDb,
  dropAndCloseTestDb,
} = require('../test/helpers');

const app = require('../src/app');
const Subscriber = require('../src/models/subscriber.model');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

beforeAll(connectTestDb);
afterAll(dropAndCloseTestDb);
afterEach(() => Subscriber.deleteMany({}));

describe('POST /api/newsletter/subscribe', () => {
  it('stores email + consent timestamp + token hash', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'Grove@Example.com', consent: true, locale: 'es' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    const doc = await Subscriber.findOne({}).lean();
    expect(doc.email).toBe('grove@example.com');
    expect(doc.locale).toBe('es');
    expect(doc.consentAt).toBeInstanceOf(Date);
    expect(doc.unsubscribedAt).toBeNull();
    expect(doc.unsubscribeTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('refuses without explicit consent (GDPR)', async () => {
    for (const consent of [undefined, false, 'yes', 1]) {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'x@test.local', consent });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('consent_required');
    }
    expect(await Subscriber.countDocuments()).toBe(0);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'nope', consent: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_email');
  });

  it('repeat signup upserts (no duplicate, consent refreshed)', async () => {
    const send = () =>
      request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'again@test.local', consent: true, locale: 'en' });
    await send();
    const first = await Subscriber.findOne({}).lean();
    await new Promise((r) => setTimeout(r, 10));
    await send();
    expect(await Subscriber.countDocuments()).toBe(1);
    const second = await Subscriber.findOne({}).lean();
    expect(second.consentAt.getTime()).toBeGreaterThan(first.consentAt.getTime());
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  async function seedWithToken() {
    const raw = crypto.randomBytes(32).toString('hex');
    await Subscriber.create({
      email: 'leaving@test.local',
      consentAt: new Date(),
      unsubscribeTokenHash: sha256(raw),
    });
    return raw;
  }

  it('flags the subscriber for a valid token', async () => {
    const raw = await seedWithToken();
    const res = await request(app)
      .post('/api/newsletter/unsubscribe')
      .send({ token: raw });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const doc = await Subscriber.findOne({}).lean();
    expect(doc.unsubscribedAt).toBeInstanceOf(Date);
  });

  it('answers ok for unknown/missing tokens without touching anything', async () => {
    await seedWithToken();
    for (const token of ['deadbeef', '', undefined]) {
      const res = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({ token });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    }
    const doc = await Subscriber.findOne({}).lean();
    expect(doc.unsubscribedAt).toBeNull();
  });

  it('resubscribe after unsubscribe clears the flag', async () => {
    const raw = await seedWithToken();
    await request(app).post('/api/newsletter/unsubscribe').send({ token: raw });
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'leaving@test.local', consent: true });
    const doc = await Subscriber.findOne({}).lean();
    expect(doc.unsubscribedAt).toBeNull();
  });
});

describe('admin subscriber export', () => {
  beforeEach(() =>
    Subscriber.create([
      {
        email: 'niña@test.local', // accent exercises the BOM/UTF-8 path
        locale: 'es',
        consentAt: new Date('2026-03-01'),
      },
      {
        email: 'gone@test.local',
        locale: 'en',
        consentAt: new Date('2026-01-01'),
        unsubscribedAt: new Date('2026-02-01'),
      },
    ])
  );

  it('JSON list is admin-only', async () => {
    expect((await request(app).get('/api/admin/newsletter/subscribers')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/api/admin/newsletter/subscribers')
          .set('Cookie', customerSession())
      ).status
    ).toBe(403);
    const res = await request(app)
      .get('/api/admin/newsletter/subscribers')
      .set('Cookie', adminSession());
    expect(res.status).toBe(200);
    expect(res.body.subscribers).toHaveLength(2);
  });

  it('CSV is BOM-prefixed and carries the unsubscribe date', async () => {
    const res = await request(app)
      .get('/api/admin/newsletter/subscribers.csv')
      .set('Cookie', adminSession());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.charCodeAt(0)).toBe(0xfeff); // BOM for Excel
    expect(res.text).toContain('email,locale,consent_date,unsubscribed_date,signup_date');
    expect(res.text).toContain('niña@test.local');
    expect(res.text).toContain('gone@test.local,en,2026-01-01,2026-02-01');
  });
});

describe('order confirmation seam', () => {
  it('createOrder sends the confirmation mail stub', async () => {
    const mailer = require('../src/services/mailer.service');
    const spy = jest.spyOn(mailer, 'sendOrderConfirmation').mockResolvedValue();
    const orders = require('../src/services/orders.service');
    const order = await orders.createOrder({
      number: 'NST-2026-9999',
      userId: '64b000000000000000000001',
      email: 'buyer@test.local',
      items: [
        {
          productSlug: 'nostrum-5l',
          productName: 'Nostrum 5L',
          sizeId: '5l',
          sizeLabel: '5 L',
          unitPrice: 40,
          qty: 2,
          lineTotal: 80,
        },
      ],
      subtotal: 80,
      shippingCost: 0,
      total: 80,
      currency: 'EUR',
      status: 'placed',
      statusHistory: [{ status: 'placed', at: new Date() }],
      placedAt: new Date(),
    });
    expect(order.number).toBe('NST-2026-9999');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].email).toBe('buyer@test.local');
    spy.mockRestore();
  });
});
