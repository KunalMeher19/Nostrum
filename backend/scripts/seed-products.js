// Seed the products collection from the same placeholder catalog the
// public Shop renders (frontend src/lib/products.ts). Idempotent:
// only inserts products that do not exist yet, so admin edits survive
// re-runs. Usage:  npm run seed:products   (add --reset to overwrite)
require('dotenv').config();
const { connectDb, mongoose } = require('../src/db/db');
const Product = require('../src/models/product.model');

// Mirror of frontend src/lib/products.ts (placeholder pricing, §7).
const CATALOG = [
  {
    slug: 'extra-virgin-olive-oil',
    name: 'Nostrum',
    subtitle: 'Extra Virgin Olive Oil',
    category: 'Olive Oil',
    sizes: [
      { id: '5l', label: '5L', price: 35, stock: 120 },
      { id: '3l', label: '3L', price: 24, stock: 80 },
      { id: '1l', label: '1L', price: 14, stock: 200 },
      { id: '500ml', label: '500ml', price: 9, stock: 150 },
    ],
    defaultSizeId: '5l',
    packs: [
      { qty: 1, discount: 0 },
      { qty: 2, discount: 0.05 },
      { qty: 3, discount: 0.1 },
    ],
    active: true,
  },
];

async function main() {
  const reset = process.argv.includes('--reset');
  await connectDb();

  for (const p of CATALOG) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing && !reset) {
      console.log(`Product "${p.slug}" exists, keeping admin edits.`);
      continue;
    }
    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: { ...p, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`${existing ? 'Reset' : 'Created'} product "${p.slug}".`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
