// Contact API · public intake stores the message, validates input, and
// rate-limits per IP. Runs against the throwaway test database.
const request = require('supertest');
const {
  adminSession,
  customerSession,
  connectTestDb,
  dropAndCloseTestDb,
} = require('../test/helpers');

const app = require('../src/app');
const { ContactMessage } = require('../src/models/contact-message.model');

const valid = {
  name: 'Marta Puig',
  email: 'Marta@Example.com',
  topic: 'professional',
  message: 'We run a restaurant group in Girona and would like a tasting.',
  locale: 'ca',
};

beforeAll(connectTestDb);
afterAll(dropAndCloseTestDb);
afterEach(() => ContactMessage.deleteMany({}));

describe('POST /api/contact', () => {
  it('accepts a valid submission and persists it (email lowercased)', async () => {
    const res = await request(app).post('/api/contact').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    const doc = await ContactMessage.findOne({}).lean();
    expect(doc.name).toBe('Marta Puig');
    expect(doc.email).toBe('marta@example.com');
    expect(doc.topic).toBe('professional');
    expect(doc.locale).toBe('ca');
  });

  it('rejects a missing name / bad email / empty message', async () => {
    const cases = [
      [{ ...valid, name: '  ' }, 'name_required'],
      [{ ...valid, email: 'not-an-email' }, 'invalid_email'],
      [{ ...valid, message: '' }, 'message_required'],
    ];
    for (const [body, error] of cases) {
      const res = await request(app).post('/api/contact').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(error);
    }
    expect(await ContactMessage.countDocuments()).toBe(0);
  });

  it('coerces an unknown topic to general', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...valid, topic: '$where' });
    expect(res.status).toBe(201);
    const doc = await ContactMessage.findOne({}).lean();
    expect(doc.topic).toBe('general');
  });

  it('trips the publicWrite limiter on a burst', async () => {
    jest.resetModules();
    process.env.RATE_PUBLIC_WRITE_MAX = '2';
    process.env.RATE_PUBLIC_WRITE_WINDOW_MS = '60000';
    // eslint-disable-next-line global-require
    const tunedApp = require('../src/app');
    // Invalid bodies (no DB touch): the limiter sits before validation,
    // so 400s burn the budget and the third request is a 429.
    for (let i = 0; i < 2; i++) {
      const res = await request(tunedApp).post('/api/contact').send({});
      expect(res.status).toBe(400);
    }
    const blocked = await request(tunedApp).post('/api/contact').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('too_many_requests');
    process.env.RATE_PUBLIC_WRITE_MAX = '1000';
    delete process.env.RATE_PUBLIC_WRITE_WINDOW_MS;
    jest.resetModules();
  });
});

describe('GET /api/admin/contact-messages', () => {
  it('is closed to anonymous and customers, open to admin, newest first', async () => {
    await ContactMessage.create([
      { ...valid, email: 'a@test.local', createdAt: new Date('2026-01-01') },
      { ...valid, email: 'b@test.local', createdAt: new Date('2026-02-01') },
    ]);
    expect((await request(app).get('/api/admin/contact-messages')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/api/admin/contact-messages')
          .set('Cookie', customerSession())
      ).status
    ).toBe(403);
    const res = await request(app)
      .get('/api/admin/contact-messages')
      .set('Cookie', adminSession());
    expect(res.status).toBe(200);
    expect(res.body.messages.map((m) => m.email)).toEqual([
      'b@test.local',
      'a@test.local',
    ]);
  });
});
