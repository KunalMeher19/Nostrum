// POST /api/auth/logout · blacklist the current session token.
//
// Auth.js handles logout in the frontend (clears cookie), but the token
// itself remains valid until expiry. This endpoint blacklists the token's
// jti in Redis so it can no longer be used for API access.
//
// Must be called BEFORE the frontend clears the cookie (while the session
// is still readable), or with the token value passed explicitly.
const express = require('express');
const { readSession } = require('../middlewares/auth.middleware');
const { blacklistToken } = require('../services/token-blacklist.service');

const router = express.Router();

router.post('/logout', async (req, res, next) => {
  try {
    // Read the current session from the cookie
    const payload = await readSession(req);

    if (!payload) {
      // No valid session found - already logged out or invalid token
      return res.json({ success: true, message: 'already_logged_out' });
    }

    const jti = payload.jti; // Token unique identifier
    const exp = payload.exp; // Token expiration (seconds since epoch)

    if (!jti) {
      // Token has no jti claim - cannot blacklist (older Auth.js version?)
      console.warn('[auth/logout] token missing jti claim, cannot blacklist');
      return res.json({ success: true, message: 'token_cleared' });
    }

    // Blacklist the token in Redis with TTL = remaining token lifetime
    await blacklistToken(jti, exp);

    console.log(`[auth/logout] blacklisted token for user: ${payload.email || payload.uid}`);

    res.json({ success: true, message: 'logged_out' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
