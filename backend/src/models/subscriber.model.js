// Newsletter subscriber · GDPR-aware: consent timestamp recorded at
// signup, unsubscribe is a hashed single-purpose token (raw token only
// ever lives in the welcome email), unsubscribedAt suppresses the
// address from exports without deleting the consent trail.
const { mongoose } = require('../db/db');

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, maxlength: 254 },
    locale: { type: String, default: '', maxlength: 5 },
    consentAt: { type: Date, required: true },
    unsubscribedAt: { type: Date, default: null },
    // sha256 hex of the raw unsubscribe token (never store the raw).
    unsubscribeTokenHash: { type: String, default: null, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'newsletter_subscribers', versionKey: false }
);

module.exports =
  mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
