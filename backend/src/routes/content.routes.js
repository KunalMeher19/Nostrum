// /api/content · public reads for admin-editable site sections. Only
// whitelisted keys ever leave this router.
const express = require('express');
const SiteContent = require('../models/site-content.model');

const router = express.Router();

const PUBLIC_KEYS = ['process-images'];

router.get('/:key', async (req, res, next) => {
  try {
    const key = String(req.params.key).slice(0, 60);
    if (!PUBLIC_KEYS.includes(key)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const doc = await SiteContent.findOne({ key }).lean();
    res.json({ key, value: doc?.value ?? null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
