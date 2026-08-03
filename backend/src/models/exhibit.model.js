// Museum exhibit · one piece in the Journal's digital museum: a single
// image with a short explanation, hung in a themed "room". Curated in
// the admin portal; images are placeholders until the client sends the
// real factory photographs.
const { mongoose } = require('../db/db');

// Exhibition rooms, in walking order.
const MUSEUM_ROOMS = ['grove', 'harvest', 'mill', 'family'];

const exhibitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    caption: { type: String, default: '', maxlength: 500 },
    image: { type: String, required: true },
    room: { type: String, enum: MUSEUM_ROOMS, default: 'grove' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'journal_exhibits', versionKey: false }
);

module.exports = {
  Exhibit:
    mongoose.models.Exhibit || mongoose.model('Exhibit', exhibitSchema),
  MUSEUM_ROOMS,
};
