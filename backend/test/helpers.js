// Shared test utilities.
const { mongoose } = require('../src/db/db');

/** Auth.js session cookie the mocked jose accepts (see mocks/jose.js). */
function sessionCookie(payload, name = 'authjs.session-token') {
  const token =
    'test.' + Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${name}=${token}`;
}

function customerSession(overrides = {}) {
  return sessionCookie({
    uid: overrides.uid ?? '64b000000000000000000001',
    email: overrides.email ?? 'customer@example.com',
    name: overrides.name ?? 'Test Customer',
    role: overrides.role ?? 'customer',
  });
}

function adminSession(overrides = {}) {
  return customerSession({
    uid: '64b000000000000000000009',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    ...overrides,
  });
}

/** Connects mongoose to a throwaway test database. */
async function connectTestDb() {
  const uri =
    process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/nostrum-test';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
}

async function dropAndCloseTestDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  sessionCookie,
  customerSession,
  adminSession,
  connectTestDb,
  dropAndCloseTestDb,
  sleep,
};
