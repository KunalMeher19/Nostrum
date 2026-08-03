// Rate limiting · proves the limits trip on abuse, stay invisible for
// genuine traffic, key per client, and recover after the window.
//
// Env knobs are read when the app module loads, so each block below
// configures process.env FIRST and then requires a fresh app instance.
const request = require('supertest');
const { customerSession, sleep } = require('../test/helpers');

function freshApp(env = {}) {
  jest.resetModules();
  for (const [k, v] of Object.entries(env)) process.env[k] = String(v);
  // eslint-disable-next-line global-require
  return require('../src/app');
}

afterEach(() => {
  // Don't leak tuned limits into the next block.
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('RATE_') || k === 'TRUST_PROXY') delete process.env[k];
  }
});

describe('global limiter', () => {
  it('serves genuine browsing untouched (50 requests, zero 429s)', async () => {
    const app = freshApp(); // production defaults: 300/min global
    const cookie = customerSession();
    for (let i = 0; i < 50; i++) {
      const res = await request(app)
        .get('/api/health')
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 + standard headers once the budget is spent', async () => {
    const app = freshApp({ RATE_GLOBAL_MAX: 5, RATE_GLOBAL_WINDOW_MS: 60000 });
    const cookie = customerSession(); // skips the anon tier
    for (let i = 0; i < 5; i++) {
      const ok = await request(app).get('/api/health').set('Cookie', cookie);
      expect(ok.status).toBe(200);
    }
    const blocked = await request(app).get('/api/health').set('Cookie', cookie);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'too_many_requests',
      retryAfterSeconds: 60,
    });
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.headers['ratelimit']).toBeDefined(); // draft-7 header
  });

  it('recovers after the window passes (server never stays locked)', async () => {
    const app = freshApp({ RATE_GLOBAL_MAX: 2, RATE_GLOBAL_WINDOW_MS: 300 });
    const cookie = customerSession();
    await request(app).get('/api/health').set('Cookie', cookie);
    await request(app).get('/api/health').set('Cookie', cookie);
    const blocked = await request(app).get('/api/health').set('Cookie', cookie);
    expect(blocked.status).toBe(429);
    await sleep(400);
    const recovered = await request(app).get('/api/health').set('Cookie', cookie);
    expect(recovered.status).toBe(200);
  });

  it('keys per client IP, so one abuser cannot exhaust everyone', async () => {
    const app = freshApp({
      RATE_GLOBAL_MAX: 3,
      RATE_GLOBAL_WINDOW_MS: 60000,
      TRUST_PROXY: 1, // honor X-Forwarded-For like a deployed proxy would
    });
    const cookie = customerSession();
    // Client A burns its whole budget…
    for (let i = 0; i < 3; i++) {
      await request(app)
        .get('/api/health')
        .set('Cookie', cookie)
        .set('X-Forwarded-For', '10.0.0.1');
    }
    const abuserBlocked = await request(app)
      .get('/api/health')
      .set('Cookie', cookie)
      .set('X-Forwarded-For', '10.0.0.1');
    expect(abuserBlocked.status).toBe(429);
    // …while client B sails through.
    const genuine = await request(app)
      .get('/api/health')
      .set('Cookie', cookie)
      .set('X-Forwarded-For', '10.0.0.2');
    expect(genuine.status).toBe(200);
  });
});

describe('anonymous (cookie-less) tier', () => {
  it('clamps scanners without a session much earlier', async () => {
    const app = freshApp({ RATE_ANON_MAX: 3, RATE_ANON_WINDOW_MS: 60000 });
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    }
    const blocked = await request(app).get('/api/health');
    expect(blocked.status).toBe(429);
  });

  it('does not apply to signed-in traffic', async () => {
    const app = freshApp({ RATE_ANON_MAX: 2, RATE_ANON_WINDOW_MS: 60000 });
    const cookie = customerSession();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).get('/api/health').set('Cookie', cookie);
      expect(res.status).toBe(200);
    }
  });
});

describe('write tier (mutations)', () => {
  it('limits PATCH /api/me harder than reads', async () => {
    const app = freshApp({ RATE_WRITE_MAX: 2, RATE_WRITE_WINDOW_MS: 60000 });
    // No session on purpose: the limiter sits in front of auth, so even
    // 401 probing burns the attacker's write budget.
    await request(app).patch('/api/me').send({ name: 'x' });
    await request(app).patch('/api/me').send({ name: 'x' });
    const blocked = await request(app).patch('/api/me').send({ name: 'x' });
    expect(blocked.status).toBe(429);
    // Reads on the same connection still fine (separate bucket).
    const read = await request(app).get('/api/health');
    expect(read.status).toBe(200);
  });
});

describe('heavy tier (PDF invoices / CSV export)', () => {
  it('limits invoice downloads independently', async () => {
    const app = freshApp({ RATE_HEAVY_MAX: 1, RATE_HEAVY_WINDOW_MS: 60000 });
    const id = '64b0000000000000000000aa';
    const first = await request(app).get(`/api/orders/${id}/invoice`);
    expect(first.status).toBe(401); // counted, then rejected by auth
    const blocked = await request(app).get(`/api/orders/${id}/invoice`);
    expect(blocked.status).toBe(429);
  });

  it('limits the customers CSV export', async () => {
    const app = freshApp({ RATE_HEAVY_MAX: 1, RATE_HEAVY_WINDOW_MS: 60000 });
    const first = await request(app).get('/api/admin/customers.csv');
    expect(first.status).toBe(401);
    const blocked = await request(app).get('/api/admin/customers.csv');
    expect(blocked.status).toBe(429);
  });
});
