// Hardening · auth gates, input guards, CORS allowlist, headers,
// payload limits. None of these need a database.
const request = require('supertest');
const { customerSession } = require('../test/helpers');

const app = require('../src/app');

describe('authentication gates', () => {
  it.each(['/api/me', '/api/orders', '/api/admin/orders', '/api/admin/customers'])(
    'GET %s without a session → 401',
    async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    }
  );

  it('rejects a garbage session cookie', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', 'authjs.session-token=not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('blocks customers from every admin endpoint (403)', async () => {
    const cookie = customerSession(); // role: customer
    for (const path of ['/api/admin/orders', '/api/admin/customers', '/api/admin/products']) {
      const res = await request(app).get(path).set('Cookie', cookie);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    }
  });
});

describe('input guards', () => {
  it('malformed ObjectId in the path → 404, not a 500 CastError', async () => {
    const res = await request(app)
      .get('/api/orders/DROP-TABLE')
      .set('Cookie', customerSession());
    expect(res.status).toBe(404);
  });

  it('invalid JSON body → 400 invalid_json', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Cookie', customerSession())
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_json');
  });

  it('oversized body → 413, connection survives', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Cookie', customerSession())
      .send({ name: 'x'.repeat(300 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('payload_too_large');
  });
});

describe('CORS allowlist', () => {
  it('reflects an allowed origin with credentials', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('gives an unknown origin no CORS headers at all', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('never answers with a wildcard', async () => {
    const res = await request(app)
      .options('/api/orders')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('response hygiene', () => {
  it('hides the stack: helmet headers on, x-powered-by off', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('unknown routes → uniform JSON 404', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
