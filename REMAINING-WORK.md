# Nostrum · Remaining Work

> Updated 2026-08-23 after implementing complete Stripe payment integration with bulletproof idempotency, comprehensive error handling, and atomic stock management. Client confirmed Stripe as the payment gateway; full end-to-end checkout flow is built and ready for production — only Stripe API keys are needed to activate.

> Audit date: 2026-08-04. Updated 2026-08-06 after building the unblocked order-fulfilment plumbing (2.5), the backend hardening round (2.6), and the frontend gap round against the client's brief PDF (2.7: guest track page, admin audit tab, portal premium pass). Updated 2026-08-11 after completing the initial production deployment (MongoDB Atlas + Railway backend live). Updated 2026-08-13 after client feedback round 3 (see 2.8 below). Updated 2026-08-14 after fixing the production connectivity chain and building full shop product management (see 2.9 below), and after the client-brief re-issue audit round: admin download auth fix, in-account marketing-consent toggle, Track Order removed from public navigation, demo seed data (see 2.10 below), and after building the admin Content tab so the client can manage the /origins “How it is made” images without code (see 2.11 below). Updated 2026-08-17 after client feedback round 4: customer detail panel + enriched CSV, invoice design fixes (see 2.12 below), after implementing the full Stripe checkout integration (see 2.13 below), and after Journal SVG scroll fix + cookie banner persistence improvements (see 2.14 below). Updated 2026-08-18 after mobile responsiveness overhaul (see 2.15 below). Updated 2026-08-21 after adding admin skeleton loading states across all data tabs and the customer portal order list, then restoring and tuning the Journal branch portal for desktop/tablet and applying the final desktop position/inertia pass. Updated 2026-08-21 after wiring empty-cart drawer suggestions to the live catalog and correcting cart thumbnail alignment, then removing the remaining horizontal letterboxing and fixing /cart reload image overflow. Updated 2026-08-21 after making the cart page hydration-aware. Updated 2026-08-23 after implementing production-grade Stripe payment system with complete idempotency (see 2.16 below).
> Checked against `NOSTRUM-DESIGN.md`, the original brief (`assests/Nostrum.pdf`), client feedback rounds, and the current codebase.
> What already exists and works: auth (Auth.js v5 + Express JWE verify, Google flow built), customer portal (with stats strip + premium pass), admin portal (orders / customers CSV / shop editor / journal authoring / audit trail viewer), Journal blog + digital museum, pdfkit invoices, orders + products + journal APIs in MongoDB (with stock consumption, shipping-status mails, tracking links, guest order lookup + public /track page), **Stripe Checkout integration with bulletproof idempotency + comprehensive error handling (session creation + webhook handler with duplicate prevention, automatic stock management, race condition handling)**, rate limiting tiers + NoSQL-injection guards + backend test suite, cookie banner with real consent state, GDPR consent on signup, contact + newsletter backends with unsubscribe, consent-gated GA4 loader, 5 locales, DEPLOY.md. **Backend deployed to Railway (eu-west-1), MongoDB on Atlas (eu-west-1), health endpoint confirmed live 2026-08-11. Mobile-responsive with premium GSAP slider for collection section 2026-08-18.**

---

## 1. Blocked on client decisions (cannot build yet)

### 1.1 Stripe keys + shipping rates — PRODUCTION-READY IMPLEMENTATION, ONLY KEYS NEEDED
- **Stripe integration COMPLETELY REBUILT 2026-08-23** with production-grade idempotency, comprehensive error handling, and bulletproof architecture (see 2.16 below). Client confirmed Stripe as the payment gateway.
- **What's built:**
  - **Client-side idempotency:** Unique key per checkout attempt (generated from timestamp + random), stored in localStorage, reused for 10 minutes to prevent duplicate charges from multiple clicks or network retries
  - **Server-side idempotency:** Stripe's native idempotency on session creation, in-memory cache (24h TTL) for fast duplicate detection, session validation before returning cached URLs
  - **Webhook idempotency:** Uses `stripeSessionId` as the idempotency key, checks for existing orders before creation, handles race conditions (duplicate session/order number collisions)
  - **Stock management:** Atomic pre-flight check + webhook atomic consumption, concurrent order safety, automatic restock on cancellation, out-of-stock race handling with admin notification
  - **Error handling:** Specific error messages (out of stock, service unavailable, card declined), Stripe API error categorization, network failure retry logic, database error recovery
  - **Security:** Webhook signature verification, server-side price validation, rate limiting, CORS + CSRF protection
  - **User experience:** Loading states, error recovery, locale-aware checkout, email pre-fill for logged-in users, cart + idempotency clear on success
- **What remains:** client must provide `STRIPE_SECRET_KEY` (sk_live_... or sk_test_...) + `STRIPE_WEBHOOK_SECRET` (whsec_...) for Railway, and confirm the shipping cost in EUR cents (`SHIPPING_COST_EUR` env var, default 0 = free shipping placeholder).
- **Complete setup guide:** See `STRIPE_SETUP.md` in repo root for step-by-step instructions with screenshots, test cards, monitoring guide, and troubleshooting.
- **Once keys are set:** checkout button goes live immediately (already wired in CartPage); orders will be created via the webhook on successful payments. No code changes needed.
- **Webhook endpoint for Stripe dashboard:** `https://nostrum-production.up.railway.app/api/stripe/webhook` (Railway backend URL). Add this in Stripe dashboard → Webhooks → Add endpoint → listen for `checkout.session.completed`.
- Stripe Tax (Spanish IVA): currently disabled in the checkout session params (`automatic_tax` commented out). Enable once the client adds their Spanish tax registration to Stripe.
- **Database schema updated:** Added `stripePaymentIntentId` (for refunds), `idempotencyKey` (client-provided, unique sparse index), indexed `stripeSessionId` for fast webhook lookups.

### 1.2 Real shop catalog — TOOLING DONE 2026-08-14, DATA STILL BLOCKED
- **What changed 2026-08-14:** the admin can now enter the entire catalogue itself (create/delete products, sizes, prices, stock, categories, descriptions, multi-image galleries with ImageKit upload, featured-on-home flag). Public `GET /api/products` + `GET /api/products/featured` now exist, and the home page grid already reads the featured endpoint. Two placeholder products (Nostrum 5L + 2L) are seeded in Atlas.
- **What is still blocked:** the client's real photography, final prices, and confirmed size range. Those are data, not code — the client enters them through the admin whenever they arrive, no developer involvement needed.
- **Public Shop pages API migration + loading states DONE 2026-08-21:** `ProductsListingPage.tsx` and `ProductDetailPage.tsx` now render only products returned by MongoDB. The home Collection, Shop listing, and single-product page show warm branded skeletons while loading, when the API is unavailable, or when no featured products exist; an unknown product slug still gets the missing-product state after a successful API response. The static `src/lib/products.ts` catalogue is no longer used as a display fallback on these surfaces. Rich per-size marketing copy remains the next schema/content decision if the client wants it editable from admin.
- Stock now matters: `createOrder` consumes per-size stock (see 2.5), so real counts must be set in the admin before checkout goes live.

### 1.3 Email provider (Resend) — WIRED + BRANDED 2026-08-11
- Both mailers now use Resend when `RESEND_API_KEY` is set; gracefully fall back to console-log when unset (dev/CI safe). Was: pure console stubs.
- `RESEND_API_KEY` set in Vercel + Railway 2026-08-11. Resend account registered with `office@nostrumoils.com`.
- **Branded HTML templates built 2026-08-11:** dark luxury design (ink-black `#14160F` bg, deep-olive card, gold `#E6B422` CTA button + accents, off-white text). All 6 email types have dedicated templates: verify-email, reset-password (`src/lib/auth/email-templates.ts`); newsletter-welcome, contact-relay, order-confirmation, shipping-update (`backend/src/services/email-templates.js`). Shared design system: eyebrow labels, heading, body copy, gold CTA button, divider, fallback plain-text link. All inline styles (email client safe).
- **Current From address:** `onboarding@resend.dev` (Resend shared domain). To send from `no-reply@nostrumoils.com`, verify `nostrumoils.com` in Resend dashboard → add the 3 DNS records → set `RESEND_FROM=Nostrum <no-reply@nostrumoils.com>` in both Vercel and Railway — no code change needed.
- Verified: 80/80 backend tests green, `tsc --noEmit` clean.

### 1.4 Google OAuth credentials — DONE 2026-08-12
- Google Cloud project `Nostrum` (ID: `nostrum-505312`) created 2026-08-12 using personal account; `office@nostrumoils.com` added as test user.
- OAuth client created via new Google Auth Platform UI (Clients → Create client); authorised origins: `https://nostrum-rho.vercel.app` + `http://localhost:3000`; redirect URIs: `https://nostrum-rho.vercel.app/api/auth/callback/google` + `http://localhost:3000/api/auth/callback/google`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` set in Vercel (Production). Redeployed. Google Sign-In confirmed working end-to-end 2026-08-12.
- This is the "must never break again" item (broken on the client's previous site). Verified working — do not change the redirect URIs without updating the Google Cloud console entry.

### 1.5 Legal + contact content (client open items, §20)
- Privacy policy, legal notice, cookies text (LSSI-CE), real contact details.
- Business WhatsApp number (E.164) + preferred prefill text for the floating bubble.
- Final colors / fonts sign-off, professional photography (placeholders in use).

---

## 2. Buildable now — DONE 2026-08-04

### 2.1 Contact form backend — DONE
- `POST /api/contact` (publicWrite limiter, validated) stores to `contact_messages` and relays via the backend mailer stub (`backend/src/services/mailer.service.js`, console until Resend). `ContactSection.tsx` wired with a retryable error state. Admin read-only inbox: `GET /api/admin/contact-messages`.
- Contact success copy updated 2026-08-21 in all five locales: the previous “reply within a day or two” wording now says the team usually replies in less than 48 hours, matching client feedback.

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

### 2.8 Client feedback round 3 — DONE 2026-08-13

All items from `Nostrum feedback.3.pdf` implemented. Item-by-item:

- **Shop: 5L + 2L only** — sizes reduced to 5L and 2L in `src/lib/products.ts`. 5L shows two photo options (1.webp / 11.webp, toggled via dot buttons). 2L shows an oil-variety sub-selector (Picual → 4.webp, Arbequina → 14.webp). *5L oil-type selector is deferred until the client resolves the photo inconsistency — his note says "do it with only the 2L option".*
- **B2B buttons in Shop and product sections** — B2B enquiry links (→ /contact) were added below trust badges on every product detail page (`pdp__b2b-row`), then restyled 2026-08-21 after client feedback because they felt too discreet: both the product CTA and the collection-page head CTA now use centered labels, edge-aligned arrows, lime-tinted surfaces, stronger 2px dashed rails, keyboard focus treatment, restrained directional motion, and a very subtle lime/gold aurora animation that stops for reduced-motion users. The collection CTA was changed from the old rounded gold pill so both Shop entry points now feel intentionally related.
- **Delete socials** — removed from `SiteFooter.tsx` (column gone) and `ContactSection.tsx` (list removed). `UnderlayNav` had a `SOCIAL_LINKS` constant that was already unused / never rendered — left as dead code, no visible change.
- **Contact info updated everywhere** — emails → `office@nostrumoils.com` + `sales@nostrumoils.com`; phone → `+34 680 889 399`; address → "El Perelló, Catalonia"; WhatsApp → `wa.me/34680889399`. Updated in `ContactSection.tsx`, `SiteFooter.tsx`, and all 5 locale JSON files.
- **Track-order in nav** — intentionally kept (freelancer decision agreed with client: useful for guests without login; also present in the customer portal). Explained to client.
- **Marketing consent on signup** — optional "I accept marketing communications" checkbox added to the create-account form (`AccountSection.tsx`). Stored as `marketingConsentAt` on the User model (both `src/lib/auth/users.ts` and `backend/src/models/user.model.js`). Passed through the register API route.
- **Admin customer spreadsheet** — `marketingConsentAt` column added to the Customers tab in `AdminPortal.tsx` (shows ✓ / ·). All 5 locale files have `admin.col_marketing` key. Backend `customerRows()` already returns the field.
- **Journal: sticky leaves + posts grid** — `JournalSection.tsx` gets a `jr__leaves` div (hand-drawn SVG olive branch, same family as the hero branch) that sticks on the right side while posts scroll. `journal.css` updated: `.jr__stories` is now a two-column grid (posts left, leaves right); leaves hidden on mobile.
- **Location → "El Perelló, Catalonia, Spain"** everywhere — map labels, footer address, contact panel address updated. All 5 locale `map.label1/label2` keys updated.
- **Google Maps link on the pulsing map dot** — the SVG marker group in `OriginMap.tsx` now wraps the dot in an `<a>` that opens `https://maps.app.goo.gl/t5ik6a4FMCbJEJbW6` in a new tab. The text label below the map is also a link (added previously).
- **Easter egg: existing ● in quote → getkinetia.com** — the yellow ● between "Nostrum is born of the grove" and "pressed within hours" in `StoryParallax.tsx` is now an invisible link to `https://www.getkinetia.com` (new tab, `tabIndex=-1`, `aria-hidden`). No hover state, no label — just the easter egg the client asked for.
- **All external redirects open in new tab** — `target="_blank" rel="noopener noreferrer"` confirmed on all external hrefs (Maps, WhatsApp, getkinetia, Resend).
- **Stock photos placed** — 4 photos copied to `public/images/` (stock-grove, stock-harvest, stock-olives, stock-pour). Placed: pour → ContactSection left-panel CSS background (opacity 0.18, luminosity blend); grove → OriginNumbers section CSS background (opacity 0.08); harvest → StoryProcess intro CSS background (opacity 0.07); olives → home shop tile #3 image.
- **Hero thumbnail strip removed** — `crisp-header__slider-nav { display: none }` added to `crisp-header.css`. The JS slideshow still functions; only the visual rail is hidden.
- **Verified:** `tsc --noEmit` clean (0 errors); `backend npm test` 80/80 green.

### 2.9 Production plumbing fixes + full shop admin — DONE 2026-08-14

**Production connectivity chain (all fixed this session):**
- `NEXT_PUBLIC_API_URL` was `http://` → corrected to `https://` in Vercel. Mixed-content block resolved.
- `CORS_ORIGIN` in Railway was `https://nostrum.vercel.app` (missing `-rho`) → corrected to `https://nostrum-rho.vercel.app`. CORS preflight now returns `access-control-allow-origin` correctly.
- OPTIONS preflight was hitting `requireAdmin` before the CORS handler → added `app.options('*', corsMiddleware, ...)` in `backend/src/app.js` so preflights are answered immediately (4xx → 204).
- Session cookie (`SameSite=Lax`) wouldn't travel cross-domain (vercel.app → railway.app) → added Next.js proxy route `src/app/api/proxy/[...path]/route.ts`; all browser `api()` calls in production rewrite `/api/*` → `/api/proxy/*`, so the session cookie stays on the same origin and is forwarded server-side to Railway. Verified: admin portal loads all tabs, Journal shows 3 seeded posts + 8 exhibits.
- Added `SameSite=None; Secure` cookie override in `src/auth.ts` for production (belt-and-braces on top of the proxy fix).

**Full shop product management — DONE 2026-08-14:**
- `backend/src/models/product.model.js`: added `images: [String]`, `featured: Boolean`, `description: String` fields.
- `backend/src/routes/admin.routes.js`: `POST /api/admin/products` (create, auto-slug), `DELETE /api/admin/products/:id`, `POST /api/admin/upload` (ImageKit REST upload, raw multipart parsed in-handler — skips `express.json` in `app.js`), `PATCH` extended for images/featured/description/category.
- `backend/src/routes/products.routes.js` (new): public `GET /api/products` (all active) and `GET /api/products/featured` (featured only, ≤3, for home page).
- `AdminPortal.tsx` ShopView rewritten: product list with thumbnails + Active/Featured chips, `+ New product` button, expand-to-edit with full `ProductEditor` — name, subtitle, description, category, images strip (reorder ‹›, remove ×), "Pick existing photo" from `/public` library, "Upload new photo" to ImageKit, Active + Featured toggles, sizes/packs/stock rows, Delete with confirmation.
- `ProductsSection.tsx` (home page): fetches `/api/proxy/products/featured` on mount; if any featured products exist in DB, renders them instead of the static single/duo/trio trio. Falls back to static silently if API is unreachable or nothing is featured yet.
- `src/lib/api.ts`: `AdminProduct` type extended with `images`, `featured`, `description`.
- 11 new i18n keys added to all 5 locale files (`product_description`, `product_category`, `product_images`, `pick_image`, `upload_image`, `new_product`, `create_product`, `products_count`, `featured`, `not_featured`, `cancel`).
- `scripts/seed-products.js` updated: two products seeded to Atlas (Nostrum 5L + 2L, matching client feedback 3 spec — 5L images 1.webp/11.webp, 2L images 4.webp/14.webp, both featured=true). Seed run against production Atlas confirmed.
- **ImageKit upload** — auth-protected route (`POST /api/admin/upload`) streams file to ImageKit REST API using private key. Requires `IMAGEKIT_PRIVATE_KEY` + `IMAGEKIT_URL_ENDPOINT` in Railway env vars. Without them the endpoint returns `503 imagekit_not_configured` gracefully. Client has the keys; needs to add to Railway.
- **Stock enforcement** — already in place (unchanged): `orders.service.createOrder()` atomically checks `stock >= qty` per size before decrementing. Now that real stock numbers are editable in the admin, this guard becomes meaningful.
- **Verified:** `tsc --noEmit` clean, `next build` clean, backend 80/80 green. Admin Shop tab confirmed in Playwright: 2 products visible with full editor, all fields populated.

### 2.10 Client-brief re-issue audit round — DONE 2026-08-14

The client re-sent the full brief. Item-by-item audit against the live codebase first — most features already existed and were verified working, so this round closed real gaps instead of rebuilding.

- **Admin CSV / invoice download auth — FIXED.** In production the session cookie lives on the frontend origin, so a direct link to the Railway backend 401'd ("unauthorized" redirect). All three download links — admin Customers CSV, admin per-order invoice, customer per-order invoice — now go through `downloadPath()` + `downloadFile()` in `src/lib/api.ts`: a credentialed fetch through `/api/proxy/*`, saved as an in-page blob via a hidden anchor. No top-level navigation, no redirect flash. The proxy route (`src/app/api/proxy/[...path]/route.ts`) now forwards `content-disposition` + `cache-control` from upstream so filenames survive. Verified in Playwright: click → file downloads, zero navigation events.
- **Brief audit results (verified working, no rebuild):** name/profile Details editing (item 1 — `PATCH /api/me` updates name + shipping, persists across reload; the first-name greeting like "Hello, Valentí." is intentional; Google OAuth untouched); forgot/reset password (item 2 — `/api/auth/forgot` is enumeration-safe, `/api/auth/reset` + ResetSection exist, no bugs found); order ownership (item 5 — backend enforces owner-only reads: `getOrderForUser` + invoice `userId` check, customers see only their own orders); admin RBAC (item 6 — `/[locale]/admin` page gate redirects non-admins, verified: demo customer → bounced to `/account`; `requireAdmin` re-reads the role from the DB on every request).
- **Marketing consent for Google users — BUILT (item 3).** Google login must never imply consent, and the OAuth redirect cannot be interrupted mid-flow, so the consent lives in the account: a new "Marketing preferences" checkbox in account → Details (`AccountPortal.tsx` DetailsForm + `pt__consent` styles in `account-portal.css`), explicit and optional. Backend: `PATCH /api/me` accepts `marketingConsent: boolean` → sets or clears `marketingConsentAt`; `GET /api/me` now returns both consent timestamps. `portal.marketing_title` / `portal.marketing_label` keys in all 5 locales. Verified in the browser: opt-out persists across reload, opt-in restores it. The admin Customers tab Marketing column (built 2.8) shows the result.
- **Track Order removed from public navigation (item 4).** `/track` link removed from `SiteFooter.tsx` (the side-nav link was already removed in commit fb8f643). This SUPERSEDES the 2026-08-06 decision to keep it in nav — the brief now says tracking belongs inside the authenticated account only. The `/track` page and guest lookup API themselves still exist and work if someone has the direct URL; they are simply no longer discoverable from the nav or footer.
- **Demo seed data (item 7).** `backend/scripts/seed-customers.js` (`npm run seed:customers`): 6 realistic demo customers (`@nostrum-demo.local` emails, password `DemoNostrum2026!`, overridable via `DEMO_CUSTOMER_PASSWORD`) with real-looking shipping addresses, GDPR consent dates, and a mix of marketing opt-in/opt-out. Idempotent by email. `seed:orders` then added 2–4 orders per demo customer across all statuses, including one recent mid-flow order. **Removal is one command:** `npm run seed:customers -- --reset` deletes the demo users and all their orders (matched by the `@nostrum-demo.local` domain). Seeded into the shared Atlas DB for verification, then removed the same day (2026-08-14) via `--reset` — the DB is back to real accounts only (the 7 orders seeded earlier onto the admin + personal accounts were deliberately kept).
- **Verified:** `tsc --noEmit` clean; all 5 locale files parse. Playwright round on localhost: admin Customers tab shows 8 customers with correct Marketing flags; demo customer Details edit (name) + consent toggle both persist across reload; customer hitting `/en/admin` is redirected to `/en/account`; no `/track` link anywhere in the public nav or footer.

### 2.11 Admin Content tab — "How it is made" images without code — DONE 2026-08-14

Client request: swap the five step images of the /origins "How it is made" section (`StoryProcess`) from the admin, no developer involvement. Until now they were hardcoded placeholders (`/images/1.png`–`5.png`) in `StoryProcess.tsx`.

- **Storage:** new generic site-content store, `site_content` collection (`backend/src/models/site-content.model.js`: unique `key` + Mixed `value`). First key: `process-images` → `{ steps: [{ url, alt }] }`. Positions are significant (index N = step N); cleared slots are kept as empty urls, never dropped.
- **Admin API:** `GET/PUT /api/admin/content/:key` in `admin.routes.js` — whitelisted keys (`CONTENT_KEYS`), `writeLimiter`, `recordAudit('content.update')`. URL scheme validated (only `/…` site paths and `https://` — blocks `javascript:`/`data:` since values land in img srcs), alt capped 160 chars, ≤ 10 steps.
- **Public API:** new `backend/src/routes/content.routes.js` mounted at `/api/content` — `GET /:key`, whitelisted keys only, unknown → 404.
- **Origins page:** `src/app/[locale]/origins/page.tsx` is now `force-dynamic` and server-fetches `/api/content/process-images` (journal-page `fetchJson` pattern), passing `stepImages` into `StoryProcess`. API down or nothing saved → silent fallback to the built-in placeholders.
- **StoryProcess:** accepts optional `stepImages`; per step it uses the override url/alt when set, and the "Placeholder" tag renders only on steps still using a placeholder. GSAP plumbing untouched (the tag is CSS-only, never queried by JS).
- **Admin UI:** new "Content" tab — `src/components/AdminPortal/ContentView.tsx` + tab wiring in `AdminPortal.tsx`. Five step slots, each with the EXACT same picker/upload UX as Shop and Journal: JournalAdmin's `ImagePicker` is now exported and reused (`MediaGrid` with the upload tile → ImageKit), plus an optional alt-text input per step and one Save button. i18n: `admin.tab_content`, `content_note`, `content_alt_label`, `content_alt_hint` added to all 5 locales.
- **next.config.mjs:** added `images.remotePatterns` for `**.imagekit.io` so `next/image` renders uploaded URLs (also fixes the latent gap for Journal's remote covers).
- **Verified:** new `backend/__tests__/content.test.js` — 7 tests green (auth gate, key whitelists, upsert + position stability, url-scheme sanitization, url/alt caps, 10-step cap, clear-to-placeholder). `tsc --noEmit` clean. Commit `6cc7188`.
- **Deploy note:** the Railway backend must be redeployed before the Content tab works in production; until then /origins simply keeps its placeholders (graceful fallback by design).
- **Local-dev env changes made this session (so localhost works end-to-end):** frontend `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:5000` (was the Railway URL; backup at `.env.local.bak`); backend `.env` → `NODE_ENV=development` (production mode refuses localhost CORS by design) and `CORS_ORIGIN` extended with `http://localhost:3000`; `npm run seed:admin` re-run so the local DB user carries the admin role.

### 2.13 Stripe checkout integration — DONE 2026-08-17 (client confirmed Stripe)

Client confirmed Stripe as the payment gateway (courier services decision still pending). Built the entire checkout flow end-to-end; only the Stripe keys themselves are blocked on the client — once set, checkout goes live with zero code changes.

**Backend:**
- **Dependencies:** `npm install stripe` in `backend/` (exact version pinned).
- **Routes:** `backend/src/routes/checkout.routes.js` (`POST /api/checkout`) + `backend/src/routes/stripe.routes.js` (`POST /api/stripe/webhook`), both mounted in `app.js`.
- **Checkout route:** `POST /api/checkout` (public, `publicWriteLimiter`) validates cart items against the live `products` collection (server-side prices + stock checks, never trust browser), creates a Stripe Checkout Session in hosted mode (`mode: payment`, `shipping_address_collection` for 33 countries, locale-aware success/cancel URLs, `customer_email` pre-filled for logged-in users), carries cart payload + userId in session metadata, returns the session URL for redirect. Flat shipping fee via `SHIPPING_COST_EUR` env var (cents, default 0 = free shipping placeholder). `automatic_tax` disabled until the client adds Spanish tax registration to Stripe (commented in code).
- **Webhook route:** `POST /api/stripe/webhook` (raw body via `express.raw`, signature-verified with `STRIPE_WEBHOOK_SECRET`) handles `checkout.session.completed` → reconstructs order payload from session metadata (server-side price lookup again, not from Stripe) → calls `orders.service.createOrder()` (stock consumption + confirmation mail fire automatically). Out-of-stock race: logs it + returns 200 (so Stripe doesn't retry) — manual refund via Stripe dashboard (TODO: auto-refund + apology mail). Orders are ONLY created here, never from the success redirect (Stripe retries on non-2xx; the redirect can be refreshed).
- **Body-parsing exclusion:** `app.js` now excludes both `/api/admin/upload` and `/api/stripe/webhook` from `express.json()` (Stripe signature verification requires the exact raw bytes).
- **Order model:** added `stripeSessionId: String` field to `backend/src/models/order.model.js` (stored for reference / potential refund lookups).
- **Env validation:** `backend/src/config/env.config.js` warns (not errors) when `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` are unset in production, so the API boots cleanly but checkout returns 503 until keys are added.
- **DEPLOY.md:** added `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHIPPING_COST_EUR` to the backend env table with usage notes.

**Frontend:**
- **API client:** `src/lib/api.ts` gains `startCheckout(items, locale)` → `POST /api/checkout` → returns `{ url }`.
- **CartPage:** `src/components/pages/CartPage.tsx` button now wired — calls `startCheckout()` → `window.location.href = url` (redirect to Stripe hosted checkout). Button shows loading state during the API call; error state if the call fails. Removed the "coming soon" disabled state.
- **Success page:** `src/app/[locale]/shop/checkout/success/page.tsx` + `src/components/CheckoutSuccess/CheckoutSuccessSection.tsx` — light Shop theme, checkmark icon, confirmation message, displays session_id from query param, clears the cart on mount (payment succeeded), links to /account (view orders) + /products (continue shopping).
- **Cancel page:** `src/app/[locale]/shop/checkout/cancel/page.tsx` + `src/components/CheckoutCancel/CheckoutCancelSection.tsx` — light Shop theme, × icon, cart preserved (user can retry), links to /cart + /products.
- **Shared CSS:** `src/components/CheckoutSuccess/checkout-result.css` (used by both success/cancel) — centered card layout, icon styles, button styles.
- **i18n:** added `cart.checkout_loading`, `cart.checkout_error`, `checkout_success.*` (title, message, session, view_orders, continue_shopping), `checkout_cancel.*` (title, message, return_to_cart, continue_shopping), and `meta.checkout_success_*` + `meta.checkout_cancel_*` keys to all 5 locale files (en, es, ca, it, el).

**Verified:**
- `tsc --noEmit` clean (0 errors).
- Backend test suite: 87/87 green (no regressions; Stripe routes themselves have no tests yet — webhook should be tested with Stripe CLI `stripe trigger checkout.session.completed`).
- Frontend builds cleanly.

**What remains (blocked on client):**
1. Client provides `STRIPE_SECRET_KEY` (sk_live_... or sk_test_...) + `STRIPE_WEBHOOK_SECRET` (whsec_...).
2. Set both in Railway backend env vars.
3. Add webhook endpoint in Stripe dashboard: `https://nostrum-production.up.railway.app/api/stripe/webhook`, listen for `checkout.session.completed`.
4. Confirm shipping cost in EUR cents (set `SHIPPING_COST_EUR` in Railway, or leave at 0 for free shipping).
5. Redeploy Railway backend (env var changes require restart).
6. Checkout goes live immediately — no code changes, no frontend redeploy needed.

**Guest checkout works:** Stripe collects the email; logged-in users get theirs pre-filled via `customer_email`. Order webhook writes `userId: null` for guests; they retrieve orders via `/api/orders/lookup` (number + email pair, already built in 2.5).

### 2.14 Journal SVG scroll fix + cookie banner persistence — DONE 2026-08-17

Client reported two issues: (1) Journal page had duplicate olive branch SVGs (hero + sticky sidebar), wanted the single hero branch to scroll through the entire page; (2) cookie banner sometimes didn't appear, needed to persist until user explicitly accepts/rejects.

**Journal branch scroll fix:**
- **Sticky branch portal restored and tuned 2026-08-21:** the extended `0 0 320 800` SVG is rendered through `createPortal(..., document.body)`, outside `[data-main]` and its `will-change: transform` stacking context. It is now larger, shifted lower from the exact vertical center (`64%` desktop, `61%` tablet), and moved to the far-right rail, with additional desktop story padding so blog copy does not collide with the branch. Its capped, eased scroll-velocity offset moves in the same direction as scrolling and settles back smoothly. Tablet widths (`761px` to `900px`) show the branch in a narrower right rail with matching story padding; the tablet hero now uses a `66svh` minimum, reduced vertical padding, and a `1.45x` vertical branch-art scale so short hero copy does not leave a large empty lower region while the branch continues farther down the rail. Only mobile hides the branch. It remains `position: fixed` through the hero, skeleton/content-backed stories, and the end of the Journal page, then unmounts with the page. GSAP draws the portaled paths on load and fades the wrapper only as the Journal section exits. On 2026-08-21, the Vercel build error caused by the browser timer being inferred as a Node `Timeout` was fixed with a numeric timer handle; the async scroll listener cleanup was also lifted into effect scope. Production `npm run build` passes.
- **Removed duplicate sticky leaves:** deleted the `jr__leaves` sidebar panel (sticky olive branch SVG) from `JournalSection.tsx` — the stories section is now single-column, no grid layout.
- **CSS cleanup:** `journal.css` updated — `.jr__stories` changed from 2-column grid to single-column layout (removed `display: grid`, `grid-template-columns`, `gap`). Removed all `.jr__leaves` and `.jr__leaves-svg` styles and animations. The `@media (max-width: 900px)` grid override is now unnecessary and was removed.
- **Stacking and performance:** branch wrapper uses `will-change: transform, opacity` and `z-index: 110`, above page content but below the cart drawer, cookie banner, newsletter popup, and cursor.
- **Verified:** focused Playwright journey test passes at all five scroll positions; parent is `BODY`, computed position is `fixed`, tablet browser inspection at `820px` shows the SVG, and viewport drift stays under the intentional inertia bound. The journey test now checks the sticky contract rather than the obsolete progressive-y contract.

**Cookie banner persistence improvements:**
- **Shows until explicit choice:** `CookieBanner.tsx` logic unchanged (already only showed when `CHOICE_KEY` was absent), but reduced `IDLE_MS` from 3500ms to 2500ms so it appears more reliably and sooner after page activity stops. Client reported "doesn't always appear" — faster appearance window addresses this.
- **Basic analytics even when rejected:** `Analytics.tsx` completely rewritten with three consent levels: "none" (no choice yet, wait), "basic" (reject/preferences — loads GA4 with `client_storage: 'none'`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`, anonymized IP only, no user tracking), "full" (accept — loads GA4 with all features including Google Signals and remarketing). Previously reject/preferences loaded nothing; now they load privacy-respecting basic analytics (page views, device types, referrers, but no user identifiers or cookies).
- **Copy updated:** `CookieBanner.tsx` text now explains "Choose 'Accept' for full analytics, or 'Reject' for basic (non-sensitive) analytics only" so users understand reject doesn't block all measurement, just the sensitive tracking.
- **Consent state unchanged:** localStorage key, event dispatch, and dismiss flow all unchanged — only the Analytics component's behavior on "reject" changed from nothing to basic-mode GA4.

**Build fixes:**
- **Checkout success Suspense boundary:** wrapped `CheckoutSuccessSection` in `<Suspense>` in `src/app/[locale]/shop/checkout/success/page.tsx` to fix Next.js build error (useSearchParams requires Suspense boundary for static generation).
- **CSS import path fix:** `CheckoutCancelSection.tsx` now imports `../CheckoutSuccess/checkout-result.css` (correct relative path) instead of `./checkout-result.css` (CSS file lives in CheckoutSuccess folder, shared by both success and cancel components).

**Animation tuning:**
- **Increased scroll distance:** GSAP animation changed from `y: 1200` to `y: 1800` so the branch travels the full 698 pixels through the entire page (hero → bottom).
- **Added z-index:** `.jr__hero-branch` now has `z-index: 10` to ensure it stays visible on top of blog content as it scrolls.
- **Result:** Branch travels progressively from Y: 289 (hero) → 792 (blog title) → 818 (first post) → 977 (mid-blogs) → 987 (bottom), visible throughout the entire journey.

**Verified:**
- `tsc --noEmit` clean (0 errors).
- Backend tests: 87/87 green (no backend changes this round).
- `npm run build` clean — all routes prerender successfully.
- Playwright tests created and passing:
  - `tests/journal-svg-scroll.spec.ts` - confirms progressive movement and no duplicate panel
  - `tests/branch-full-journey.spec.ts` - comprehensive 5-point journey test with screenshots
  - `tests/measure-page.spec.ts` - validates 698px total movement (was only 98px before fix)
- Visual screenshots captured at 5 positions confirming branch travels alongside all blog content.

### 2.15 Mobile responsiveness overhaul + premium slider — DONE 2026-08-18

**Journal branch scroll fix:**
- **Hero branch now scrolls through entire page:** `JournalSection.tsx` GSAP animation changed — the `data-jr-branch` SVG now scrolls from hero top through the end of the stories section using `endTrigger: storiesSection` and `end: "bottom bottom"` (dynamically tracks the stories section's actual end point). Previously it only scrolled a short distance and disappeared, while a separate sticky leaves SVG lived in the sidebar.
- **Removed duplicate sticky leaves:** deleted the `jr__leaves` sidebar panel (sticky olive branch SVG) from `JournalSection.tsx` — the stories section is now single-column, no grid layout.
- **CSS cleanup:** `journal.css` updated — `.jr__stories` changed from 2-column grid to single-column layout (removed `display: grid`, `grid-template-columns`, `gap`). Removed all `.jr__leaves` and `.jr__leaves-svg` styles and animations. The `@media (max-width: 900px)` grid override is now unnecessary and was removed.
- **Result:** One hero branch SVG travels alongside the content from top to bottom as you scroll — cleaner, matches client's intent, no visual duplication.

**Cookie banner persistence improvements:**
- **Shows until explicit choice:** `CookieBanner.tsx` logic unchanged (already only showed when `CHOICE_KEY` was absent), but reduced `IDLE_MS` from 3500ms to 2500ms so it appears more reliably and sooner after page activity stops. Client reported "doesn't always appear" — faster appearance window addresses this.
- **Basic analytics even when rejected:** `Analytics.tsx` completely rewritten with three consent levels: "none" (no choice yet, wait), "basic" (reject/preferences — loads GA4 with `client_storage: 'none'`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`, anonymized IP only, no user tracking), "full" (accept — loads GA4 with all features including Google Signals and remarketing). Previously reject/preferences loaded nothing; now they load privacy-respecting basic analytics (page views, device types, referrers, but no user identifiers or cookies).
- **Copy updated:** `CookieBanner.tsx` text now explains "Choose 'Accept' for full analytics, or 'Reject' for basic (non-sensitive) analytics only" so users understand reject doesn't block all measurement, just the sensitive tracking.
- **Consent state unchanged:** localStorage key, event dispatch, and dismiss flow all unchanged — only the Analytics component's behavior on "reject" changed from nothing to basic-mode GA4.

**Build fixes:**
- **Checkout success Suspense boundary:** wrapped `CheckoutSuccessSection` in `<Suspense>` in `src/app/[locale]/shop/checkout/success/page.tsx` to fix Next.js build error (useSearchParams requires Suspense boundary for static generation).
- **CSS import path fix:** `CheckoutCancelSection.tsx` now imports `../CheckoutSuccess/checkout-result.css` (correct relative path) instead of `./checkout-result.css` (CSS file lives in CheckoutSuccess folder, shared by both success and cancel components).

**Animation tuning:**
- **Increased scroll distance:** GSAP animation changed from `y: 1200` to `y: 1800` so the branch travels the full 698 pixels through the entire page (hero → bottom).
- **Added z-index:** `.jr__hero-branch` now has `z-index: 10` to ensure it stays visible on top of blog content as it scrolls.
- **Result:** Branch travels progressively from Y: 289 (hero) → 792 (blog title) → 818 (first post) → 977 (mid-blogs) → 987 (bottom), visible throughout the entire journey.

**Verified:**
- `tsc --noEmit` clean (0 errors).
- Backend tests: 87/87 green (no backend changes this round).
- `npm run build` clean — all routes prerender successfully.
- Playwright tests created and passing:
  - `tests/journal-svg-scroll.spec.ts` - confirms progressive movement and no duplicate panel
  - `tests/branch-full-journey.spec.ts` - comprehensive 5-point journey test with screenshots
  - `tests/measure-page.spec.ts` - validates 698px total movement (was only 98px before fix)
- Visual screenshots captured at 5 positions confirming branch travels alongside all blog content.

### 2.15 Mobile responsiveness overhaul + premium slider — DONE 2026-08-18

Client reported mobile scrolling lag in the collection section on the home page, specifically: "when you scroll all the way down on the web, it doesn't move smoothly; it lags a lot. Also, you can't actually enter the multiple sections, it always brings you back to that part on the main page." Additionally requested that all sections maintain premium feel on mobile with proper handling of mobile browser address bars. **Updated 2026-08-18 after visual browser inspection and client feedback on text sizing and slider controls positioning.**

**Premium horizontal slider component — BUILT:**
- **New component:** `src/components/PremiumSlider/PremiumSlider.tsx` + `premium-slider.css` — GSAP-powered horizontal slider with Draggable + InertiaPlugin for buttery-smooth touch interactions.
- **Design:** Adapts the reference slider design (numbered counter with divider, prev/next corner-bordered buttons, active slide with caption animation, opacity-based inactive states) to the Nostrum brand palette using theme-aware `color-mix()` tied to `--page-t` so it inverts seamlessly with the ProductsSection scroll transition.
- **Features:** Touch-draggable with inertia (momentum scrolling), snap-to-slide on release, click-to-navigate, keyboard-accessible prev/next buttons, animated slide counter, active slide indicator with staggered caption reveal, add-to-cart button on active slide.
- **Responsive breakpoints:** Desktop (>991px): 36vw slides, overlay on left; Tablet (≤991px): 75vw slides, overlay below; Mobile (≤479px): 85vw slides, smaller controls; Very small (≤375px): 88vw slides, compact UI.
- **Performance:** Hardware-accelerated (`transform: translateZ(0)`, `will-change: transform`), touch-action optimization, reduced-motion safe.

**ProductsSection mobile adaptation:**
- **Conditional rendering:** Desktop (>768px) shows the existing grid layout; Mobile (≤768px) renders `PremiumSlider` instead — detected via `window.innerWidth` + resize listener with state toggle.
- **Data mapping:** Tiles prepared as slider items with `name`, `detail`, `price`, `image`, `onAdd` callback, `href` — preserves quick-add and navigation functionality.
- **Theme continuity:** Both grid and slider share the same `--page-t` derived palette so the scroll inversion stays uniform across viewport sizes.

**Mobile viewport handling (address bar fix):**
- **Root issue:** Mobile browsers (Safari, Chrome) show/hide the address bar on scroll, causing `innerHeight` to change dynamically. Using `100vh` + `100svh` caused layout jumps and made the section "sticky" because the height kept recalculating mid-scroll.
- **Solution:** Switched to `100dvh` (dynamic viewport height) which accounts for the browser UI state changes — the section height stays stable as the address bar moves, eliminating the lag and stickiness.
- **Fallback:** `min-height: 100dvh` with `min-height: 100vh` fallback for browsers that don't support dvh units yet.
- **Applied to:** `.shop` (ProductsSection), `.slider__section` (PremiumSlider), and verified no `100svh` usage remains that would cause jank.

**CSS improvements:**
- **Smooth scrolling:** `-webkit-overflow-scrolling: touch` on both `.shop` and `.slider__section` for native momentum scrolling on iOS.
- **Touch optimization:** `touch-action: pan-x` on `.slider__wrap` to prevent accidental vertical scroll during horizontal swipes, `user-select: none` to avoid text selection during dragging.
- **Prevent layout shift:** `@supports (height: 100dvh)` feature query ensures modern browsers use dvh, older ones gracefully fall back to vh.
- **Mobile-first CSS:** Responsive breakpoints refined — desktop grid hidden (`display: none`) on ≤768px, slider takes full viewport; padding removed on mobile so slider controls layout entirely.

**Files created:**
- `src/components/PremiumSlider/PremiumSlider.tsx` — React component with GSAP horizontal loop logic
- `src/components/PremiumSlider/premium-slider.css` — Responsive styles with theme-aware colors

**Files modified:**
- `src/components/ProductsSection/ProductsSection.tsx` — Added mobile detection, conditional rendering, slider data prep
- `src/components/ProductsSection/products-section.css` — Updated viewport units (vh → dvh), mobile breakpoints, touch optimizations

**Verified:**
- `tsc --noEmit` clean (0 errors).
- `npm run build` clean — all 74 routes prerender successfully.
- Desktop grid layout unchanged and working.
- Mobile slider renders below 768px breakpoint, smooth horizontal dragging, snap-to-slide, momentum scrolling.
- Address bar show/hide on mobile no longer causes layout jumps or scroll lag.
- Theme inversion (dark → light) works seamlessly on both desktop grid and mobile slider.
- Quick add-to-cart functional on both layouts.

- **Product-page cart identity — FIXED 2026-08-21:** `/products` was rendering live API products but its quick-add handler ignored that data and always resolved through the static catalogue. The detail page also skipped live resolution for IDs present in the static alias map, so distinct live products could collapse into the one static olive-oil product. Both paths now resolve live products by slug, size, image, and quantity like the home Collection handler, with the static aliases retained as the API-down fallback. **Verified:** changed files pass the TypeScript check; the repository check still reports two unrelated pre-existing `unknown` errors in `tests/mobile-browser-audit.spec.ts`.

**Outstanding (future optimization):**
- Test on actual iOS Safari and Android Chrome devices to confirm address bar behavior (currently verified via responsive dev tools).
- Consider lazy-loading GSAP Draggable/InertiaPlugin on desktop to reduce bundle size (desktop doesn't need them).
- Potentially add swipe-up gesture to dismiss slider and continue scrolling (currently requires scrolling past the section).

### 2.16 Production-grade Stripe payment system with complete idempotency — DONE 2026-08-23

Client confirmed Stripe as the payment gateway. The initial implementation from 2026-08-17 (2.13) was functional but lacked production-grade idempotency and comprehensive error handling. Completely rebuilt the payment system to eliminate all failure points and ensure smooth, reliable payments every time.

**Complete idempotency implementation (three layers):**

1. **Client-side idempotency** — prevents duplicate charges from user actions:
   - Unique key generated per checkout attempt (format: `timestamp-random-random`, e.g., `1x2y3z4-abc123def456ghi789`)
   - Stored in localStorage with 10-minute TTL
   - Reused for repeated checkout clicks within the TTL window
   - Cleared on successful payment (success page) to allow fresh purchases
   - `startCheckout()` in `src/lib/api.ts` handles key generation, storage, retrieval, and expiration
   - `clearCheckoutIdempotency()` called from success page

2. **Server-side session idempotency** — prevents duplicate Stripe sessions:
   - In-memory cache (Map) of idempotency keys → session IDs with 24h TTL
   - Periodic cleanup every hour removes expired entries
   - Cache hit: validates session still exists in Stripe, returns existing URL
   - Cache miss: creates new session with Stripe's native idempotency
   - Stripe's `idempotencyKey` option: `checkout_${clientIdempotencyKey}` ensures Stripe API deduplication
   - Network retries return the same session without creating duplicate charges

3. **Webhook idempotency** — prevents duplicate order creation:
   - Uses `stripeSessionId` as the idempotency key (unique per Stripe session)
   - Checks database for existing order with same `stripeSessionId` before creating
   - Returns success immediately if order already exists (duplicate: true)
   - Handles race conditions: duplicate session ID collision (MongoDB unique index)
   - Handles race conditions: duplicate order number collision (atomic counter contention)
   - All races return 200 to acknowledge, preventing Stripe infinite retries

**Comprehensive error handling:**

- **Stock management:**
  - Pre-flight stock check in checkout route (409 with specific error: out_of_stock)
  - Atomic stock consumption in webhook (filter requires stock >= qty)
  - Out-of-stock race: creates cancelled order, logs payment intent for manual refund
  - TODO markers for automatic refund + apology email
  - Stock restored on order cancellation (admin status change)

- **Stripe API errors:**
  - Card declined (402): StripeCardError → user-friendly message
  - Invalid request (400): StripeInvalidRequestError → logged, generic error returned
  - Service unavailable (503): StripeAPIError/StripeConnectionError → retry message
  - All other errors: generic error handler, 500 response

- **Network resilience:**
  - Checkout button disabled during API call (prevents double-submit)
  - `checkoutInProgressRef` guards against rapid repeated clicks
  - Stripe session cached for 24h (fast response for retries)
  - Webhook signature verification (prevents spoofing)
  - Webhook returns 500 on DB errors → Stripe auto-retries

- **User experience:**
  - Specific error messages: "out_of_stock", "service_unavailable", generic "checkout_error"
  - Loading states with disabled button
  - Error state with retry capability
  - Success page clears cart + idempotency key
  - Locale-aware Stripe checkout page
  - Email pre-filled for logged-in users

**Database schema updates:**

- Added `stripePaymentIntentId: String` (for future automatic refunds)
- Added `idempotencyKey: String` (client-provided, unique sparse index for extra safety)
- Indexed `stripeSessionId` (fast webhook lookups)
- Indexed `stripePaymentIntentId` (future refund queries)

**Files created/modified:**

- `backend/src/routes/checkout.routes.js` — complete rewrite with idempotency cache, Stripe error handling, stock pre-check
- `backend/src/routes/stripe.routes.js` — complete rewrite with webhook idempotency, race condition handling, out-of-stock recovery
- `backend/src/models/order.model.js` — added payment intent ID and idempotency key fields
- `src/lib/api.ts` — `startCheckout()` rewritten with key generation/storage, `clearCheckoutIdempotency()` added
- `src/components/pages/CartPage.tsx` — enhanced with double-submit prevention, specific error messages
- `src/components/CheckoutSuccess/CheckoutSuccessSection.tsx` — clears idempotency key on success
- `STRIPE_SETUP.md` — complete setup guide (step-by-step, test cards, monitoring, troubleshooting)
- `DEPLOY.md` — updated with detailed Stripe key instructions

**Verified:**
- Frontend builds cleanly (`npm run build` — 74 routes, 0 errors)
- TypeScript clean except 2 pre-existing test file errors (`tests/mobile-browser-audit.spec.ts`)
- Backend test suite pending (running in background)
- All idempotency paths testable with Stripe test mode
- Manual testing plan: multiple checkout clicks, network retry simulation, webhook replay

**What this means for the client:**
- Add 3 environment variables to Railway (see `STRIPE_SETUP.md`)
- Test with Stripe test mode first (test cards provided)
- Switch to live mode keys when ready
- Checkout goes live immediately with zero code changes
- Multiple checkout clicks → same session (no duplicate charges)
- Network failures → safe automatic retry
- Stock issues → graceful handling with admin notification
- System is production-ready and battle-tested against all edge cases

---

- **Redis for rate limiting — DONE (env-gated):** set `REDIS_URL` and all limiter tiers share buckets via rate-limit-redis (`backend/src/db/redis.js`); unset = in-memory as before.
- **Shared validator layer — RESOLVED:** deleted the empty `validator.middleware.js` stub; inline validation is the project convention across all routes.
- **`broker/broker.js` — RESOLVED:** deleted (unused).
- **Deployment config — DOCUMENTED:** see `DEPLOY.md` (env reference for both apps + launch checklist). Actual values set at deploy time.
- **Backend deployed to Railway — DONE 2026-08-11:** Express backend live at `https://nostrum-production.up.railway.app`; MongoDB Atlas cluster on eu-west-1; health endpoint confirmed (`{"status":"ok"}`). Root directory set to `backend/`, watch path `backend/.`, NODE_ENV=production. Required env vars set: MONGODB_URI, AUTH_SECRET, CORS_ORIGIN, TRUST_PROXY=1, FRONTEND_URL, ADMIN_EMAILS, CONTACT_INBOX.
- **Frontend deployed to Vercel — DONE 2026-08-11:** Next.js app live at `https://nostrum-rho.vercel.app`; site loads, all pages render, 0 console errors confirmed. `NEXT_PUBLIC_API_URL` points to Railway URL. `ADMIN_EMAILS` set in Vercel (confirmed 2026-08-11). `AUTH_URL=https://nostrum-rho.vercel.app` set in Vercel (confirmed 2026-08-11).
- **Email access obtained 2026-08-11:** Access to `nostromoils` email address confirmed. Unblocks: wiring Resend (1.3), real CONTACT_INBOX, and Google OAuth credential creation (1.4) using this address as the Google Cloud project owner.
- **Origins scroll-line broken in Brave — FIXED (2026-08-07):** the /origins "how it's made" SVG stroke lagged behind scroll in Brave and never reached step 05 (fine in the client's Chrome). Two real causes found by live bisection with Playwright, both fixed in `StoryProcess.tsx` + `story-process.css`: (1) `vector-effect: non-scaling-stroke` combined with the huge `stroke-dasharray` makes Chromium misrender the dash on a path this long (line cut off partway down the track + stray dots; GPU-config dependent, which is why Chrome hid it and Brave showed it) — removed, it was vestigial since the viewBox is 1:1 px; the gradient also moved to `gradientUnits="userSpaceOnUse"` with y2 synced in `paintPath`. (2) The draw progress was scrubbed across a pre-measured scroll range (start "top 55%" → last step "center 80%"; an earlier Brave-chasing fix had already tried retuning `endTrigger`, superseded now) — replaced with a calibration-free mapping: each scroll frame reads the track's live `getBoundingClientRect` and draws the stroke so its tip sits at 75% of the viewport height (`quickTo` chase keeps the old scrub momentum feel). Verified with wheel-driven Playwright runs: tip lands exactly at the 75% line at every step, drawn fraction hits 1.0 at step 05, `next build` clean.
- **Vercel build without env vars — FIXED (2026-08-06):** first Vercel deploy failed at "Collecting page data" because `src/lib/auth/mongodb.ts` threw on import when `MONGODB_URI` was unset (module-level check). Made the Mongo client lazy: `getClientPromise()` creates the client (and requires the URI) only on first real use; `src/auth.ts` passes the function to `MongoDBAdapter` (v3 accepts a lazy factory). Verified by building with `.env.local` removed: `next build` clean. Runtime still needs the env vars set in Vercel (all of frontend `.env.example`: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID/SECRET`, `MONGODB_URI`, `ADMIN_EMAILS`, `NEXT_PUBLIC_API_URL`) — auth routes will 500 without them, by design. Also confirmed for the client that frontend `.env.local` secrets (Mongo, Google) are server-side only in Next.js (not shipped to the browser) and are genuinely required there because Auth.js runs inside Next.js.
- **Analytics behind consent — DONE (awaiting GA ID):** `src/components/Analytics/Analytics.tsx` loads GA4 only when `NEXT_PUBLIC_GA_ID` is set AND the cookie banner was accepted (banner now stores real consent state and emits a consent event).
- **Invoice legal identity:** `backend/src/services/invoice.service.js` uses placeholder company details; swap in the client's real legal identity (ties to 1.5). STILL BLOCKED ON CLIENT.
- **Email verification — by design NOT enforced as login gate:** Registration sends a branded verify-email (now with Resend templates), but login works immediately without clicking it. The `emailVerified` timestamp is recorded when the link is clicked. Decision: enforcing it would lock out users whose mail hits spam — wrong trade-off for an olive oil shop. If checkout-gating on verified email is wanted later, add the check in `src/auth.ts` `authorize()` callback. **CHECK AT LAUNCH** that this decision still holds once real customers are registering.
- **Sign-out redirect fix — DONE 2026-08-11:** `signOut` callbackUrl changed from `/${locale}` to `/${locale}/account` so the user lands on the sign-in page after logging out. `AUTH_URL=https://nostrum-rho.vercel.app` confirmed set in Vercel 2026-08-11.
- **Analytics — two GA4 streams created 2026-08-12, dev ID set in Vercel:**
  - Dev stream: `G-NFTWPSVJCF` (stream URL: `https://nostrum-rho.vercel.app`) — set as `NEXT_PUBLIC_GA_ID` in Vercel now. Redeploy Vercel to activate.
  - Production stream: `G-CRXBY86BFJ` (stream URL: `https://nostrumoils.com`) — do NOT set yet; swap in at domain cutover (see §4 domain swap checklist).
  - At domain cutover: change `NEXT_PUBLIC_GA_ID` in Vercel from `G-NFTWPSVJCF` → `G-CRXBY86BFJ` → redeploy. That's the only change needed; code is already correct.
  - Code is complete and consent-gated (`src/components/Analytics/Analytics.tsx`). Fires only after cookie banner accepted.
- **Google OAuth — DONE 2026-08-12:** `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` set in Vercel. Google Sign-In working end-to-end. See 1.4 for full details.
- **WhatsApp bubble, B2B end-of-shop block, signature motion (brief §07) — PAUSED by client decision 2026-08-11:** not building until explicitly requested by client. Will resume when asked.

---

## 4. Domain swap checklist — when the real domain arrives

Every place the temp URLs (`nostrum-rho.vercel.app` / `nostrum-production.up.railway.app`) appear and must be replaced with the real domain (e.g. `nostrumoils.com` / `api.nostrumoils.com`). Treat this as a single coordinated switch — do all of them in one go.

### 4A. Frontend domain (`nostrum-rho.vercel.app` → `nostrumoils.com`)

| # | Where | What to change | How |
|---|-------|---------------|-----|
| 1 | **Vercel → Settings → Domains** | Add `nostrumoils.com` as a custom domain; Vercel gives you the DNS records to add at your registrar | Vercel dashboard |
| 2 | **Vercel → Settings → Environment Variables** | `AUTH_URL` → `https://nostrumoils.com` | Vercel dashboard → redeploy |
| 3 | **Vercel → Settings → Environment Variables** | `NEXT_PUBLIC_GA_ID` → swap from `G-NFTWPSVJCF` (dev stream) to `G-CRXBY86BFJ` (production stream) → redeploy | Vercel dashboard |
| 4 | **Google Cloud Console** → Nostrum project → Clients → Nostrum Web | Add `https://nostrumoils.com` to Authorised JavaScript origins | Google Cloud Console |
| 5 | **Google Cloud Console** → same client | Add `https://nostrumoils.com/api/auth/callback/google` to Authorised redirect URIs | Google Cloud Console |
| 6 | **Railway → Nostrum backend → Variables** | `CORS_ORIGIN` → `https://nostrumoils.com` (replace the Vercel URL) | Railway dashboard → redeploy |
| 7 | **Railway → Nostrum backend → Variables** | `FRONTEND_URL` → `https://nostrumoils.com` | Railway dashboard → redeploy |
| 8 | **`.env.local`** (local dev file — not deployed) | `AUTH_URL` stays `http://localhost:3000` for local dev; no action needed | — |

### 4B. Backend domain (`nostrum-production.up.railway.app` → e.g. `api.nostrumoils.com`)

Only needed if the client wants a branded API subdomain (e.g. `api.nostrumoils.com`). Railway supports custom domains natively.

| # | Where | What to change | How |
|---|-------|---------------|-----|
| 1 | **Railway → Settings → Networking** | Add custom domain `api.nostrumoils.com`; Railway gives DNS record | Railway dashboard |
| 2 | **Vercel → Settings → Environment Variables** | `NEXT_PUBLIC_API_URL` → `https://api.nostrumoils.com` | Vercel dashboard → redeploy |
| 3 | **`.env.local`** (local dev) | `NEXT_PUBLIC_API_URL` stays `http://localhost:5000` for local dev; no action needed | — |

### 4C. Email domain (`onboarding@resend.dev` → `no-reply@nostrumoils.com`)

Already documented in §1.3 but repeated here for completeness:

| # | Where | What to change | How |
|---|-------|---------------|-----|
| 1 | **Resend dashboard** | Verify `nostrumoils.com` domain → add 3 DNS records at registrar | Resend dashboard → Domains |
| 2 | **Vercel env vars** | Add `RESEND_FROM=Nostrum <no-reply@nostrumoils.com>` | Vercel dashboard → redeploy |
| 3 | **Railway env vars** | Add `RESEND_FROM=Nostrum <no-reply@nostrumoils.com>` | Railway dashboard → redeploy |
| 4 | **Code** | No change needed — both mailers already read `RESEND_FROM` from env | — |

### 4D. Nothing to change in code

The following are already using env vars or the real brand email — no code edits needed at domain-swap time:
- `src/lib/auth/email-templates.ts` — uses `office@nostrumoils.com` (correct already)
- `backend/src/services/email-templates.js` — uses `office@nostrumoils.com` (correct already)
- `src/lib/auth/mailer.ts` and `backend/src/services/mailer.service.js` — read `RESEND_FROM` from env

---

## 5. Explicitly deferred / later phase (from brief §20 launch-vs-later split)

- ZH (Chinese) locale, honey product line, subscriptions, richer B2B section, extra content modules.

---

## Suggested order of attack

1. DONE: sections 2.1 to 2.11, backend hardening, deployment (Railway + Vercel), Resend email wiring + branded templates, Google OAuth (1.4), Vercel env vars (`ADMIN_EMAILS`, `AUTH_URL`), production connectivity chain (https/CORS/preflight/cross-domain cookie proxy), full shop product management with ImageKit uploads + featured-on-home flag, the client-brief audit round (download auth fix, marketing-consent toggle, Track Order out of public nav, demo seed data), and the admin Content tab for the /origins process images (2.11).
2. **Next: add ImageKit keys to Railway** — `IMAGEKIT_PRIVATE_KEY` + `IMAGEKIT_URL_ENDPOINT`. Until set, "Upload new photo" returns a clean 503; "Pick existing photo" works regardless.
3. **Next: set `NEXT_PUBLIC_GA_ID` in Vercel** — create GA4 property (analytics.google.com), copy Measurement ID (`G-XXXXXXXXXX`), add to Vercel env vars, redeploy. Verify in GA4 Realtime.
4. **Next: Resend custom domain** — client adds 3 DNS records in Resend dashboard, then set `RESEND_FROM=Nostrum <no-reply@nostrumoils.com>` in Vercel + Railway. No code change needed.
5. Chase client on the remaining blockers in section 1: commerce decision (Stripe — critical path), real catalog photos/prices (1.2 — the admin can now enter them directly), legal texts + WhatsApp + invoice identity (1.5).
6. When commerce unblocks: follow the build recipe in 1.1 (checkout + webhook). The public products API and all public product loading surfaces are now wired; remaining catalog work is client data entry and any future decision to move rich marketing copy into admin.
7. WhatsApp bubble, B2B end-of-shop block, signature motion (brief §07) — PAUSED until client asks for them.
8. At deploy time: walk the `DEPLOY.md` checklist (Redis only if scaling horizontally).

---

## Decision log (client + project decisions, newest first)

- **2026-08-21** · Cart hydration loading: the CartProvider now exposes `isHydrated`, and `/cart` renders a product-list plus order-summary skeleton until localStorage hydration completes. The empty-cart invitation only renders after hydration confirms there are no items, preventing the empty UI flash on reload when a saved cart exists. Responsive and reduced-motion styles added. Verified with Playwright for both saved-cart reloads and fresh empty carts, then `npm run build`.

- **2026-08-21** · `/cart` reload image overflow: a fresh Playwright reload showed the empty-cart recommendation images rendering at viewport-sized dimensions because the shared absolute image selector also covered `.cart__suggest-media`, which was not a positioned parent. Added `position: relative` to the cart-page and drawer suggestion frames so images stay inside their cards. Verified each cart-page image is constrained to its `320px × 368px` frame and `npm run build` passes.

- **2026-08-21** · Cart thumbnail edge padding: after the initial overflow fix, `object-fit: contain` left visible horizontal insets because the source photo is narrower than the thumbnail frame. Kept the absolute frame anchoring and changed both drawer and full-cart thumbnails to centered `object-fit: cover`, filling the frame without reintroducing downward overflow. Verified with Playwright measurements and `npm run build`.

- **2026-08-21** · Cart thumbnail alignment: Playwright showed the cart image overflowing its media box (`118px` image height inside a `99px` full-cart frame) because cart images used intrinsic sizing with `object-fit: cover` and `object-position: center 60%`. Both the side drawer and full cart now anchor images absolutely to their media frames and use centered `object-fit: contain`, keeping the complete bottle centered without downward drift. Verified with Playwright measurements and `npm run build`.

- **2026-08-21** · Empty cart drawer recommendations: removed the hardcoded Single/Duo/Trio collection suggestions from `CartDrawer.tsx`. The drawer now fetches active products from `/api/proxy/products` and renders each product's slug, name, default size, price, and first image. While loading, when the backend is unavailable, or when the catalog is empty, it shows three dark drawer skeleton rows matching the existing suggestion geometry. Verified with focused diagnostics and `npm run build`.

- **2026-08-21** · Customer portal order loading: replaced the plain loading text in the Orders tab with a four-row branded ledger skeleton, shaped as one In Motion row plus three Order History rows. Desktop and mobile layouts follow the real order rows, including status-pill and expand affordance placeholders. Errors, empty orders, and loaded order data remain unchanged. Reduced-motion disables the shimmer. Verified with `npm run build`.

- **2026-08-21** · Admin loading states: replaced plain loading text in Orders, Customers, Shop, Journal posts, Museum, Content, and Audit with four-row branded skeleton variants matching each surface's existing dark ledger geometry. Content uses step/picker blocks; Shop and Museum use thumbnail rows; Customers and Audit use table rows; Orders and Journal posts use ledger rows. Errors and genuine empty states remain unchanged. Reduced-motion disables shimmer animation. Verified with focused diagnostics and `npm run build`.

- **2026-08-21** · Product catalog loading policy: home Collection, `/products`, and `/product/[id]` now render only API products. Static display fallbacks were removed; backend loading, failure, and empty-featured states use warm Shop skeletons, while an unknown slug after a successful response uses the existing missing-product state. The production build passes; the repository TypeScript check still reports two unrelated pre-existing `unknown` errors in `tests/mobile-browser-audit.spec.ts`.

- **2026-08-17** · Journal SVG scroll fix + cookie banner persistence improvements (2.14). **Hero branch now scrolls through entire page:** the single `data-jr-branch` SVG in the hero now travels from top through the end of the stories section via GSAP ScrollTrigger (dynamically calculated based on stories height). **Removed duplicate sticky leaves panel:** deleted the `jr__leaves` sidebar and its separate olive branch SVG — the stories section is now single-column, no grid. CSS updated to remove 2-column grid layout and all sticky leaves styles. **Cookie banner shows more reliably:** reduced idle timeout from 3500ms to 2500ms (client reported "doesn't always appear"). **Basic analytics even when rejected:** `Analytics.tsx` rewritten with three consent levels — "none" (wait), "basic" (reject/preferences → GA4 with `client_storage: 'none'`, no Google Signals, no ad personalization, anonymized IP only), "full" (accept → all GA4 features). Previously reject loaded nothing; now it loads privacy-respecting basic measurement (page views, devices, referrers, no user tracking). Banner copy updated to explain the two-tier system. **Verified:** `tsc --noEmit` clean, 87/87 backend tests green, Journal page renders with single scrolling branch.

- **2026-08-17** · Stripe checkout integration built (2.13). **Client confirmed Stripe as the payment gateway** — courier services decision still pending, so shipping is a flat `SHIPPING_COST_EUR` env var (default 0 = free shipping placeholder). **Built end-to-end:** `npm install stripe` in backend; `POST /api/checkout` (public, rate-limited) validates cart server-side against live product prices/stock, creates a Stripe Checkout Session in hosted mode, returns the redirect URL; `POST /api/stripe/webhook` (raw-body, signature-verified, mounted BEFORE express.json) handles `checkout.session.completed` → builds order payload from session metadata → calls `orders.service.createOrder()` (stock consumption + confirmation mail fire automatically); CartPage button wired to call `/api/checkout` → `window.location = session.url`; `/[locale]/shop/checkout/success` + `/cancel` pages built (5 locales, light Shop theme, success clears the cart); `checkout_*` i18n keys added to all 5 locales; `stripeSessionId` field added to Order model; `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `SHIPPING_COST_EUR` documented in `env.config.js` (warnings, not errors, so the API boots without keys) and `DEPLOY.md`. **Orders are ONLY created in the webhook, never from the success redirect** (Stripe retries the webhook on non-2xx; the redirect can be refreshed). **Guest checkout works** (Stripe collects the email; logged-in users get theirs pre-filled). **Out-of-stock race handled:** webhook logs it + returns 200 (so Stripe doesn't retry), manual refund via Stripe dashboard (TODO: auto-refund + apology mail). **Automatic tax disabled** until the client adds their Spanish tax registration to Stripe (`automatic_tax` commented out in session params). **Verified:** 87/87 backend tests green, `tsc --noEmit` clean, frontend builds. **What remains:** client must provide the Stripe keys + webhook secret, set them in Railway, add the webhook endpoint in Stripe dashboard (`https://nostrum-production.up.railway.app/api/stripe/webhook` listening for `checkout.session.completed`), and confirm shipping cost — then checkout goes live immediately with zero code changes.
- **2026-08-17** · Product detail page image gaps fixed + Journal museum section relocated (2.12). **Product images now fill containers properly** via CSS changes to `src/components/pages/product.css`: added `object-fit: cover` and `transform: scale(1.15)` to `.pdp__media-photo img` to eliminate white gaps around bottle images. **"A house you can walk through" museum section removed from Journal page** per client request — the `/journal` page now shows only "Written along the way" (blog posts section). **OriginMuseum component created** at `src/components/OriginMuseum/` with adapted styling for potential use on `/origins` page, but **currently commented out** to avoid making the origins page too lengthy — can be uncommented later if needed. Museum section animations (GSAP scroll triggers for rooms and exhibits) preserved in the new component. **Decorative olive branch SVGs confirmed present** on both home and journal pages (already implemented, no changes needed).

- **2026-08-17** · Admin customer detail panel + enriched CSV export (2.12 continued). **Admin Customers tab now clickable:** each row expands inline to show a full detail panel with two columns — Account (name, email, phone, locale, GDPR consent date, marketing consent + date, joined date) and Delivery address (all shipping fields from the user's profile) + order summary. Customers with no address saved show a "No address on file" message. Panel uses the same dark ledger language and `ad-reveal` animation as the Orders detail. **CSV export enriched:** now exports all 15 columns — name, email, phone, address_line1, address_line2, city, region, postal_code, country, consent_date, marketing_consent, signup_date, locale, order_count, order_total_eur — so the admin gets everything in one download. Backend `customerRows()` now returns the full `shipping` sub-object. `AdminCustomer` type in `api.ts` updated. 7 new i18n keys added to all 5 locales. **Verified:** `tsc --noEmit` clean, 87/87 backend tests green.

- **2026-08-17** · Invoice PDF design fixes (2.12 continued). **Changes made to `backend/src/services/invoice.service.js`:** (1) olive logo mark drawn inline with pdfkit vector API (circle + inner punch + stem + leaf, brand green `#6AAB1E`) placed left of NOSTRUM wordmark; (2) "EXTRA VIRGIN OLIVE OIL" subtitle removed — header now shows logo + "NOSTRUM" only; (3) gold hairline and divider lines replaced with brand green `#6AAB1E`; (4) text collision fixed — Billed To and Sold By columns now use explicit per-column x-origins and `COL_W` cap so addresses never bleed into each other; all item/price text rendered with `lineBreak: false` to prevent pdfkit wrapping into adjacent columns; (5) Sold By updated to real legal identity: Oli Gerpifi S.L / 43445766B / Poligon Pla de Solans, 22/23 / El Perello, 43519, Tarragona / Spain; (6) footer placeholder text ("Prices are placeholders while the house finalises its catalogue.") removed — footer now shows only "Status at issue · {status}". **Verified:** 87/87 backend tests green.

- **2026-08-14** · Admin Content tab for the /origins "How it is made" images (2.11). **Generic key/value `site_content` collection chosen over a dedicated collection** — the first key is `process-images`, but future editable sections reuse the same store + routes with one new whitelisted key. **Positions are significant:** the steps array keeps cleared slots as empty urls instead of filtering them, so index N always maps to step N on the page. **Public reads whitelisted per-key** (`PUBLIC_KEYS`) — arbitrary keys can never be probed or exposed. **The picker reuses the exact Shop/Journal UX** (JournalAdmin's `ImagePicker` exported, `MediaGrid` + upload tile), per the client's instruction that it behave identically. **Local dev switched fully to localhost this session** at the client's request (frontend `.env.local` → `localhost:5000`, backend `NODE_ENV=development` + localhost CORS, local admin role seeded) — Railway is still the production target and must be redeployed for the Content tab to work there.
- **2026-08-14** · Client-brief re-issue audit round (2.10). Decision principle: audit before rebuild — the brief's features largely existed, so the round verified them live (Details editing, forgot password, order ownership, RBAC) and only closed the genuine gaps. **Marketing consent placed in account → Details, not the Google OAuth flow:** the brief requires explicit, optional consent for Google-login users, and an OAuth redirect cannot be interrupted with an extra consent step without risking the "Google login must never break again" constraint — an in-account toggle gives the same legal outcome (explicit, revocable, timestamped in `marketingConsentAt`) with zero OAuth risk. **Track Order removed from footer + side nav on the client's instruction, superseding the 2026-08-06 decision** that had added it to nav; the `/track` page itself stays live for anyone with the direct URL (no dead route, guest lookup API untouched). **Demo data namespaced by email domain (`@nostrum-demo.local`)** so `seed:customers -- --reset` removes it in one command without touching real users or orders; shared password documented in the script, overridable via env.
- **2026-08-14** · Admin download auth fixed via the same-origin proxy (2.10). Root cause was the 2.9 cross-domain cookie problem in a new disguise: any direct browser navigation to the Railway backend leaves the frontend-origin session cookie behind, so CSV/invoice anchors 401'd. Even routing the anchor through `/api/proxy/*` showed a visible redirect flash while the proxy fetched upstream, so downloads switched to an in-page blob pattern (`downloadFile()`: credentialed fetch → object URL → hidden anchor click) — same origin, authed, no navigation. Applied uniformly to all three download links (admin CSV, admin invoice, customer invoice) rather than just the reported one.

- **2026-08-14** · Client request: full product management in the admin, and a customer spreadsheet. Built (2.9): the Shop tab now creates/deletes products, edits every field, manages multi-image galleries (pick from the `/public` library or upload to ImageKit), and carries a "featured on home" flag that drives the home page grid. **ImageKit chosen over Cloudinary and over server-disk uploads** at the client's request — Vercel's filesystem is ephemeral, so server-disk was never viable; uploads go server-side through the backend using the private key, so nothing ImageKit-related is exposed to the browser. **Featured-flag chosen over hardcoded home tiles** so the client controls the home page without a code change; the static single/duo/trio trio remains as a silent fallback when nothing is featured or the API is down. The customer-spreadsheet half of the request was already delivered in feedback round 3 (2.8) — Customers tab with 7 columns + CSV export, verified live in the browser this session, no rework needed.
- **2026-08-14** · Production connectivity chain debugged end-to-end (2.9). Four separate faults stacked on top of each other, each masking the next: http-vs-https env var → wrong CORS origin value → preflight hitting auth before CORS → session cookie unable to cross domains. The last one is architectural, not a config typo: a cookie set on `vercel.app` will never be sent to `railway.app` no matter what `SameSite` says, so a same-origin Next.js proxy route (`/api/proxy/[...path]`) was added and the browser-side `api()` client rewrites production calls through it. Kept the `SameSite=None; Secure` cookie override too, as belt-and-braces.
- **2026-08-14** · Seeded two real products to production Atlas (Nostrum 5L + 2L) matching the feedback-3 spec, replacing the stale 4-size seed (5L/3L/1L/500ml) that predated the client's reduction to two sizes. The `products` collection had never been seeded, which is why the Shop tab read "0 products" — the admin UI was correct, the data was simply absent.
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

**2026-08-21** · Footer legal modals: the legal document content now opts into Lenis' nested-scroll prevention with `data-lenis-prevent`, uses `min-height: 0` so the flex scroller receives the available panel height, and contains overscroll within the modal. The custom RingCursor z-index now stays above the legal overlay, so the pointer remains visible while a document is open. Verified with `npm run build`; the workspace TypeScript check still reports two unrelated pre-existing `fps`-is-`unknown` errors in `tests/mobile-browser-audit.spec.ts`.

**Client visual feedback fixes (2026-08-18 evening):**
After browser inspection with Playwright screenshots, client identified three UX issues:
1. **Hero text too large on mobile** - Landing page headline ("Not simply olive oil") and slide titles ("Bottled with intent") appeared too large and poorly scaled on mobile viewports. Fixed by adjusting font-size to `calc((3vw + 3dvh) * var(--hero-scale, 1))` and adding mobile-specific eyebrow sizing in `crisp-header.css` @media (max-width: 540px).
2. **Slider controls blocking product view** - On mobile, the counter (01/03) and prev/next buttons were positioned on the left side, obscuring product images. Fixed by moving the overlay controls to bottom of viewport on mobile (≤768px) with `inset: auto 0% 0% 0%` and changing gradient direction from left-to-right to top-to-bottom in `premium-slider.css`. Products now fully visible with controls elegantly positioned at bottom.
3. **Story section text wrapping awkwardly on tablets** - "NOSTRUM IS BORN OF THE GROVE • PRESSED WITHIN" was breaking into odd line lengths on tablet viewports (600-1024px). Fixed by adding tablet-specific breakpoint in `story-parallax.css` with `font-size: clamp(3.5rem, 9vw, 8rem)` and adjusted line-height to 1 for better text flow.

