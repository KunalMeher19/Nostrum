// /api/me · current user (session check + profile for the portals).
const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { writeLimiter } = require('../middlewares/rate-limit.middleware');
const User = require('../models/user.model');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role ?? 'customer',
      locale: user.locale ?? null,
      emailVerified: user.emailVerified ?? null,
      shipping: user.shipping ?? null,
      gdprConsentAt: user.gdprConsentAt ?? null,
      marketingConsentAt: user.marketingConsentAt ?? null,
      createdAt: user.createdAt ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// Update account / shipping details (customer portal).
router.patch('/', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim().slice(0, 120);
    }
    if (typeof req.body.locale === 'string') {
      const VALID_LOCALES = ['en', 'es', 'ca', 'it', 'el'];
      if (VALID_LOCALES.includes(req.body.locale)) updates.locale = req.body.locale;
    }
    // Marketing consent is an explicit opt-in/out toggle (GDPR). Google
    // sign-ins never see the signup checkbox, so this is their control.
    if (typeof req.body.marketingConsent === 'boolean') {
      updates.marketingConsentAt = req.body.marketingConsent ? new Date() : null;
    }
    if (req.body.shipping && typeof req.body.shipping === 'object') {
      const s = req.body.shipping;
      updates.shipping = {
        fullName: String(s.fullName ?? '').slice(0, 120),
        line1: String(s.line1 ?? '').slice(0, 200),
        line2: String(s.line2 ?? '').slice(0, 200),
        city: String(s.city ?? '').slice(0, 100),
        region: String(s.region ?? '').slice(0, 100),
        postalCode: String(s.postalCode ?? '').slice(0, 20),
        country: String(s.country ?? '').slice(0, 100),
        phone: String(s.phone ?? '').slice(0, 40),
      };
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
