// NoSQL-injection guard · strips Mongo operator keys from user input.
//
// Any object key starting with "$" or containing "." is dropped,
// recursively, from req.body. Combined with the "simple" query parser
// (set in app.js — query values are always flat strings) this closes
// the classic `{ "$gt": "" }` / `{ "email.$ne": null }` operator
// injection path before anything reaches Mongoose.
function stripOperators(value) {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = stripOperators(v);
    }
    return clean;
  }
  return value;
}

function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripOperators(req.body);
  }
  next();
}

// Escapes a user-supplied string for safe use inside a RegExp (search
// boxes → $regex). Prevents both regex injection and ReDoS payloads.
function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Route-param guard: 24-hex ObjectId or 404 now, instead of a Mongoose
// CastError bubbling up as a 500 later.
function requireObjectId(param) {
  return (req, res, next) => {
    if (!/^[a-f0-9]{24}$/i.test(String(req.params[param] ?? ''))) {
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  };
}

module.exports = { sanitizeBody, stripOperators, escapeRegex, requireObjectId };
