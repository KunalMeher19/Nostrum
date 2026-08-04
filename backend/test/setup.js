// Global Jest test setup — runs before each test file (configured in jest.config.js).

process.env.NODE_ENV = 'test';
// auth.middleware derives a decryption key from this at runtime; any
// value works because jose is mocked, but it must be present.
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';
// The publicWrite tier (5/min in prod) would trip across ordinary test
// requests in one suite; tests that prove the limiter tune it back down
// on a fresh app instance.
process.env.RATE_PUBLIC_WRITE_MAX = process.env.RATE_PUBLIC_WRITE_MAX || '1000';
