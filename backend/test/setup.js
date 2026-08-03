// Global Jest test setup — runs before each test file (configured in jest.config.js).

process.env.NODE_ENV = 'test';
// auth.middleware derives a decryption key from this at runtime; any
// value works because jose is mocked, but it must be present.
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';
