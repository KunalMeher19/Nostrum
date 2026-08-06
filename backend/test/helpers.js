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
  await seedSessionUsers();
}

/** The fixed-uid users behind customerSession()/adminSession().
 * requireAdmin re-checks the role in the DB, so the admin session is
 * only honored when this user document actually exists with the role. */
async function seedSessionUsers() {
  const User = require('../src/models/user.model');
  await User.updateOne(
    { _id: '64b000000000000000000001' },
    { $setOnInsert: { name: 'Test Customer', email: 'customer@example.com', role: 'customer' } },
    { upsert: true }
  );
  await User.updateOne(
    { _id: '64b000000000000000000009' },
    { $setOnInsert: { name: 'Test Admin', email: 'admin@example.com', role: 'admin' } },
    { upsert: true }
  );
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
  seedSessionUsers,
  connectTestDb,
  dropAndCloseTestDb,
  sleep,
};
