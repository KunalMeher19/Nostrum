# Nostrum — Design Language & Build Spec

> **One-sentence brief:** Nostrum is not a food store. It is a *premium, dark, agriculture-rooted olive oil brand — with a clean white shop that gets out of the way and lets you buy.* Story first, product second.

This document is the single source of truth for the look, feel, motion, structure, and architecture of the Nostrum website.

> ✅ **Status: CLIENT BRIEF RECEIVED (2026-07-03) — this spec is now grounded in the client's own written brief** (`assests/Nostrum.pdf`), not just inferred from reference sites. The brief is explicitly *"nothing is set in stone"* — a shared starting point, not a locked contract — but it confirms the fundamentals (what Nostrum is, who it sells to, what the site must do, palette, structure, motion ideas) and **overrides earlier assumptions where they conflict.** The remaining genuinely-open items are the client's own "open items" list (§20) — content, copy, photos, legal, final prices, contact details, final fonts, B2B format, Chinese.

**The client's framing:** *"Nothing is set in stone - this is so we're on the same page before you start… tell me what's tricky, what you'd do differently, and rough timing/cost. Then we start."* He wants a reaction and a recommendation, not silent compliance.

> **Interpretation principle (how to read this brief): silence ≠ prohibition.** Anything the client **didn't** mention is **fair game** to propose and build — we're not limited to the literal list. The **only hard constraints are the things he explicitly said NOT to do.** Those are: **no chatbot** (→ WhatsApp), **no walls of text** (History excepted), **no wishlist/favorites**, **don't limit purchase quantity**, **don't repeat the broken Google login** — plus his guardrails: **nothing that hurts load time or feels gimmicky, respect reduced-motion, premium = restraint.** Enhancements he never asked for (loader, split-screen menu, zero-lag cursor, etc.) are welcome as long as they honor those guardrails. **He explicitly likes loaders** — treat a branded loader as a feature, not scope creep.

---

## 0. The Gist (client's own 5-line summary)

- **Who:** Nostrum, an **olive oil producer**. **Family / agriculture roots** — that soul must not be lost.
- **Vibe:** **dark, premium, exclusive** — think luxury car / fashion house (Bugatti / Rolls-Royce / Aston Martin). **The Shop is the exception: bright and white** (Louis Vuitton / Balmain).
- **Sells to:** normal customers (**online shop**, DTC) **and** businesses (**B2B**, but more *"let's talk"* than bulk-checkout).
- **Needs:** **shop + accounts + client portal + admin panel**, in **3 languages (maybe 4)**.
- **Not doing:** **no chatbot** — a **WhatsApp button** instead.

**The core tension to hold at all times:** feel *expensive and exclusive* (closer to a supercar / fashion house than a food store) **while keeping an agricultural, "from the land" soul — this is olive oil, not a supercar.**

**On copy (client is emphatic):** *"I don't want walls of text nobody reads. Find the exact words, only what the customer needs to know."* The **design carries most of the weight.** The **one** place we write more is the **History** page — real storytelling, text + photos.

---

## 1. Brand Positioning

Nostrum reads as: **Premium · Luxury · Minimal · Exclusive · Cinematic · Emotional · Expensive · Agriculture-rooted · Story-first.**

The client's references are *feeling-sellers*, not catalog-sellers. Two distinct reference sets, because the site has two modes:

**Dark / brand mode** (Home, History, Contact, B2B):

| Reference | What the client is extracting |
|---|---|
| [Bugatti](https://www.bugatti.com/) | Poster-scale typography, near-black canvas, oversized wordmark footer |
| [Rolls-Royce](https://www.rolls-roycemotorcars.com/) | Split-screen menu, cinematic blur/scale reveal, minimal hero, zero-lag cursor |
| [Aston Martin](https://www.astonmartin.com/) | Cinematic motion, dark elegance |
| [Bang & Olufsen](https://www.bang-olufsen.com/) | Poster-like oversized footer branding, clean cards, breathing room |
| [YSL](https://www.ysl.com/) / [Audemars Piguet](https://www.audemarspiguet.com/) | Editorial restraint, huge type, quiet-luxury craftsmanship storytelling |
| [Basic/Dept](https://www.basicagency.com/) | Scroll-driven background color shift; floating pill nav; editorial confidence |
| [Framer](https://www.framer.com/) | Glow, light-on-dark UI, soft motion; ImageWheel floating gallery |

**Light / shop mode** (Shop, Product, Cart, Checkout):

| Reference | What the client is extracting |
|---|---|
| [Louis Vuitton](https://www.louisvuitton.com/) | White, tons of whitespace, big product photos front-and-center, clean grid |
| [Balmain](https://us.balmain.com/) | Product-first minimal chrome; **footer** (sections/socials/legal/lang+country) is the footer reference |

**Key insight:** The client never says *"copy this site."* He says *"I like this part / this animation / this menu / this ending."* Nostrum must have its **own identity**, borrowing the best *interactions* and *visual cues* — not cloning any single site. *"Dark to browse the brand, bright and clean when it's time to buy."*

---

## 2. Design Principles

1. **Luxury first** — every interaction feels intentional and refined; exclusive & expensive.
2. **Minimal but cinematic** — space + motion over clutter. **Premium = restraint.**
3. **Tell the story, don't list products** — the brand is dark storytelling; the shop is where you transact.
4. **Agriculture soul** — family, from-the-land warmth must survive the luxury polish. Not a cold supercar.
5. **Motion with purpose** — animation guides attention, never distracts; subtle and performant.
6. **Photography is ~80% of the result** — layout elevates professional images; placeholders clearly temporary.
7. **Fewest words possible** — exact words only; the design and photos do the talking (History is the exception).

Mood: **Luxury. Quiet. Confident. Warm. Cinematic.**

---

## 3. Color System — CONFIRMED PALETTE (client's proposal)

> The client provided an explicit palette in the brief, framed as *"a starting palette… tweak as needed - hex values so you have a concrete base."* It **keeps the agriculture feel (dark browns/greens/black)** plus the **logo lime, gold and white as accents.** This **supersedes** the earlier inferred near-pure-black palette. Colors & fonts remain on the client's "open items" list (§20) — *"palette above is a proposal… let's finalize together."*

**The rule of two modes:** **Dark everywhere, white in the Shop.**

```css
/* ── Brand/dark backgrounds (Home, History, Contact, B2B) ── */
--nostrum-ink-black:  #14160F;  /* primary background — warm near-black */
--nostrum-deep-olive: #1E2A16;  /* alternate sections / depth */
--nostrum-bark-brown: #2C2117;  /* alternate sections / warmth */

/* ── Accents — "the jewelry", used sparingly ── */
--nostrum-leaf-green: #3B7A3E;  /* natural green, secondary/organic accent */
--nostrum-logo-lime:  #A6CE3A;  /* the logo lime — CTAs, highlights, accents */
--nostrum-gold:       #E6B422;  /* metallic gold — accents, CTAs, light/motion */

/* ── Whites & text ── */
--nostrum-warm-white: #FAF8F2;  /* the SHOP background (bright/white section) */
--nostrum-off-white:  #EDEBE3;  /* body/text on dark */
--nostrum-pure-white: #FFFFFF;  /* pure white where needed */
```

**Usage (client's own "rough usage" note):**
- **Black / olive / brown → backgrounds on brand pages.** (Layer them for depth; warm near-black is the canvas, not flat pure black.)
- **Lime + gold → accents, CTAs, highlights — use sparingly, "they're the jewelry."** Both are legitimate accents. *(Correction to earlier drafts: lime is **not** footer-only; the client explicitly names lime **and** gold as the accent pair.)*
- **Leaf green** is the softer, organic green for natural/agriculture moments.
- **Warm white (`#FAF8F2`) → the Shop background** — the bright section. *(Correction: the light section is the **Shop**, not Contact. Contact is **dark**.)*
- **Off-white (`#EDEBE3`) → text on dark.**

Rules:
- Brand pages default to the dark warm-black/olive/brown family.
- **Lime and gold are precious** — CTAs, key highlights, the light-streak motion (gold), the logo mark (lime). Never flat-fill large areas with them.
- Keep it restrained — a handful of colors on screen at once. Restraint = luxury.
- The light-streak hero motion is **golden** (client confirmed, §7).

---

## 4. Typography

> Not locked — the client left it to us with a clear direction, on the "open items" list (*"fonts still open, let's finalize together"*).

**Direction (client's words):** *"an elegant, slightly editorial display face for headlines (premium, a little character) + a clean, highly readable sans for body/UI."*

Hard constraints:
- **Keep it to 2 families.**
- **Must support ES / CA accents** (and **CJK** if we add Chinese).
- **Avoid generic / overused fonts.**
- Huge type, very little text, lots of whitespace. **No dense paragraphs** (except History).

Type rules:
- **Display / hero:** oversized, editorial, tight tracking, poster scale (`clamp(3rem, 12vw, 14rem)`). A little character/personality.
- **Body / UI:** refined, highly readable sans/grotesk; short and sparse; generous line-height.
- Small eyebrows/labels: uppercase, wide letter-spacing.
- Headlines may animate in **word-by-word.**
- Candidate pairings to propose (confirm licensing): an editorial display (e.g. a refined serif/didone or characterful display) + a clean neo-grotesk (Neue Montreal / Suisse Int'l / similar) — must carry ES/CA diacritics and ideally have a CJK companion.

---

## 5. Tone of Voice

**Confident, warm, few words.** Premium **but not cold** — it's a **family, from-the-land** brand. **Say the essential and stop.** Let photos and space do the talking — **except History**, where we tell the real story.

Practical: no marketing filler, no walls of text, no generic e-commerce copy. Every string earns its place. B2B copy uses the *"¿Eres chef profesional?"* tone — an invitation to a relationship, not a sales pitch.

---

## 6. Sitemap & Global Elements

**Main nav = four items.** Login/account and cart sit in the **top corner** (luxury-site pattern). B2B lives as its **own small section** (final format still to decide — §20). **WhatsApp button floats on every page.**

```
NOSTRUM.com
├─ Home     · dark        · the brand moment (hero, cinematic; CTA into Shop; home of the animation ideas)
├─ Shop     · LIGHT/white · product listing → product page → cart → checkout
├─ History  · dark        · story, text + photos (the one text-rich page)
├─ B2B      · dark        · small block at the END of the Shop + CTA on Home & across the site
├─ Contact  · dark        · form + details
├─ Account  · login → client portal (orders, invoices, shipping)
└─ Admin    · private      · owner only (orders, customers, content)

Global: language switcher (ES / EN / CA · maybe ZH) · WhatsApp float · cookie banner · footer
```

**Global elements (every page):**

- **Languages — ES · EN · CA from day one.** Chinese (ZH) **only if it's easy** with the chosen setup — *"if it's a hassle, skip it, not a priority."* **Build multilingual-ready** so ZH can be added later **without rebuilding.**
- **WhatsApp (not a chatbot) — floating WhatsApp bubble, bottom-right, with the arrow, on every page.** That's the *"contact us"* shortcut. The chatbot idea is **dropped.**
- **Cookies — small cookie consent banner**, same style/approach as the one used on **GetKinetIA**. *"Nothing fancy."*
- **Nav — minimal top nav:** logo **center or left**, menu + **search** + account + cart.
- **Footer — sections, socials, legal, language + country.** **Balmain footer is the reference.**

*(Correction to earlier drafts: Nostrum is a **multi-page site with a four-item nav**, not a single long scrollytelling page. The cinematic scene-storytelling lives primarily on **Home** and **History**. The nav explicitly includes **search**.)*

---

## 7. Page by Page

Only **Shop** and **Product** get rough layout sketches (the light/white part); everything else is described in words.

### Home · dark
The **brand moment.** Big hero, cinematic, dark — *"should feel premium the second it loads."* A **strong CTA into the Shop.** This is where the **animation ideas (§9) live.** Also carries a **B2B CTA** pointing to the B2B block (§7 · B2B).

### Loading / intro · dark (wanted — the client likes loaders)
A **branded loading/intro moment** on first load — the client **likes loaders a lot**, so this is an asset, not a risk to minimize. Make it *feel* premium and set up the hero (e.g. the wordmark resolving, or the **golden light-streaks igniting** into the hero, §9.1). **Constraints (his guardrails, §9/§18):** must not fight *"premium the second it loads"* or the performance budget — keep it **short, skippable/self-dismissing, GPU-cheap, and reduced-motion-safe** (near-instant fallback). Fine to reuse as a subtle route-transition veil between dark pages; the **Shop** should feel instant, not gated behind a heavy loader.

### Shop · LIGHT / white
Flips bright: **white, lots of whitespace, product photos front and center** (LV / Balmain). **Clean grid, minimal chrome.** Flow: **product list → product page → cart → checkout.**

```
≡ MENU · SEARCH            NOSTRUM            ◎  ⌂  🛒 0
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│               │  │               │  │               │
│   Product 1   │  │   Product 2   │  │   Product 3   │
│               │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
   ↑ big product images · minimal text · price · quick add-to-cart on hover
```

**Products (for now):** olive oil **bottles, mainly 5L**, sold as **x1 / x2 / x3 packs**, plus **other sizes.** Around **~€35 for the 5L + shipping** (price **not final**). **Maybe honey later** (not confirmed) — so **build the catalog flexible enough to add product types.**

### Product page · LIGHT
```
┌─────────────────────────┐   Product name · €price
│                         │
│                         │   Size selector: pick the size here
│   BIG PRODUCT IMAGE(S)  │
│                         │   Quantity: x1 · x2 · x3  OR free custom
│                         │   amount (don't limit the client, they pick)
│                         │   · ADD TO CART
│                         │
└─────────────────────────┘   Short description · shipping note (keep it tight)
```
- Big product image(s) dominate.
- Name · €price.
- **Size selector.**
- **Quantity:** x1 / x2 / x3 **or a free custom amount — don't limit the client, they pick.**
- Add to cart.
- **Short** description + shipping note — keep it tight.

### History · dark
The **storytelling page** — *"the one place we go deeper with real text and photos."* **Scroll-driven, editorial, cinematic.** **Content not ready yet** — leave **rich placeholders** so real copy + images drop in later.

### Contact · dark
Form + details. Dark, on-brand. *(This is a **dark** page — not the light section.)*

### B2B — "for professionals" · small block at end of Shop
*"This is **not** a bulk-buy online store."* It's *"let's build a proper business relationship — get in touch."* Aimed at **restaurants, chefs, distributors.** Tone = the **"¿Eres chef profesional?"** card.

**Plan:** probably not enough content for a full B2B section, so **keep it simple — a small block at the end of the Shop, plus a CTA on Home and across the site** pointing to it. **What it needs:** a **clear pitch** + an **easy way to reach out** (form + direct commercial **email / WhatsApp**).

**Open:** B2B format — **own section vs. blocks within pages — still to decide** (§20).

---

## 8. Accounts — Login, Client Portal & Admin (all confirmed in scope)

### Login
Standard login / register (same kind of setup as **GetKinetIA**) — **but Google sign-in MUST actually work this time.** On GK.IA the Google login is **broken** and the client *"literally can't get into that area."* **Do not repeat this.** Required: **email + password + a working Google option.**

### Client portal (logged-in customer)
- **Order history** — past orders with details of each purchase.
- **Active orders** — current orders with **shipping status** + order details.
- **Invoices** — **downloadable.**
- **Shipping / account details** — addresses, contact info.
- **CTA to buy more** — a clear *"order again / shop"* button inside the portal.
- **No wishlist / favorites** — too few products for it to be useful.

### Admin panel (owner only)
Same idea as the GetKinetIA admin **but more extensive** (on GK.IA he could only see chatbot tickets + edit the blog). Here it's mainly **shop operations:**
- **Orders** — all orders placed, full details and their data.
- **Customers list** — a table/list of customers + their data (name, email, etc.), **exportable** — the client wants this for **email marketing later** (an exportable list of client info from orders).
- **Shop management** — products, prices, stock, sizes/packs.
- **General store admin** — whatever makes running the shop day-to-day easy.

> **GDPR (required):** a customer/email list + email marketing means we **handle GDPR properly** — **consent checkbox on signup/checkout + privacy policy.** *"Let's make sure that's covered."* (Spain/EU → also LSSI-CE for cookies; §16.)

---

## 9. Motion & Interaction Ideas (options to explore)

The client has ideas **especially for the Home page.** Treat these as **options** — *"I don't need all of them, let's pick what looks best."* **Rive (rive.app)** could be an option for the richer ones. **Keep all of it subtle and performant — premium = restraint. Nothing that hurts load time or feels gimmicky. Respect reduced-motion settings.**

1. **Light-streaks / car-light trails** — **fast golden light streaks** across the dark hero (*"that premium-car energy"*). Subtle, on load or on scroll. *(The light is **golden** — confirmed.)*
2. **Spinning olives on scroll** — olives that **rotate on their own axis** (the **body** of the olive, **not tumbling**) as you scroll down. A **signature detail.**
3. **Hand-drawn / sketch illustration** — a hand-drawn, **sketch/esbozo-style** element (olives, branch, the logo mark) — gives **craft & agriculture warmth** against the dark.
4. **"Draining / pouring" CTA + leaf sound** — an oil drip/pour (*"escurrir"*) micro-animation on a **CTA into the Shop.** Optional soft **ambient leaf sound** on the site — **toggleable.**

**Motion direction:** slow, elegant, custom easing (~0.8–1.2s, expo/power3-style). Scroll reveals = fade + slight rise + clip-path mask. Purposeful only. **Respect `prefers-reduced-motion`.**

---

## 10. Navigation, Menu, Cursor & Micro-interactions

*(Grounded in the client's earlier reference cues; consistent with the dark/luxury brief.)*

- **Menu — Rolls-Royce split-screen.** Menu links on one side; the **actual current page background image, blurred,** bleeds through on the other (not a flat overlay). Open/close with **blur + fade + scale**, smooth easing — no instant popup. Links large, sparse, letter-spaced. Nav includes **search.**
- **Cursor — zero lag.** Custom small circle tracking the mouse with **no lerp/easing/delay** (the client liked that the Rolls cursor *"doesn't have a delay"*). Grows/changes state on hover; hover effects = reveal, scale, fade, mask, blur, glow. (Magnetic buttons = optional polish, not requested.)
- **Footer — poster-scale wordmark.** Oversized **"NOSTRUM"**, minimal links, plus the Balmain-style **sections / socials / legal / language + country.**

---

## 11. Imagery & Video

- **Photography is ~80% of the result.** Layout must elevate professional shots; placeholders clearly temporary. **Professional product & brand photography is still to come** (client open item, §20) — use placeholders meanwhile.
- **Video** only if professionally shot; sparingly, muted, looped, as scene texture — never a cheap background.
- Optimize everything (Cloudinary / `next/image`).

---

## 12. WhatsApp Lead Capture (replaces the chatbot)

**Decision (from the brief):** **No chatbot** — a **floating WhatsApp bubble** instead, **bottom-right, with the arrow, on every page.** It's the *"contact us"* shortcut and doubles as the **B2B** reach-out channel.

**Implementation:**
- **Click-to-chat deep link** — `https://wa.me/<E.164>?text=<prefill>`; opens WhatsApp app on mobile / WhatsApp Web on desktop. No API key, no fees, no backend.
- **Pre-filled message varied by entry point** — general enquiry vs. the **B2B "¿Eres chef profesional?"** block get different prefills, so leads arrive pre-qualified.
- **Placement** — persistent floating control bottom-right on every page + contextual CTAs in Contact and the B2B block.
- **On-brand — never a stock green WhatsApp bubble.** Obey the palette (§3), cursor (§10), motion (§9): a discreet dark pill / thin outline with the WhatsApp glyph **and the arrow**, gold/lime glow on hover, slow entrance. A luxury concierge affordance, not a support widget.
- **Accessible** — real `<a>` with `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`.

**Pending (§20):** business WhatsApp number (E.164); preferred prefill(s) & language.

---

## 13. Tech Stack — the client's call (Shopify vs. custom)

> The client leaves the stack **100% up to us** — *"you know best."* His one thought: **Shopify could make sense** given the shop, accounts, orders, invoices and multi-language needs (it'd cover a lot of the admin out of the box). **But custom is fine too** — just factor in the constraints below. He warns: **"Shopify theming can be restrictive, so weigh that"** against the custom dark design + animations.

**Constraints any stack MUST satisfy (client's list):**
- **Multilingual** — ES / EN / CA, maybe ZH; multilingual-ready without a rebuild for ZH.
- **Working Google login** — non-negotiable (GK.IA's was broken).
- **Admin + customer-export** needs (§8) — orders, customers list (exportable), shop management.
- **The custom dark design + animations** (§3, §9) — the reason Shopify theming is a risk.

**Recommendation — decision tree (to confirm with client):**

| If… | Then |
|---|---|
| Boutique catalogue (~few SKUs: 5L + packs + a few sizes), simple, brand-led, no subscriptions | **Custom Next.js storefront + Stripe Checkout** — full control of the bespoke luxury UI + animations; least platform tax. We build the admin/portal. |
| Client wants to **self-manage** products/orders and/or a growing catalogue, honey line, subscriptions | **Shopify (Headless / Storefront API)** behind the custom Next.js front-end — real commerce admin, orders/invoices/inventory out of the box, while we keep the bespoke design. |
| — | **Avoid a themed Shopify/Amazon storefront** — it breaks the whole dark→light luxury design language. |

**Working hypothesis until confirmed:** boutique catalogue, a few size/pack variants, Spain + EU shipping, IVA/VAT, **accounts + portal + admin all required.** The self-manage + custom-design tension points to **Shopify headless** (admin/invoices for free, custom front-end) **or** **custom + Stripe** (we build admin/portal). **The animation-heavy dark design is the strongest argument for a headless/custom front-end** regardless of the commerce backend.

**Proposed stack (dark front-end + real commerce):**

| Layer | Choice |
|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** (palette §3 as CSS vars) |
| Animation | **GSAP** + **ScrollTrigger**; **Rive** for the richer hero pieces (client-suggested) |
| Smooth scroll | **Lenis** |
| Hero light / 3D | **React Three Fiber / Three.js** (+ shaders) for golden light-trails; **Spline** for lightweight 3D |
| Micro-interactions | **Framer Motion** / **Motion One** |
| Commerce | **Shopify Storefront API** *(if self-managed)* **or** **Stripe + Postgres/Neon** *(if custom)* |
| CMS | **Sanity** (editable copy, History content, products' editorial, translations) |
| Media | **Cloudinary** / `next/image` |
| Auth | Email/password **+ working Google OAuth** (§8) |
| Email | **Resend** (order confirmation, shipping, wholesale replies) |
| Lead capture | **WhatsApp `wa.me`** click-to-chat (§12) |
| Hosting | **Vercel** (edge/CDN, ISR, preview deploys) |
| i18n | Next.js i18n routing + `hreflang`, translations in CMS |

---

## 14. Commerce Scope

**Confirmed from the brief:**
- **Products now:** olive oil bottles, **mainly 5L**, sold as **x1 / x2 / x3 packs + other sizes.** ~**€35 / 5L + shipping** (not final).
- **Catalog must be flexible** — **honey may be added later** → build product-type-agnostic schema.
- **Quantity is unrestricted** — x1/x2/x3 quick picks **or a free custom amount** (§7 Product page).
- **Guest checkout should exist** (accounts are for the portal; forcing signup kills luxury DTC conversion) — confirm.
- **B2B is not bulk-checkout** — it's a lead/relationship flow via form + email/WhatsApp (§7 B2B), **not** a wholesale cart at launch.

**Still to confirm:** exact SKU count & size ladder, subscriptions (seasonal harvest?), inventory tracking, shipping scope (Spain only vs EU/intl), tax (Spanish IVA / EU VAT-OSS), final prices, honey go/no-go.

---

## 15. Data Model (if custom + Stripe; Shopify owns most of this if headless)

If Shopify headless, Shopify owns products/variants/orders/customers/inventory and we store little. If custom + Stripe, proposed core entities:

```
User        (id, email, name, role: consumer|admin, locale, created_at)
Address     (id, user_id, type: shipping|billing, lines, city, postcode, country)
Product     (id, slug, name, type: oil|honey|…, story, size, status, cms_ref)
Variant     (id, product_id, size, pack: x1|x2|x3|custom, sku, price, stock)
Order       (id, user_id?, guest_email?, status, totals, currency, created_at)
OrderItem   (id, order_id, variant_id, qty, unit_price)
Invoice     (id, order_id, number, pdf_url, issued_at)          ← downloadable in portal
Lead        (id, source, segment: consumer|chef|distributor, message, created_at)
NewsletterSubscriber (id, email, locale, consent_at)            ← GDPR consent tracked
```

Proposed store if custom: **Postgres (Neon/Supabase)** + Prisma/Drizzle. Keep PII minimal (GDPR §16). **Customers list must be exportable** for the client's email marketing (§8).

---

## 16. Legal, GDPR & Compliance (Spain/EU)

*(Inference: the client's prior project GetKinetIA + Catalan naming → business is very likely Spain/Catalonia. Confirm region.)*

- **Consent** — cookie-consent banner (client's GK.IA style) **before** analytics/pixels fire; **GDPR consent checkbox on signup/checkout**; privacy policy + legal notice. Spain adds **LSSI-CE** for cookies.
- **Email marketing** — the exportable customer list (§8) is used for marketing → **explicit consent required**, unsubscribe handling, retention policy.
- **Tax** — Spanish **IVA**; **EU VAT-OSS** if cross-border (a reason to lean on a platform that computes VAT).
- **Legal content is a client open item** (§20) — privacy policy, legal notice, cookies text still to prepare; use placeholders.

---

## 17. Integrations (Spain-aware defaults to confirm)

| Concern | Recommended default | Notes |
|---|---|---|
| **Payments** | **Stripe** (cards, Apple/Google Pay) | **Redsys** is the dominant Spanish bank gateway — confirm what the client's bank requires; **PayPal** as trust add-on. |
| **Shipping** | Rates at checkout | Spain: Correos, SEUR, MRW, GLS; EU/intl: DHL/UPS. Flat vs live rates? Free-shipping threshold? |
| **Tax** | Spanish **IVA**; EU **VAT-OSS** | |
| **Auth** | Email/password **+ Google OAuth (must work)** | §8 — do not repeat the GK.IA breakage. |
| **Email** | **Resend** (React Email) | Order confirmation, shipping, B2B replies. |
| **Newsletter** | Resend Audiences / Mailchimp / Klaviyo | For the email-marketing list. |
| **Analytics** | GA4 (+ Meta Pixel if ads) | Behind cookie consent. |
| **Consent** | CMP (GDPR + LSSI-CE) | Client's GK.IA cookie style. |
| **WhatsApp** | `wa.me` click-to-chat | §12 — already scoped. |
| **Media** | Cloudinary / `next/image` | §11. |

---

## 18. SEO & Performance

**SEO:** Olive oil is high-intent and content-rich (recipes, health/polyphenols, "best olive oil," gifting).
- **Multilingual** ES / CA / EN with Next.js i18n + `hreflang` + per-locale metadata + CMS translations; ZH-ready.
- **Structured data:** `Product` + `Offer`, `Organization`/`LocalBusiness` (mill/estate), `BreadcrumbList`, `FAQPage`, and `Recipe` (huge for olive oil) if a recipes module is added.
- Dynamic `sitemap.xml`, `robots.txt`, canonicals, clean slugs, OG/Twitter cards (critical for the image-led brand).

**Performance (this is where luxury sites die):** GSAP + R3F + video + heavy hero imagery can tank Core Web Vitals. Hard budgets:

| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s (mobile, mid-tier) |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| Lighthouse Perf | ≥ 90 content pages / ≥ 80 hero-WebGL page |
| First-load JS | ≤ ~200 KB gz; R3F/GSAP code-split & lazy |
| Hero image | ≤ ~300 KB (AVIF/WebP, responsive) |
| Video loop | ≤ ~3–5 MB, muted, `preload=none`, poster, lazy |

**Rules:** respect `prefers-reduced-motion` (degrade hero + scroll effects); lazy-load below the fold; defer WebGL until the hero is in view; pause R3F offscreen; SSR/SSG the content, WebGL non-blocking. Client's own words: *"nothing that hurts load time or feels gimmicky."*

---

## 19. Hosting Architecture

```
                        ┌────────────────────────┐
        Visitor  ─────► │  Next.js (App Router)   │  ◄── Vercel (edge/CDN,
                        │  SSR/SSG + ISR + i18n   │      previews, prod)
                        └───────────┬────────────┘
        ┌──────────────┬───────────┼──────────────┬───────────────┐
        ▼              ▼           ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐   ┌──────────┐
   │ Sanity  │   │ Shopify  │  │Cloudinary│  │  Resend  │   │  GA4 +   │
   │  CMS    │   │(headless)│  │  media   │  │  email   │   │   CMP    │
   │ content │   │   OR     │  └──────────┘  └──────────┘   └──────────┘
   └─────────┘   │ Stripe + │
                 │ Postgres │──►  Google OAuth (working) · WhatsApp wa.me (no backend)
                 │ (Neon)   │
                 └──────────┘
```

- Front-end: **Next.js on Vercel** (Next hosting, edge CDN, preview deploys, image optimization).
- Commerce: **Shopify Storefront API** *(self-managed)* **or** **Stripe + Postgres/Neon** *(custom)* — per §13/§14.
- Content: **Sanity.** Media: **Cloudinary.** Email: **Resend.**
- WhatsApp number & prefills configurable via CMS/env, **not hardcoded.** No keys in the repo; per-env secrets.

---

## 20. Open Items — pending on the CLIENT (from the brief)

The client's own list of what's still on his side. **Use placeholders where noted; don't block build on these where structure is clear.**

1. **History content** — good story, **not written/verified yet.** Pending → **rich placeholders.**
2. **Copy in each language** — client will help a lot with **ES / CA** (and maybe ZH) wording so it's natural and error-free (as on GK.IA).
3. **Professional photos & camera visuals** — proper product & brand photography **still to come** → placeholders.
4. **Legal** — privacy policy, legal notice, cookies text **to prepare.**
5. **Prices** — **~€35 for 5L is a ballpark, not confirmed.** **Honey: undecided.**
6. **Contact details** — email, phone, address, **WhatsApp number**, socials: **not yet** → placeholders.
7. **Colors & fonts** — palette (§3) is a **proposal**; **fonts still open.** Finalize together.
8. **B2B format** — **own section vs. blocks within pages: to decide** (§7 B2B).
9. **Chinese (ZH)** — **only if it's easy** in the chosen setup (§6).

> **External services** are on the client, but *"most of them will be integrated into the web, so once we start working we'll sort them out as we get into the flow."*

---

## 21. What We Owe the Client Back (before "then we start")

The client explicitly asked: *"tell me what's tricky, what you'd do differently, and rough timing/cost."* Deliverables to prepare:

1. **Reaction to the brief** — confirm the direction, flag anything tricky (esp. Shopify-theming-vs-custom-animation tension §13; Google-login reliability §8; performance budget §18).
2. **Commerce-stack recommendation** — Shopify headless vs. custom + Stripe, with the trade-off in plain terms (self-management vs. design control).
3. **Rough timing & cost** — phased: **launch** (Home/Shop/History/Contact/B2B block/accounts/portal/admin, ES-EN-CA, WhatsApp, cookies/GDPR) vs. **later** (ZH, honey line, subscriptions, richer B2B section, extra content modules).
4. **A first-pass palette + font proposal** to finalize together (§3, §4).
5. **Confirmation the chatbot line is removed** from any quote and replaced by the WhatsApp integration (§12) — lower cost.

---

## 22. Asset Index (`/assests`)

| File | What it is / use |
|---|---|
| `Nostrum.pdf` | **The client's official website brief (2026-07-03)** — the source of truth this spec is built from. |
| `golden-curved-light-line-rope-…webp` | Gold light-streak — hero light-trail reference (§9.1). |
| `Screenshot …¿Eres chef profesional?…` | B2B tone reference — dark ink on paper (§7 B2B). |
| `Screenshot …red road light-trails…` | Car-light-trail hero motion reference (§9.1). |
| `Screenshot …Louis Vuitton grid…` | **Shop** layout reference — white, whitespace, big product photos (§7 Shop). |
| `Screenshot …Balmain footer…` | **Footer** reference — sections/socials/legal/lang+country (§6, §10). |
| `Screenshot …Bugatti…` | Oversized wordmark on near-black (§10 footer). |
| `Screenshot …Rolls "Spectre"…` | Minimal cinematic hero (§7 Home). |
| `Screenshot …Rolls split-screen menu…` | Menu reference (§10). |
| `Screenshot …Bang & Olufsen footer…` | Oversized footer wordmark (§10). |
| `Screenshot …Framer ImageWheel…` | Floating 3D gallery — optional gallery model. |
| `Screenshot …Framer glow…` | Glow, light-on-dark, soft motion (§9). |
| `Screenshot …Basic Agency…` | Scroll-driven background color shift; floating pill nav. |

---

## 23. Quick Enforcement Summary (the do/don't)

**Do**
- **Dark brand pages** (ink-black/olive/brown backgrounds), **bright white Shop.**
- **Lime + gold as sparing accents** ("the jewelry"); ES/CA-safe editorial display + clean sans; ≤ a handful of colors.
- Oversized type, sparse copy, generous whitespace; more text only on **History.**
- Cinematic dark hero with **golden light-streaks**; spinning-olives-on-scroll; sketch/agriculture warmth; pouring-CTA — **all optional, subtle, performant, reduced-motion-safe.**
- Zero-lag cursor; Rolls split-screen menu; poster-scale wordmark + Balmain-style footer with **search** in nav.
- **Accounts + client portal (orders/active/invoices/shipping/CTA-to-buy, no wishlist) + extensive admin (orders/exportable customers/shop-management).**
- **Working Google login.** **Guest checkout.** **Flexible catalog** (honey-ready), unrestricted quantity.
- **ES/EN/CA** from day one, **ZH-ready**; floating **WhatsApp** on every page; **GK.IA-style cookie banner + GDPR consent.**

**Don't**
- Make the Shop dark or the brand pages white (respect the two-mode split).
- Flat-fill big areas with lime/gold; use >a handful of colors; dense paragraphs (except History).
- Build a **chatbot** (dropped) or a stock green WhatsApp bubble.
- Ship a themed Shopify/Amazon storefront that kills the dark→light design.
- Break Google login. Force account creation to buy. Hardcode contact details / WhatsApp number.
- Let GSAP/R3F tank Core Web Vitals; ignore `prefers-reduced-motion`.
