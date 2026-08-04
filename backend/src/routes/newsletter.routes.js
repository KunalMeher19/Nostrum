// /api/newsletter · public subscribe + tokenized unsubscribe (GDPR).
// Responses never reveal whether an address was already known, so the
// endpoints cannot be used to enumerate the subscriber list.
const express = require('express');
const crypto = require('crypto');
const { publicWriteLimiter } = require('../middlewares/rate-limit.middleware');
const Subscriber = require('../models/subscriber.model');
const { sendNewsletterWelcome } = require('../services/mailer.service');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

router.post('/subscribe', publicWriteLimiter, async (req, res, next) => {
  try {
    const b = req.body || {};
    const email =
      typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : '';
    const locale = typeof b.locale === 'string' ? b.locale.slice(0, 5) : '';

    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid_email' });
    // GDPR: explicit consent is required to store the address.
    if (b.consent !== true) return res.status(400).json({ error: 'consent_required' });

    // Raw token goes only into the welcome email; we keep the hash.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    // Upsert: new signup, repeat signup, and resubscribe-after-
    // unsubscribe all land here and all refresh consent + token.
    await Subscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          locale,
          consentAt: now,
          unsubscribedAt: null,
          unsubscribeTokenHash: sha256(rawToken),
        },
        $setOnInsert: { email, createdAt: now },
      },
      { upsert: true }
    );

    const unsubscribeUrl = `${FRONTEND_URL}/${locale || 'en'}/unsubscribe?token=${rawToken}`;
    sendNewsletterWelcome({ email, unsubscribeUrl }).catch((err) =>
      console.error('[newsletter] welcome failed:', err.message)
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Idempotent: an unknown or reused token still answers ok so the link
// in an old email neither errors for the user nor confirms an address
// to a prober.
router.post('/unsubscribe', publicWriteLimiter, async (req, res, next) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.slice(0, 128) : '';
    if (token) {
      await Subscriber.findOneAndUpdate(
        { unsubscribeTokenHash: sha256(token), unsubscribedAt: null },
        { $set: { unsubscribedAt: new Date() } }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
