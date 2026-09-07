const { mongoose } = require('../db/db');

const itemSchema = new mongoose.Schema({
  productSlug: String, productName: String, sizeId: String, sizeLabel: String,
  unitPrice: Number, qty: Number,
}, { _id: false });

const schema = new mongoose.Schema({
  stripeSubscriptionId: { type: String, required: true, unique: true, index: true },
  stripeCustomerId: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  email: { type: String, required: true, lowercase: true, index: true },
  items: { type: [itemSchema], required: true },
  intervalMonths: { type: Number, required: true, min: 1, max: 12 },
  status: { type: String, required: true, index: true },
  currentPeriodEnd: { type: Date, default: null },
  shippingAddress: { type: Object, default: null },
  createdAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'subscriptions', versionKey: false });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', schema);
