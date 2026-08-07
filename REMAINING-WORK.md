# Nostrum · Remaining Work

> Audit date: 2026-08-04. Updated 2026-08-06 after building the unblocked order-fulfilment plumbing (2.5), the backend hardening round (2.6), and the frontend gap round against the client's brief PDF (2.7: guest track page, admin audit tab, portal premium pass).
> Checked against `NOSTRUM-DESIGN.md`, the original brief (`assests/Nostrum.pdf`), client feedback rounds, and the current codebase.
> What already exists and works: auth (Auth.js v5 + Express JWE verify, Google flow built), customer portal (with stats strip + premium pass), admin portal (orders / customers CSV / shop editor / journal authoring / audit trail viewer), Journal blog + digital museum, pdfkit invoices, orders + products + journal APIs in MongoDB (with stock consumption, shipping-status mails, tracking links, guest order lookup + public /track page), rate limiting tiers + NoSQL-injection guards + backend test suite, cookie banner with real consent state, GDPR consent on signup, contact + newsletter backends with unsubscribe, consent-gated GA4 loader, 5 locales, DEPLOY.md.

---

## 1. Blocked on client decisions (cannot build yet)

### 1.1 Commerce backend: checkout + payments (the big one)
- Checkout does not exist. `src/components/pages/CartPage.tsx` has a disabled "Checkout · coming soon" button.
- Brief requires: product list → product page → cart → checkout, **guest checkout**, Stripe (confirm Redsys / PayPal with client's bank), shipping rates, IVA/VAT.
- **Open decision (§14):** Shopify headless vs. custom + Stripe. The entire order layer was built swappable behind `backend/src/services/orders.service.js`; when the client decides, reimplement only that module.
- **Our recommendation to the client (2026-08-06): custom + Stripe Checkout.** Portals, invoices, admin, and the Mongo order layer are already built; Shopify would mean re-plumbing all of it and fighting theme restrictions. Stripe Checkout gives hosted card payments, guest checkout, Apple/Google Pay, and Stripe Tax for Spanish IVA. Redsys is unnecessary with Stripe; PayPal can be added later if the client insists. Ask once, then build.
- **Build recipe when the client says yes (Stripe path):**
  1. `npm install stripe` in `backend/`; env `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
  2. `POST /api/checkout` (public, rate-limited): validate cart lines against the `products` collection (server-side prices, never trust the browser), create a Stripe Checkout Session (`mode: payment`, `automatic_tax`, `shipping_address_collection`, locale from the request), return the redirect URL. Logged-in users get their email prefilled; guests type theirs.
  3. `POST /api/stripe/webhook` (raw body, signature-verified, mounted BEFORE express.json): on `checkout.session.completed`, build the order payload (items, address, email, `userId` when the session carried one) and call `orders.service.createOrder()`. That single call already consumes stock and fires the confirmation mail. Map `OutOfStockError` → refund + apology mail (rare race; stock is also checked at session creation).
  4. Orders must NEVER be created from the success redirect page; only from the webhook.
  5. Frontend: enable the CartPage button → call `/api/checkout` → `window.location = url`; success/cancel pages under `/[locale]/shop/checkout/…` (5 locales).
  6. Shipping rates + free-shipping threshold: client must supply the numbers (currently a per-order `shippingCost` field exists; expose config via env or an admin setting).

### 1.2 Real shop catalog
- Public Shop intentionally still reads static placeholders in `src/lib/products.ts` (sizes / prices / photos / oil types unconfirmed by client).
- The MongoDB `products` collection + admin shop editor is ready to become the source of truth once real data arrives. Task then: point the public Shop at the products API.
- **Build recipe when real data arrives:** enter the catalog through the admin shop editor; add a public `GET /api/products` (active only, cached) to `backend`; swap `src/lib/products.ts` consumers to fetch it server-side (keep the type shape, it already mirrors the model); product photos to `public/` or a CDN. Stock now matters: `createOrder` consumes per-size stock (see 2.5), so real counts must be set before checkout goes live.

### 1.3 Email provider (Resend)
- `src/lib/auth/mailer.ts` (Next) and `backend/src/services/mailer.service.js` (Express) are console stubs. Wiring instructions are in each header comment (install resend, RESEND_API_KEY, verified sending domain).
- Blocks real delivery of: verification, password reset, contact relay, newsletter welcome, order confirmation.
- Needs from client: sending domain + Resend account (or provider choice).

### 1.4 Google OAuth credentials
- Flow fully built (`allowDangerousEmailAccountLinking: true`), but `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are empty. Client must supply Google Cloud credentials.
- This is the "must never break again" item (broken on the client's previous site). Test end-to-end with real credentials before launch.

### 1.5 Legal + contact content (client open items, §20)
- Privacy policy, legal notice, cookies text (LSSI-CE), real contact details.
- Business WhatsApp number (E.164) + preferred prefill text for the floating bubble.
- Final colors / fonts sign-off, professional photography (placeholders in use).

---

## 2. Buildable now — DONE 2026-08-04

### 2.1 Contact form backend — DONE
- `POST /api/contact` (publicWrite limiter, validated) stores to `contact_messages` and relays via the backend mailer stub (`backend/src/services/mailer.service.js`, console until Resend). `ContactSection.tsx` wired with a retryable error state. Admin read-only inbox: `GET /api/admin/contact-messages`.

### 2.2 Newsletter backend — DONE
- `Subscriber` model (email, locale, consentAt, unsubscribedAt, hashed unsubscribe token). `POST /api/newsletter/subscribe` (consent required, enumeration-safe upsert). `NewsletterModal.tsx` wired + fully localized (`newsletter.*` in 5 locales). Admin export: `GET /api/admin/newsletter/subscribers(.csv)` (BOM-prefixed).

### 2.3 Unsubscribe handling — DONE
- Tokenized (sha256-hashed) link in the welcome mail → `/[locale]/unsubscribe` page (explicit confirm click) → `POST /api/newsletter/unsubscribe` (idempotent, non-enumerating).

### 2.4 Order confirmation path — DONE (stub)
- `orders.service.createOrder()` is the creation seam; it fires `sendOrderConfirmation` (console stub). Checkout must create orders through it when it lands. Since 2026-08-06 it also consumes stock (see 2.5), so it is the single entry point for everything an order must do.

### 2.5 Order fulfilment plumbing — DONE 2026-08-06 (built ahead of the commerce decision; all payment-rail-agnostic)
- **Stock consumption:** `createOrder()` atomically decrements per-size stock in the `products` collection (filter requires `stock >= qty`, so concurrent orders cannot oversell); throws `OutOfStockError` (`code: OUT_OF_STOCK`) and rolls back already-taken lines. Inactive/unknown products count as out of stock. Cancelling an order (admin status → `cancelled`) restocks the units exactly once.
- **Shipping-status mail:** `sendShippingUpdate` added to `backend/src/services/mailer.service.js` (console stub, same pattern); fired by `updateOrderStatus()` only on the transition INTO `shipped`, carrying carrier + tracking link. Re-saving a shipped order (e.g. fixing the code) does not re-mail.
- **Tracking links:** `orders.service.js` maps known carriers (SEUR, Correos Express, Correos, MRW, GLS, DHL, UPS) to tracking-page URLs; order detail responses now include `trackingUrl`, and the customer portal renders the tracking code as a link (`AccountPortal.tsx`, lime underline style). Unknown carriers degrade to the bare code.
- **Guest orders:** `Order.userId` is now optional (was required; changed 2026-08-06 because the brief requires guest checkout). Public `POST /api/orders/lookup` (publicWrite limiter) returns full order detail for the exact order-number + purchase-email pair; the pair is the ownership proof, same model as carrier tracking pages. Account order lists are unaffected.
- **Verified:** `backend/__tests__/orders.test.js` (stock consume/reject/rollback, ship-mail once, restock once, tracking URLs, lookup happy/miss/validation) + updated seam test; full suite 69/69 green; frontend `tsc --noEmit` clean.
- **Guest track-my-order page — DONE 2026-08-06** (was listed here as "still to add later" when the lookup endpoint shipped earlier the same day): `/[locale]/track` (`src/app/[locale]/track/page.tsx` + `src/components/TrackOrderSection/`), dark portal material language, number + email form → full order view (gold timeline, items ledger, carrier tracking link), enumeration-safe error copy, linked from BOTH the site footer (`footer.track`) and the side menu (`nav.track` added to `UnderlayNav` 2026-08-06 on client request; was footer-only when first shipped), `track.*` + `meta.track_*` copy in all 5 locales. Verified: `tsc --noEmit` + `next build` clean, route prerenders in all 5 locales. Still optional later: guest invoice download via the same number+email pair if the client wants it.

### 2.6 Backend hardening round — DONE 2026-08-06 (all unblocked, no client input needed)
- **Process resilience:** `backend/server.js` now drains gracefully on SIGTERM/SIGINT (stop accepting → finish in-flight → close Mongo → exit; hard-exit timer via `SHUTDOWN_GRACE_MS`, default 10s) and exits non-zero on `uncaughtException`/`unhandledRejection` so the process manager restarts clean. Boot smoke-tested.
- **Fail-fast env validation:** `src/config/env.config.js` runs before listen. Always requires `MONGODB_URI` + `AUTH_SECRET`; in production additionally refuses to start on missing/localhost `CORS_ORIGIN` or an `AUTH_SECRET` under 32 chars, and warns when `TRUST_PROXY` is unset. Turns silent prod misconfigurations into loud boot failures. `DEPLOY.md` updated.
- **Instant admin revocation:** admin routes moved from token-role trust (`requireRole('admin')`) to `requireAdmin`, which re-reads the CURRENT role from the users collection on every request (one indexed lookup). Demoting/deleting the admin user in the DB now locks the panel instantly instead of at session expiry. Customer routes still trust the token (cheap tier). Test helpers seed the fixed-uid session users to match.
- **Admin audit trail:** append-only `audit_events` collection (actor, action, target, meta, ip, at) written fire-and-forget from every admin mutation (order status, product edits, journal posts, exhibits) and both PII CSV exports (GDPR accountability for the email-marketing exports). Read-only `GET /api/admin/audit-events` (latest 200). Admin UI added 2026-08-06 (was endpoint-only at first): an "Audit" tab in `AdminPortal.tsx` renders the latest 200 events as a read-only table (when / actor / action + meta / target), `admin.tab_audit` + column copy in all 5 locales.
- **Atomic order numbers:** `counters` collection + `orders.service.nextOrderNumber()` mint per-year sequential numbers (`NST-2026-0001`) under an atomic `$inc`; `createOrder()` auto-assigns when the payload carries no number. Removes the caller-supplied-number landmine from the checkout build.
- **CSRF surface trimmed:** dropped `express.urlencoded` (JSON-only API — HTML-form bodies are no longer parsed at all) and added a cross-site mutation guard: POST/PUT/PATCH/DELETE with an Origin header outside the CORS allowlist → 403. Origin-less clients (curl, server-to-server) pass, since they cannot carry a victim's cookie. Belt-and-braces on top of SameSite=Lax.
- **Known accepted trade-off (documented in code):** the anon rate-limit tier is skippable by sending a fake session cookie (string check, not a decrypt, to avoid doubling crypto per request); such traffic still faces the global tier and 401s.
- **Verified:** `backend/__tests__/ops.hardening.test.js` (env assertions, revocation, ghost-admin, audit writes + exports, number sequencing, origin guard, form-body rejection); full suite 80/80 green across 10 suites.
- **Deferred to deploy time (in DEPLOY.md territory):** pino structured logging with request IDs + PII redaction when Resend lands; CI (GitHub Action running backend tests + `npm audit`); HSTS at the proxy; Atlas backups; integer-cents money migration when Stripe lands; TOTP 2FA for the admin account (put to client once real data flows).

### 2.7 Frontend gap round vs. the brief PDF — DONE 2026-08-06

Re-audited the frontend against the original client brief (`assests/Nostrum.pdf`). Confirmed implemented: quick add-to-cart on hover, product page (size selector, x1/x2/x3 + free custom quantity, description/shipping tabs), full client portal, footer structure, History as `/origins`, contact form, cookie banner, 5 locales. Gaps found and their dispositions:

- **Guest track-my-order page — BUILT** (see 2.5).
- **Admin audit tab — BUILT** (see 2.6).
- **Customer portal premium pass — BUILT:** stats strip under the greeting (orders / in motion / all-time spend, cancelled orders excluded from spend; `portal.stat_*` in 5 locales), gold top keyline + panel entrance animation + soft shadow, gold hairline tick on hovered/open order rows, order-number gold hover, tonal status chips, tab hover states. All inside the existing dark ledger language, reduced-motion safe (blanket rule already in the file).
- **Floating WhatsApp bubble (every page, brief §03) — PARKED by project decision 2026-08-06.** Not built yet; currently WhatsApp appears only in the contact panel + footer link. Number itself is still blocked on client (1.5), but the bubble can be built with a placeholder whenever unparked. Must be the on-brand dark pill, not the stock green widget.
- **B2B block at the END of the Shop + Home CTA (brief §04) — PARKED by project decision 2026-08-06.** Today only a top-of-shop B2B button routing to the contact form ("professional" topic) exists.
- **Search in the top nav (brief §04 sketch) — ON HOLD by project decision 2026-08-06.** With a 3-product catalog it may be pointless; put "skip or build" to the client alongside the commerce question.
- **Signature motion ideas (brief §07: light streaks, spinning olives, sketch illustration, pour CTA, leaf-sound toggle) — still open, optional.** Brief says "options to explore, pick what looks best"; none built (frame-sequence hero was disabled after feedback 1.0). Propose one (spinning olives or pour CTA) or close the topic with the client.

Verified: frontend `tsc --noEmit` and `next build` clean; no backend changes this round.

---

## 3. Pre-launch hardening / deployment chores

- **Redis for rate limiting — DONE (env-gated):** set `REDIS_URL` and all limiter tiers share buckets via rate-limit-redis (`backend/src/db/redis.js`); unset = in-memory as before.
- **Shared validator layer — RESOLVED:** deleted the empty `validator.middleware.js` stub; inline validation is the project convention across all routes.
- **`broker/broker.js` — RESOLVED:** deleted (unused).
- **Deployment config — DOCUMENTED:** see `DEPLOY.md` (env reference for both apps + launch checklist). Actual values set at deploy time.
- **Origins scroll-line broken in Brave — FIXED (2026-08-07):** the /origins "how it's made" SVG stroke lagged behind scroll in Brave and never reached step 05 (fine in the client's Chrome). Two real causes found by live bisection with Playwright, both fixed in `StoryProcess.tsx` + `story-process.css`: (1) `vector-effect: non-scaling-stroke` combined with the huge `stroke-dasharray` makes Chromium misrender the dash on a path this long (line cut off partway down the track + stray dots; GPU-config dependent, which is why Chrome hid it and Brave showed it) — removed, it was vestigial since the viewBox is 1:1 px; the gradient also moved to `gradientUnits="userSpaceOnUse"` with y2 synced in `paintPath`. (2) The draw progress was scrubbed across a pre-measured scroll range (start "top 55%" → last step "center 80%"; an earlier Brave-chasing fix had already tried retuning `endTrigger`, superseded now) — replaced with a calibration-free mapping: each scroll frame reads the track's live `getBoundingClientRect` and draws the stroke so its tip sits at 75% of the viewport height (`quickTo` chase keeps the old scrub momentum feel). Verified with wheel-driven Playwright runs: tip lands exactly at the 75% line at every step, drawn fraction hits 1.0 at step 05, `next build` clean.
- **Vercel build without env vars — FIXED (2026-08-06):** first Vercel deploy failed at "Collecting page data" because `src/lib/auth/mongodb.ts` threw on import when `MONGODB_URI` was unset (module-level check). Made the Mongo client lazy: `getClientPromise()` creates the client (and requires the URI) only on first real use; `src/auth.ts` passes the function to `MongoDBAdapter` (v3 accepts a lazy factory). Verified by building with `.env.local` removed: `next build` clean. Runtime still needs the env vars set in Vercel (all of frontend `.env.example`: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID/SECRET`, `MONGODB_URI`, `ADMIN_EMAILS`, `NEXT_PUBLIC_API_URL`) — auth routes will 500 without them, by design. Also confirmed for the client that frontend `.env.local` secrets (Mongo, Google) are server-side only in Next.js (not shipped to the browser) and are genuinely required there because Auth.js runs inside Next.js.
- **Analytics behind consent — DONE (awaiting GA ID):** `src/components/Analytics/Analytics.tsx` loads GA4 only when `NEXT_PUBLIC_GA_ID` is set AND the cookie banner was accepted (banner now stores real consent state and emits a consent event).
- **Invoice legal identity:** `backend/src/services/invoice.service.js` uses placeholder company details; swap in the client's real legal identity (ties to 1.5). STILL BLOCKED ON CLIENT.

---

## 4. Explicitly deferred / later phase (from brief §20 launch-vs-later split)

- ZH (Chinese) locale, honey product line, subscriptions, richer B2B section, extra content modules.

---

## Suggested order of attack

1. DONE: sections 2.1 to 2.7 (contact, newsletter, unsubscribe, order-confirmation seam, order-fulfilment plumbing, backend hardening, frontend gap round incl. /track page + audit tab + portal premium pass), plus the unblocked section 3 chores.
2. Chase client on the five blockers in section 1 (commerce decision is the critical path to launch); send him the Stripe recommendation in 1.1 with the Redsys/PayPal question, plus the nav-search "skip or build" question (2.7).
3. When commerce unblocks: follow the build recipe in 1.1 (checkout + webhook), then 1.2 (real catalog + public products API).
4. Unpark when ready: WhatsApp bubble + B2B end-of-shop block (2.7, both buildable with placeholders any time).
5. At deploy time: walk the `DEPLOY.md` checklist (Redis only if scaling horizontally).

---

## Decision log (client + project decisions, newest first)

- **2026-08-06** · Client request: Track-order link added to the side menu (`UnderlayNav`, `nav.track` in 5 locales) in addition to the footer, and the footer nav purged of dead links: `/history` repointed to the real `/origins` route (label stays "History"), dead `/b2b` link replaced with Journal (`footer.journal` in 5 locales; a `/b2b` page does not exist — B2B remains the top-of-shop button → contact form, block itself still parked per 2.7). Footer legal row (`/privacy`, `/cookies`, `/legal`) deliberately KEPT although the pages don't exist yet: client confirmed the footer should carry only links we have or will have, and legal pages are coming (blocked on 1.5 texts). Verified: `tsc --noEmit` + `next build` clean.

- **2026-08-06** · Frontend gap round vs. the brief PDF (2.7): built the guest /track page (5 locales, footer-linked), the admin Audit tab, and a premium pass on the customer portal (stats strip, gold keyline, row ticks). Parked by project decision: floating WhatsApp bubble and B2B end-of-shop block (both buildable with placeholders, do when unparked); nav search ON HOLD pending a "skip or build" answer from the client; signature motion ideas from brief §07 remain open options.
- **2026-08-06** · Backend hardening round (2.6): graceful shutdown + crash handlers, fail-fast prod env validation, DB-backed instant admin revocation, append-only admin audit trail, atomic order numbers, JSON-only bodies + Origin mutation guard. Deliberate trade-off logged: anon rate tier skippable via fake cookie (string check kept cheap on purpose). Structured logging, CI, 2FA and integer-cents money deferred to deploy/Stripe time.
- **2026-08-06** · Built all payment-rail-agnostic fulfilment plumbing ahead of the commerce decision (stock consumption + restock, shipped-mail stub, carrier tracking links, guest orders + public lookup — see 2.5). Guest support decided now, not after the payments choice, because the brief mandates guest checkout regardless of rail. Stripe recommendation drafted into 1.1 to put to the client.
- **2026-08-04** · Session protocol: this file is the living tracker; read at session start, updated after every session (see `CLAUDE.md`).
- **2026-08-04** · Stub cleanup: deleted unused `validator.middleware.js` and `broker/` (inline validation is the project convention; no zod/joi churn).
- **2026-08-04** · Newsletter/contact abuse control: shared `publicWrite` rate tier (5/min, `RATE_PUBLIC_WRITE_*`); subscribe/unsubscribe responses are enumeration-safe by design.
- **2026-08-03** · Backend security hardening + Journal (blog + digital museum) with admin authoring shipped.
- **2026-08-03** · Portals shipped; order data layer deliberately swappable behind `orders.service.js` pending the commerce decision; pdfkit approved for invoices; public Shop intentionally stays on static placeholders until the client confirms the catalog.
- **2026-07-31** · Auth stack: hybrid Auth.js v5 (Next, owns sessions) + Express verifying the same JWE; shared `AUTH_SECRET`; MongoDB `nostrum` db. Email flows console-stubbed until a provider (likely Resend) is chosen. Google linking permissive because Google login must never break again.
- **2026-07-30** · Feedback 2: NEVER use the em-dash in user-visible copy; journal modal delay 60s; client deferred login/portals, journal redesign, shop data, legal/contact (portals + journal since built ahead of need).
- **Open with client:** Shopify headless vs custom + Stripe (critical path); real catalog (sizes/prices/photos); email provider; Google OAuth credentials; legal texts + real contact details + WhatsApp number; invoice legal identity.
