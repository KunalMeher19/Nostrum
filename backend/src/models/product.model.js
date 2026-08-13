// Product model · MongoDB mirror of the static catalog in
// frontend src/lib/products.ts. The admin portal edits THIS copy
// (prices, stock, sizes, packs); the public Shop keeps reading the
// static placeholder catalog until the client confirms real data,
// at which point the Shop can be pointed at /api/products.
const { mongoose } = require('../db/db');

const sizeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // "5l", "500ml", ...
    label: { type: String, required: true },
    price: { type: Number, required: true }, // unit price in EUR
    stock: { type: Number, default: 0 }, // admin-managed stock per size
  },
  { _id: false }
);

const packSchema = new mongoose.Schema(
  {
    qty: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // fraction, e.g. 0.05
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    images: { type: [String], default: [] }, // ImageKit URLs or /public paths
    sizes: { type: [sizeSchema], default: [] },
    defaultSizeId: { type: String, default: null },
    packs: { type: [packSchema], default: [] },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false }, // shown in home page grid
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'products', versionKey: false }
);

productSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

module.exports =
  mongoose.models.Product || mongoose.model('Product', productSchema);
