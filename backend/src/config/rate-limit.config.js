// Rate-limit tiers · every number is env-tunable so ops can adjust
// without a deploy, and tests can shrink windows to milliseconds.
//
// Philosophy: generous enough that a real customer clicking through the
// portal (or an admin working the back room) never sees a 429, tight
// enough that scripted abuse cannot exhaust the server or enumerate data.
const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

module.exports = {
  // Global: everything under /api. A human browsing hard stays well
  // under this; a scraper or flood trips it.
  global: {
    windowMs: num('RATE_GLOBAL_WINDOW_MS', 60_000),
    max: num('RATE_GLOBAL_MAX', 300),
  },
  // Writes (profile updates, order status changes, product edits).
  write: {
    windowMs: num('RATE_WRITE_WINDOW_MS', 60_000),
    max: num('RATE_WRITE_MAX', 30),
  },
  // Heavy responses: PDF invoices and CSV exports cost real CPU/IO.
  heavy: {
    windowMs: num('RATE_HEAVY_WINDOW_MS', 60_000),
    max: num('RATE_HEAVY_MAX', 15),
  },
  // Unauthenticated probes: requests that arrive with NO session cookie
  // get a much smaller budget (credential-less scanning / 401 farming).
  anon: {
    windowMs: num('RATE_ANON_WINDOW_MS', 60_000),
    max: num('RATE_ANON_MAX', 60),
  },
  // Public, unauthenticated writes (contact form, newsletter signup):
  // a human sends one or two; a spam script sends hundreds.
  publicWrite: {
    windowMs: num('RATE_PUBLIC_WRITE_WINDOW_MS', 60_000),
    max: num('RATE_PUBLIC_WRITE_MAX', 5),
  },
};
