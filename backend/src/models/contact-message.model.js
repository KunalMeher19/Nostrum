// Contact form submission · stored so the house never loses a message
// even while email delivery is a console stub, and relayed to the
// contact inbox via mailer.service. Read-only list in the admin API.
const { mongoose } = require('../db/db');

const TOPICS = ['general', 'professional', 'press'];

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, maxlength: 254 },
    topic: { type: String, enum: TOPICS, default: 'general' },
    message: { type: String, required: true, maxlength: 4000 },
    locale: { type: String, default: '', maxlength: 5 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'contact_messages', versionKey: false }
);

module.exports = {
  ContactMessage:
    mongoose.models.ContactMessage ||
    mongoose.model('ContactMessage', contactMessageSchema),
  TOPICS,
};
