// Seed the products collection from the same placeholder catalog the
// public Shop renders (frontend src/lib/products.ts). Idempotent:
// only inserts products that do not exist yet, so admin edits survive
// re-runs. Usage:  npm run seed:products   (add --reset to overwrite)
require('dotenv').config();
const { connectDb, mongoose } = require('../src/db/db');
const Product = require('../src/models/product.model');

// Mirror of frontend src/lib/products.ts (placeholder pricing, §7).
// Updated to include Duo (2×5L) pack as the third product.
const CATALOG = [
  {
    slug: 'extra-virgin-olive-oil-5l',
    name: 'Nostrum 5L',
    subtitle: 'Extra Virgin Olive Oil',
    description:
      'Our flagship format. Cold pressed within hours of picking, from the old rows at El Perello.',
    category: 'Olive Oil',
    images: ['/products/11.webp', '/products/1.webp'],
    sizes: [{ id: '5l', label: '5L', price: 35, stock: 120 }],
    defaultSizeId: '5l',
    packs: [
      { qty: 1, discount: 0 },
      { qty: 2, discount: 0.05 },
      { qty: 3, discount: 0.1 },
    ],
    active: true,
    featured: true,
  },
  {
    slug: 'extra-virgin-olive-oil-duo',
    name: 'Duo',
    subtitle: '2 × 5L',
    description:
      'Two 5L bottles. Perfect for regular use or sharing with family.',
    category: 'Olive Oil',
    images: ['/products/2.webp'],
    sizes: [{ id: 'duo', label: '2 × 5L', price: 66, stock: 100 }],
    defaultSizeId: 'duo',
    packs: [
      { qty: 1, discount: 0 },
      { qty: 2, discount: 0.05 },
    ],
    active: true,
    featured: true,
  },
  {
    slug: 'extra-virgin-olive-oil-2l',
    name: 'Nostrum 2L',
    subtitle: 'Extra Virgin Olive Oil',
    description:
      'The kitchen format, in two varieties. Picual for its pepper and body, Arbequina for its softer, sweeter finish.',
    category: 'Olive Oil',
    images: ['/products/4.webp', '/products/14.webp'],
    sizes: [{ id: '2l', label: '2L', price: 16, stock: 200 }],
    defaultSizeId: '2l',
    packs: [
      { qty: 1, discount: 0 },
      { qty: 2, discount: 0.05 },
      { qty: 3, discount: 0.1 },
    ],
    active: true,
    featured: true,
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
