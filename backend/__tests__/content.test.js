// Site content API · admin-gated upserts with a public read path.
// Runs against the throwaway test database.
const request = require('supertest');
const {
  sessionCookie,
  connectTestDb,
  dropAndCloseTestDb,
} = require('../test/helpers');

const app = require('../src/app');
const SiteContent = require('../src/models/site-content.model');
const { AuditEvent } = require('../src/models/audit-event.model');

const admin = sessionCookie({
  uid: '64b000000000000000000009',
  email: 'root@test.local',
  role: 'admin',
});
const customer = sessionCookie({
  uid: '64b000000000000000000001',
  email: 'c@test.local',
  role: 'customer',
});

beforeAll(async () => {
  await connectTestDb();
});

afterAll(dropAndCloseTestDb);

describe('public reads', () => {
  it('returns a null value before anything is saved', async () => {
    const res = await request(app).get('/api/content/process-images');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: 'process-images', value: null });
  });

  it('404s unknown keys', async () => {
    const res = await request(app).get('/api/content/anything-else');
    expect(res.status).toBe(404);
  });
});

describe('admin writes', () => {
  it('are closed to anonymous and customer sessions', async () => {
    expect(
      (await request(app).put('/api/admin/content/process-images')).status
    ).toBe(401);
    expect(
      (
        await request(app)
          .put('/api/admin/content/process-images')
          .set('Cookie', customer)
      ).status
    ).toBe(403);
  });

  it('reject unknown keys and missing steps', async () => {
    expect(
      (
        await request(app)
          .put('/api/admin/content/nope')
          .set('Cookie', admin)
          .send({ steps: [] })
      ).status
    ).toBe(400);
    expect(
      (
        await request(app)
          .put('/api/admin/content/process-images')
          .set('Cookie', admin)
          .send({})
      ).status
    ).toBe(400);
  });

  it('upserts steps, keeps positions, and sanitizes urls', async () => {
    const steps = [
      { url: '/images/origin_1.png', alt: 'The grove at dawn' },
      { url: '', alt: '' }, // cleared slot — position must survive
      { url: 'javascript:alert(1)', alt: 'x' }, // invalid scheme → blanked
      { url: 'https://ik.imagekit.io/demo/img.jpg', alt: 'a'.repeat(300) },
    ];
    const put = await request(app)
      .put('/api/admin/content/process-images')
      .set('Cookie', admin)
      .send({ steps });
    expect(put.status).toBe(200);
    expect(put.body.value.steps).toHaveLength(4);
    expect(put.body.value.steps[0]).toEqual({
      url: '/images/origin_1.png',
      alt: 'The grove at dawn',
    });
    expect(put.body.value.steps[1]).toEqual({ url: '', alt: '' });
    expect(put.body.value.steps[2].url).toBe('');
    expect(put.body.value.steps[3].url).toBe(
      'https://ik.imagekit.io/demo/img.jpg'
    );
    expect(put.body.value.steps[3].alt).toHaveLength(160);

    // Admin read + public read agree.
    const got = await request(app)
      .get('/api/admin/content/process-images')
      .set('Cookie', admin);
    expect(got.body.value.steps[0].url).toBe('/images/origin_1.png');
    const pub = await request(app).get('/api/content/process-images');
    expect(pub.body.value.steps).toEqual(put.body.value.steps);

    // The change lands in the audit trail.
    const ev = await AuditEvent.findOne({ action: 'content.update' }).lean();
    expect(ev).toBeTruthy();
    expect(ev.target).toBe('process-images');
  });

  it('caps the steps array at 10 entries', async () => {
    const steps = Array.from({ length: 25 }, (_, i) => ({
      url: `/images/${(i % 5) + 1}.png`,
      alt: '',
    }));
    const put = await request(app)
      .put('/api/admin/content/process-images')
      .set('Cookie', admin)
      .send({ steps });
    expect(put.body.value.steps).toHaveLength(10);
  });

  it('clears everything when saved with empty slots', async () => {
    const put = await request(app)
      .put('/api/admin/content/process-images')
      .set('Cookie', admin)
      .send({ steps: [{ url: '', alt: '' }] });
    expect(put.body.value.steps).toEqual([{ url: '', alt: '' }]);
    expect(await SiteContent.countDocuments({})).toBe(1); // upsert, not insert
  });
});
