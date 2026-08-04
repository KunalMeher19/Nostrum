// /api/contact · public contact form intake.
// Stores the message and relays it to the house inbox (console stub
// until an email provider is wired; see services/mailer.service.js).
const express = require('express');
const { publicWriteLimiter } = require('../middlewares/rate-limit.middleware');
const { ContactMessage, TOPICS } = require('../models/contact-message.model');
const { sendContactRelay } = require('../services/mailer.service');

const router = express.Router();

// Same permissive shape the register route uses: something@something.tld
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', publicWriteLimiter, async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = typeof b.name === 'string' ? b.name.trim().slice(0, 120) : '';
    const email =
      typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : '';
    const message = typeof b.message === 'string' ? b.message.trim().slice(0, 4000) : '';
    const topic = TOPICS.includes(b.topic) ? b.topic : 'general';
    const locale = typeof b.locale === 'string' ? b.locale.slice(0, 5) : '';

    if (!name) return res.status(400).json({ error: 'name_required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid_email' });
    if (!message) return res.status(400).json({ error: 'message_required' });

    await ContactMessage.create({ name, email, topic, message, locale });

    // Relay is best-effort: the message is already persisted, so a mail
    // failure must not turn a received message into a user-facing error.
    sendContactRelay({ name, email, topic, message }).catch((err) =>
      console.error('[contact] relay failed:', err.message)
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
