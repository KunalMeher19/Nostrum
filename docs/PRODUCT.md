# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — DTC consumer.** Individuals buying premium olive oil for themselves or as a gift. They arrive via brand interest or search, browse the dark brand pages, and transact in the white Shop. They expect the experience to feel as considered as the product — a luxury purchase, not a grocery run.

**Secondary — B2B professional.** Restaurants, chefs, and distributors. They do not bulk-checkout; they want a relationship. The B2B surface is a qualified lead flow ("¿Eres chef profesional?"), not a wholesale cart.

**Tertiary — logged-in portal user.** Returning customers managing their orders, tracking shipments, and downloading invoices from the customer portal.

## Product Purpose

Nostrum is a premium, dark, agriculture-rooted olive oil brand. The website's job is story first, product second: earn the visitor's trust and emotional investment through brand storytelling, then convert them in a clean white Shop. The site must feel expensive and exclusive — closer to a luxury car or fashion house than a food store — while preserving the family, from-the-land warmth that makes the product honest.

Success means: visitor arrives on a dark, cinematic brand moment → is moved by the story → transacts in a bright, frictionless shop → returns via the portal.

## Positioning

Nostrum is the only olive oil in its market that presents with fashion-house and supercar visual language while being genuinely grounded in agricultural family craft. It is not a catalog-seller; it is a feeling-seller. The dark brand / white shop split is the product's identity, not a styling choice — it holds the tension between exclusive luxury and agricultural soul.

## Operating Context

- Sold DTC online (Spain, EU); B2B via contact/WhatsApp lead flow.
- Five locales live: ES, EN, CA, IT, EL. ZH-ready (build i18n-safe, add later if easy).
- Professional photography and final copy pending from the client — placeholders throughout.
- Business WhatsApp number and email provider (Resend) pending — stubs in place.
- Legal texts (privacy policy, legal notice, cookies/LSSI-CE) pending from client.
- Google login must work — the previous site's broken Google OAuth is an explicit non-repeat.

## Capabilities and Constraints

**Built and live:**
- Auth.js v5 + Express/MongoDB hybrid auth (email/password + Google OAuth plumbing, shared AUTH_SECRET)
- Customer portal: order history, active orders with shipping status, downloadable invoices, account details, CTA to shop
- Admin portal: orders, exportable customer/newsletter lists, shop editor, journal authoring, audit trail viewer
- Journal blog + digital museum with admin authoring
- Guest order lookup + public /track page (all 5 locales)
- Order layer: stock consumption, atomic order numbers, shipping-status mail stubs, carrier tracking links (SEUR, Correos, MRW, GLS, DHL, UPS), pdfkit invoices
- Backend: rate-limit tiers, NoSQL-injection guards, graceful shutdown, DB-backed admin revocation, append-only audit trail, CSRF origin guard, 80 tests green
- Cookie banner with real consent state; GDPR consent on signup; consent-gated GA4 loader
- Contact form + newsletter subscribe/unsubscribe with enumeration-safe backends
- 5 locales (ES/EN/CA/IT/EL) throughout

**Confirmed in scope but not yet built:**
- Checkout + payments (commerce backend undecided — see below)
- Real shop catalog (static placeholders until client confirms SKUs/prices/photos)
- Email delivery (Resend — console-stubbed pending client's provider and sending domain)
- Google OAuth credentials (plumbing built; AUTH_GOOGLE_ID/SECRET not yet supplied)
- Floating WhatsApp bubble (number pending from client; parked until unblocked)
- B2B end-of-shop block (parked — format to confirm with client)
- Nav search (on hold pending client's "skip or build" answer)

**Hard constraints:**
- Never use em-dash in any user-visible copy; use comma/period or "·"
- All user-visible strings in all 5 locale files: messages/{en,es,ca,it,el}.json
- Dark brand pages / white Shop — the two-mode split is non-negotiable
- Google sign-in must not break
- Quantity is unrestricted (x1/x2/x3 quick picks + free custom amount)
- No chatbot — floating WhatsApp bubble only
- No wishlist/favorites

**Open decision — commerce backend:**
Client has not yet confirmed. Working hypothesis and recommendation: custom + Stripe Checkout (hosted card payments, guest checkout, Apple/Google Pay, Stripe Tax for Spanish IVA). The full order layer is already built swappable behind `backend/src/services/orders.service.js`. Shopify headless remains the alternative if the client wants self-managed products/inventory. Decision is the critical path to launch. See REMAINING-WORK.md §1.1 for the full build recipe.

**Product catalog:**
Currently static placeholders in `src/lib/products.ts`. Confirmed product type: olive oil bottles, mainly 5L, sold as x1/x2/x3 packs plus other sizes. ~€35/5L (ballpark, not final). Honey line: not yet confirmed. Catalog must be type-agnostic (honey-ready). MongoDB `products` collection + admin shop editor ready to become the source of truth once real data arrives.

## Brand Commitments

- **Name:** Nostrum
- **Voice:** Confident, warm, few words. Premium but not cold — family, from-the-land. No marketing filler, no walls of text. Every string earns its place. History page is the single exception where deeper text is welcome.
- **Palette (client's proposal, to finalize together):**
  - Ink black `#14160F`, deep olive `#1E2A16`, bark brown `#2C2117` — backgrounds on brand/dark pages
  - Logo lime `#A6CE3A`, gold `#E6B422` — sparing accents ("the jewelry"); CTAs, highlights, key moments
  - Leaf green `#3B7A3E` — organic/natural secondary accent
  - Warm white `#FAF8F2` — Shop background (the bright section)
  - Off-white `#EDEBE3` — body text on dark
- **Typography (direction, not locked):** editorial display face for headlines (premium, character) + clean readable sans for body/UI. Two families max. Must support ES/CA diacritics. Huge type, sparse copy, generous whitespace.
- **Motion:** slow, elegant, custom easing (~0.8–1.2s, expo/power3). Scroll reveals = fade + slight rise + clip-path. Respect `prefers-reduced-motion`. Nothing that hurts load time or feels gimmicky.
- **Key interactions:** zero-lag custom cursor; Rolls-Royce split-screen menu with blurred current-page background; poster-scale "NOSTRUM" footer wordmark; Balmain-style footer (sections/socials/legal/lang+country).

## Evidence on Hand

- `assests/Nostrum.pdf` — the client's official written brief (2026-07-03); source of truth for all confirmed decisions
- `assests/golden-curved-light-line-rope-…webp` — gold light-streak hero reference
- `assests/Screenshot …Louis Vuitton grid…` — Shop layout reference
- `assests/Screenshot …Balmain footer…` — footer reference
- `assests/Screenshot …Rolls split-screen menu…` — menu reference
- `assests/Screenshot …Bugatti…` — oversized wordmark reference
- `assests/Screenshot …Basic Agency…` — scroll-driven bg shift / floating pill nav reference
- Full codebase: Next.js 15 (App Router) + TypeScript + Tailwind + GSAP/ScrollTrigger + Framer Motion + Lenis; Express/MongoDB backend; Auth.js v5; 5-locale i18n routing
- Professional product photography: **not yet received** — all product images are placeholders; future work must not fabricate real shots
- Real contact details, WhatsApp number, pricing, legal texts: **not yet received**

## Product Principles

1. **Story earns the sale.** The brand pages justify the premium price; the Shop closes it. Never collapse the two modes into one visual register.
2. **Restraint is the luxury signal.** Fewer words, fewer colors, fewer elements — but every one chosen deliberately. Density is the enemy of premium.
3. **Agriculture soul survives the luxury polish.** Warmth, craft, and family roots must be perceptible in every surface — this is olive oil, not a supercar.
4. **Every interaction must feel intentional.** Motion guides attention, never performs for its own sake. The cursor, the menu, the loader — all feel considered.
5. **Build for what comes next.** Catalog is honey-ready, i18n is ZH-ready, order layer is payment-rail-swappable. Structural decisions made now must not force a rebuild when the client's open items resolve.

## Accessibility & Inclusion

- `prefers-reduced-motion` must be respected on all animations — near-instant fallback for the hero, loader, and all scroll effects (hard constraint from the client brief)
- ES/CA diacritics required in all type choices; ZH-ready i18n architecture in place
- Google login must be reliable — client's previous site had a broken OAuth flow; this is an explicit accessibility/usability non-repeat
- GDPR + LSSI-CE (Spain/EU): cookie consent before analytics fire, explicit consent checkbox on signup, unsubscribe handling in place
