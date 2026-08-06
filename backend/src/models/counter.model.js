// Counter · atomic sequences (order numbers). One document per
// sequence; $inc under findOneAndUpdate is atomic in MongoDB, so
// concurrent order creation can never mint the same number.
const { mongoose } = require('../db/db');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "orders-2026"
    seq: { type: Number, default: 0 },
  },
  { collection: 'counters', versionKey: false }
);

module.exports = {
  Counter: mongoose.models.Counter || mongoose.model('Counter', counterSchema),
};
