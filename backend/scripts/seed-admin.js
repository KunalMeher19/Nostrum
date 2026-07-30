// Seed the first admin user.
// Usage:  node scripts/seed-admin.js
// Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME from .env.
// Idempotent: if the user exists it just ensures the admin role
// (and updates the password if SEED_ADMIN_PASSWORD is set).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDb, mongoose } = require('../src/db/db');
const User = require('../src/models/user.model');

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  const name = process.env.SEED_ADMIN_NAME || 'Nostrum Admin';

  if (!email) throw new Error('Set SEED_ADMIN_EMAIL in backend/.env');
  if (password && password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDb();

  const updates = { role: 'admin', name };
  if (password) updates.passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    await User.updateOne({ email }, { $set: updates });
    console.log(`Updated existing user "${email}" to admin.`);
  } else {
    if (!password) throw new Error('Set SEED_ADMIN_PASSWORD to create a new admin');
    await User.create({
      email,
      name,
      role: 'admin',
      passwordHash: updates.passwordHash,
      emailVerified: new Date(),
      createdAt: new Date(),
    });
    console.log(`Created admin user "${email}".`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
