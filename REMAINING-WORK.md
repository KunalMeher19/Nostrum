# Nostrum · Remaining Work

> Audit date: 2026-08-04. Updated 2026-08-04 after completing section 2 and the unblocked parts of section 3.
> Checked against `NOSTRUM-DESIGN.md`, client feedback rounds, and the current codebase.
> What already exists and works: auth (Auth.js v5 + Express JWE verify, Google flow built), customer portal, admin portal (orders / customers CSV / shop editor / journal authoring), Journal blog + digital museum, pdfkit invoices, orders + products + journal APIs in MongoDB, rate limiting tiers + NoSQL-injection guards + backend test suite, cookie banner with real consent state, GDPR consent on signup, contact + newsletter backends with unsubscribe, consent-gated GA4 loader, 5 locales, DEPLOY.md.

---

## 1. Blocked on client decisions (cannot build yet)

### 1.1 Commerce backend: checkout + payments (the big one)
- Checkout does not exist. `src/components/pages/CartPage.tsx` has a disabled "Checkout · coming soon" button.
- Brief requires: product list → product page → cart → checkout, **guest checkout**, Stripe (confirm Redsys / PayPal with client's bank), shipping rates, IVA/VAT.
- **Open decision (§14):** Shopify headless vs. custom + Stripe. The entire order layer was built swappable behind `backend/src/services/orders.service.js`; when the client decides, reimplement only that module.

### 1.2 Real shop catalog
- Public Shop intentionally still reads static placeholders in `src/lib/products.ts` (sizes / prices / photos / oil types unconfirmed by client).
- The MongoDB `products` collection + admin shop editor is ready to become the source of truth once real data arrives. Task then: point the public Shop at the products API.

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
- `orders.service.createOrder()` is the creation seam; it fires `sendOrderConfirmation` (console stub). Checkout must create orders through it when it lands.

---

## 3. Pre-launch hardening / deployment chores

- **Redis for rate limiting — DONE (env-gated):** set `REDIS_URL` and all limiter tiers share buckets via rate-limit-redis (`backend/src/db/redis.js`); unset = in-memory as before.
- **Shared validator layer — RESOLVED:** deleted the empty `validator.middleware.js` stub; inline validation is the project convention across all routes.
- **`broker/broker.js` — RESOLVED:** deleted (unused).
- **Deployment config — DOCUMENTED:** see `DEPLOY.md` (env reference for both apps + launch checklist). Actual values set at deploy time.
- **Analytics behind consent — DONE (awaiting GA ID):** `src/components/Analytics/Analytics.tsx` loads GA4 only when `NEXT_PUBLIC_GA_ID` is set AND the cookie banner was accepted (banner now stores real consent state and emits a consent event).
- **Invoice legal identity:** `backend/src/services/invoice.service.js` uses placeholder company details; swap in the client's real legal identity (ties to 1.5). STILL BLOCKED ON CLIENT.

---

## 4. Explicitly deferred / later phase (from brief §20 launch-vs-later split)

- ZH (Chinese) locale, honey product line, subscriptions, richer B2B section, extra content modules.

---

## Suggested order of attack

1. DONE: sections 2.1 to 2.4 (contact, newsletter, unsubscribe, order-confirmation seam), plus the unblocked section 3 chores.
2. Chase client on the five blockers in section 1 (commerce decision is the critical path to launch).
3. At deploy time: walk the `DEPLOY.md` checklist (Redis only if scaling horizontally).

---

## Decision log (client + project decisions, newest first)

- **2026-08-04** · Session protocol: this file is the living tracker; read at session start, updated after every session (see `CLAUDE.md`).
- **2026-08-04** · Stub cleanup: deleted unused `validator.middleware.js` and `broker/` (inline validation is the project convention; no zod/joi churn).
- **2026-08-04** · Newsletter/contact abuse control: shared `publicWrite` rate tier (5/min, `RATE_PUBLIC_WRITE_*`); subscribe/unsubscribe responses are enumeration-safe by design.
- **2026-08-03** · Backend security hardening + Journal (blog + digital museum) with admin authoring shipped.
- **2026-08-03** · Portals shipped; order data layer deliberately swappable behind `orders.service.js` pending the commerce decision; pdfkit approved for invoices; public Shop intentionally stays on static placeholders until the client confirms the catalog.
- **2026-07-31** · Auth stack: hybrid Auth.js v5 (Next, owns sessions) + Express verifying the same JWE; shared `AUTH_SECRET`; MongoDB `nostrum` db. Email flows console-stubbed until a provider (likely Resend) is chosen. Google linking permissive because Google login must never break again.
- **2026-07-30** · Feedback 2: NEVER use the em-dash in user-visible copy; journal modal delay 60s; client deferred login/portals, journal redesign, shop data, legal/contact (portals + journal since built ahead of need).
- **Open with client:** Shopify headless vs custom + Stripe (critical path); real catalog (sizes/prices/photos); email provider; Google OAuth credentials; legal texts + real contact details + WhatsApp number; invoice legal identity.
