// /api/products · public product catalog (active products only).
// Used by the home page and public shop to fetch live data from MongoDB.
const express = require('express');
const Product = require('../models/product.model');

const router = express.Router();

// GET /api/products — all active products, ordered by featured first then name.
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({ active: true })
      .sort({ featured: -1, name: 1 })
      .lean();
    res.json({
      products: products.map((p) => ({
        id: String(p._id),
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        images: p.images ?? [],
        sizes: p.sizes,
        defaultSizeId: p.defaultSizeId,
        packs: p.packs,
        featured: p.featured,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured — first 3 featured active products (for home page grid).
router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ active: true, featured: true })
      .sort({ name: 1 })
      .limit(3)
      .lean();
    res.json({
      products: products.map((p) => ({
        id: String(p._id),
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        images: p.images ?? [],
        sizes: p.sizes,
        defaultSizeId: p.defaultSizeId,
        packs: p.packs,
        featured: p.featured,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
