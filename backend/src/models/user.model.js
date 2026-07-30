// User model · maps onto the "users" collection written by the Next.js
// Auth.js layer (MongoDB adapter + credentials register route). Field
// names must stay in sync with frontend src/lib/auth/users.ts.
const { mongoose } = require('../db/db');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    passwordHash: { type: String, select: false },
    locale: { type: String },
    gdprConsentAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    // Customer portal: editable shipping details
    shipping: {
      fullName: String,
      line1: String,
      line2: String,
      city: String,
      region: String,
      postalCode: String,
      country: String,
      phone: String,
    },
  },
  { collection: 'users', versionKey: false }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
