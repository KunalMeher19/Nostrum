# Nostrum — Design Language & Build Spec

> **One-sentence brief:** Nostrum is not an e-commerce site. It is a *luxury brand experience that happens to sell products.* Story first, product second.

This document is the single source of truth for the look, feel, motion, and architecture of the Nostrum website. It was synthesized from the client's reference sites, screenshots, and verbal cues.

> ⚠️ **Status: working design hypothesis, not a locked spec.** Most of what follows is inferred from the client's *reference sites and visual cues* — not from a full brand brief. One fundamental **is** confirmed: **Nostrum is an olive oil factory / producer** (see §0). The rest of the brand fundamentals (business model, target audience, core purpose/vision) are still open. The visual and interaction direction (color, motion, menu, hero, cursor) is well-grounded in the references and unlikely to change much; the **strategy, positioning, structure, and copy are provisional** until §0 is answered. Treat §0 and §15 as blocking before development.

---

## 0. Project Fundamentals — Pending Client Input (BLOCKING)

Before this document can move from "design hypothesis" to "build spec," we need the client to define the brand itself. These are **not** design questions — they are the foundation every design decision should serve.

**Confirmed:**

- **What Nostrum is.** Nostrum is an **olive oil factory / producer**. This is the anchor for the whole brand story: heritage, craft, place (the groves/mill), and the product itself. It fits the references cleanly — "quiet luxury" olive oil, storytelling over catalogue, and the "¿Eres chef profesional?" screenshot points to a professional/restaurant channel for the oil.

**Still unknown (confirm before scope/timeline/quote):**

1. **The business.** What is the business model — DTC retail of bottled oil, B2B/wholesale to restaurants and chefs, bulk/distribution, or a mix? Is there a physical mill/estate or boutique presence to feature?
2. **Target audience.** Who is the primary visitor — end consumers, professional chefs/restaurants, distributors? The site's whole tone and structure hinge on this.
3. **Purpose & vision of the website.** What is the site *for* — brand-building/storytelling, lead generation, actual online sales, wholesale onboarding? What does success look like?
4. **The suggested "first-impression" idea.** The client proposed an opening/first-impression concept in the earlier thread that we're keen on — confirm the exact idea and intent so the hero (§6) is designed around it rather than around our own assumption.
5. **Product range & story.** Range of oils (varietals, single-estate, blends, sizes), and the heritage/craft story behind the mill — this is the raw material for the brand narrative.

Now that we know it's olive oil, revisit §6 (hero): the "light through darkness" energy can lean into **golden oil / warm light**, which aligns naturally with the confirmed gold/amber palette (§3).

---

## 1. Brand Positioning

> *Inferred from the reference sites — to be validated once §0 is answered. If the client's actual audience/purpose differs (e.g. a B2B wholesale focus), this positioning and the structure in §5 may shift.*

Nostrum should read as: **Premium · Luxury · Minimal · Editorial · Cinematic · Emotional · Expensive · Story-first.**

The client's references are *feeling-sellers*, not catalog-sellers:

| Reference | What the client is extracting |
|---|---|
| [Bugatti](https://www.bugatti.com/) | Poster-scale typography, near-black canvas, oversized wordmark footer |
| [Rolls-Royce](https://www.rolls-roycemotorcars.com/) | Split-screen menu, cinematic blur/scale reveal, "Spectre" minimal hero |
| [YSL](https://www.ysl.com/) | Fashion-editorial restraint, huge type, sparse text |
| [Audemars Piguet](https://www.audemarspiguet.com/) | Craftsmanship storytelling, quiet luxury |
| [Balmain](https://us.balmain.com/) | Minimal contact/footer blocks, generous whitespace, large wordmark |
| [Aston Martin](https://www.astonmartin.com/) | Cinematic motion, dark elegance |
| [Bang & Olufsen](https://www.bang-olufsen.com/) | Poster-like oversized footer branding, clean product cards, breathing room |
| [Locomotive](https://locomotive.ca/en) | **Only** the immersive video/heading hero moment — *not* the overall aesthetic (client: "a more modern website… we are not looking for this style") |
| [Basic/Dept](https://www.basicagency.com/) | **The scroll-driven background color shift** ("the colour change when you go all the way down"); floating pill nav; editorial confidence |
| [Framer](https://www.framer.com/) | Glow, light-on-dark UI, soft motion |

**Key insight:** The client never says "copy this site." He says *"I like this part / this animation / this menu / this ending."* Nostrum must have its **own identity**, borrowing the best *interactions* and *visual cues* — not cloning any single site.

---

## 2. Design Principles

1. **Luxury first** — every interaction feels intentional and refined.
2. **Minimal but cinematic** — avoid clutter; let motion and space create impact.
3. **Tell the brand story** — don't just list products.
4. **Motion with purpose** — animation guides attention, never distracts.
5. **Photography is part of the design** — layout elevates professional images (~80% of perceived quality is the imagery).
6. **Consistent visual language** — black, lime green, clean type, smooth transitions, subtle lighting throughout.

Mood in five words: **Luxury. Quiet. Confident. Editorial. Cinematic.**

---

## 3. Color System

Black is the canvas. White is an accent. **Light is gold/amber. Green is one reserved moment.**

> 📄 **Incoming (2026-07-02): client's own specs PDF** — color palette, tone, etc. **Explicitly framed by the client as a "first direction," not a strict brief.** His words: don't take it *"in a strict direction… maybe once we start working on it, we will see what actually matches more and what feels more in place."* So treat his PDF as the **starting reference to reconcile against this section**, not a hard override — expect palette/tone to flex during build. When it arrives: compare it to the inferred palette below, flag conflicts (especially the gold-vs-green rule), and align with the client rather than assuming either source wins outright.

> ⚠️ **Important — do not make green the site-wide accent.** The client said "cool green" exactly once, and only in the context of a Bang & Olufsen–style oversized footer wordmark ("we could do something like this but with a cool green"). Every light-trail/motion asset he actually provided is **warm gold/amber** (the gold streak asset) or **red/amber** (the highway photos). So: **gold/amber drives all light, trails, glow, and motion; green is reserved for the single footer wordmark moment.** Using lime as the global accent would clash with his own reference assets.

```css
/* Core */
--nostrum-black:      #050505;  /* primary background */
--nostrum-near-black: #090909;  /* alternate sections */
--nostrum-charcoal:   #111111;  /* cards, raised surfaces */
--nostrum-grey:       #1a1a1a;  /* borders, dividers */

/* Accents */
--nostrum-white:      #f5f5f3;  /* primary text on dark, accent */
--nostrum-soft-grey:  #8a8a8a;  /* secondary/muted text */

/* Light & motion — the primary signature (warm) */
--nostrum-gold:       #e6b45a;  /* light trails, glow, hero energy (tune with client) */
--nostrum-amber:      #ff8a3d;  /* hotter highlights in trails/road-light moments */

/* Reserved accent — footer wordmark ONLY */
--nostrum-green:      #9bd64a;  /* "cool green" B&O-style footer wordmark only (tune with client) */

/* Light section (Contact) */
--nostrum-paper:      #f4f4f2;  /* the one white/contact section */
--nostrum-ink:        #0e1a26;  /* dark navy-ink text on paper (per contact screenshot) */
```

Rules:
- Default page background is `--nostrum-black`.
- White is used **sparingly** — type, thin lines, the single contact section.
- **Gold/amber** is the light energy — trails, glow, hero, hover/CTA highlights. Not flat fills everywhere.
- **Green is a one-off** — the oversized footer wordmark, and nowhere else unless the client extends it.
- Maximum ~4 colors visible at once. Restraint = luxury.

---

## 4. Typography

Pattern across every reference: **huge type, very little text, lots of whitespace.** The client dislikes dense paragraphs.

- **Display / Hero:** oversized, tight tracking, thin-to-medium weight. Poster scale (think `clamp(3rem, 12vw, 14rem)`).
- **Headings:** large, confident, one line where possible.
- **Body:** short, sparse, generous line-height. Never walls of text.
- **Suggested pairing:** a refined grotesk/neo-grotesk (e.g. *Neue Montreal, Suisse Int'l, PP Neue Montreal, or Inter Tight* as a free stand-in) for UI/body, with an editorial display face for hero moments. Confirm licensed fonts with client.

Type rules:
- Let whitespace carry the layout — don't fill it.
- Headlines can animate in **word-by-word** (Locomotive cue).
- Track display type tight; track small labels/eyebrows wide (uppercase, letter-spaced).

---

## 5. Layout & Scroll Architecture

The site is a **scrollytelling sequence of scenes**, not a stack of generic sections.

```
Hero  (cinematic light in darkness)
  │
  ├── Brand Story
  ├── Featured Products
  ├── Philosophy
  ├── Collection Preview
  ├── Gallery / Lifestyle          ← floating gallery, modeled on Framer's ImageWheel
  ├── Process / Craftsmanship
  ├── Professional Clients / Restaurants   ← "¿Eres chef profesional?" B2B block
  ├── Shop
  ├── Contact   (the single light/paper section)
  └── Large Luxury Footer (poster-scale wordmark)
```

- **Smooth inertia scroll** (Lenis). Every scene transitions; nothing snaps.
- **Scroll-driven background color shift** (Basic Agency cue) — the client explicitly liked *"the colour change of the website when you go all the way down."* The page tone/hue should transition subtly as the user scrolls toward the bottom (e.g. deep black warming or cooling into the footer). Drive with ScrollTrigger; keep it slow and atmospheric, not a hard switch.
- Generous vertical rhythm — luxury spacing between scenes.
- Product grids: big spacing, clean cards, no clutter (Louis Vuitton / B&O cue).

> **Locomotive scope reminder:** borrow only the immersive hero-heading concept from Locomotive — the client said its overall style is *not* the direction. Don't let the design drift toward edgy-agency.

**Gallery / Lifestyle scene** uses the **Framer ImageWheel** (Image 11) as its interaction model — a floating cluster of images that drift/rotate in 3D space, elevating professional photography. Keep motion slow and elegant per §9.

---

## 6. Hero — the centerpiece

The client spent the most time here. **Not** a video background. He wants a *dynamic environment*: light moving through darkness.

Target experience:
> Dark page → thin gold/amber light → moving → drawing lines/trails → mouse reacts → subtle glow → premium typography over the top.

(Light is **gold/amber**, per §3 — green is reserved for the footer only.)

Implementation options (in order of preference):
1. **Canvas / shader light-trails** (React Three Fiber / Three.js or a 2D canvas) — flowing gold/amber light streaks on near-black, motion-blurred, with a mouse-reactive parallax/displacement and a soft bloom/glow.
2. **GSAP-driven SVG/canvas line animation** if WebGL is overkill.
3. Reference imagery for the *feeling*: the gold/amber light-streak asset and the red road light-trail photo in `/assests`.

Hero must stay **subtle and elegant** — light energy, speed, flow. Never flashy or busy.

---

## 7. Navigation / Menu

Model on **Rolls-Royce** — the client called this menu animation *"so cool."* The key mechanic is **not** a standard full-screen overlay:

- **Split-screen.** Menu links occupy one side (left); the other side (right) shows **the actual current page background image, blurred** — the world doesn't disappear, it **bleeds through**. This is architecturally different from a solid overlay: the developer must carry the live page visual into the menu panel (e.g. a blurred snapshot/duplicate of the hero/section background), not a flat color.
- Open/close with **blur + fade + scale**, smooth easing. No instant popups.
- Links are large, sparse, letter-spaced.
- `Menu` / `Close` labels are minimal text, often paired with a hamburger.

---

## 8. Cursor & Micro-interactions

The client explicitly pointed at the cursor and praised the Rolls-Royce one.

- **Custom cursor:** small white circle that tracks the mouse with **ZERO lag** — exact position, **no lerp/easing/follow-delay**. The client specifically liked that the Rolls cursor *"doesn't have a delay."* Do not add smoothing.
- Cursor grows / changes state on hover (over links, buttons, media).
- Hover effects: reveal, scale, fade, mask, blur, light/glow.
- **Suggestion (not client-specified):** magnetic buttons — CTAs pulling slightly toward the cursor. Reasonable for a luxury site, but the client did **not** ask for this; treat as optional polish, not a requirement, and don't budget days for it without confirmation.
- **Avoid:** flying cards, crazy 3D, confetti, anything childish or fast.

---

## 9. Motion Direction

Everything is **slow, elegant, luxury** — never flashy.

- Custom easing (long, soft curves). Default to ~`0.8–1.2s` durations with eased `power3/expo`-style curves.
- Scroll-triggered reveals: fade + slight rise + mask.
- Image/text reveals via clip-path masks.
- Purposeful only — motion guides the eye through the story.

---

## 10. Imagery & Video

- **Photography is 80% of the result.** Layout must elevate professional shots; placeholders should be clearly marked as temporary.
- **Video** only if professionally shot (client's own caveat: "getting the visuals is difficult"). Use sparingly, muted, looped, as scene texture — not as a cheap background.
- Optimize everything (Cloudinary / next/image).

---

## 11. Footer & Contact

- **Footer:** poster-like. **Oversized wordmark** ("NOSTRUM") spanning the width, big typography, minimal links (Bugatti / B&O cue). This is the home for the **reserved "cool green"** wordmark moment (see §3).
- **Contact:** the **single light/paper section** — minimal, big headline, small contact details, lots of whitespace. No fancy form. (Mirrors the Spanish "¿Eres chef profesional…?" screenshot — a calm B2B/contact CTA in dark ink on near-white.)
- **Balmain three-card block (Boutiques / Customer Care / FAQ):** lives on the **Contact page only — NOT the homepage.** The client was explicit: *"we can introduce something like this, but not in the main page, maybe in contact."* Spec it as a contact-page component.

---

## 11.5 Lead Capture — WhatsApp Business (replaces the AI chatbot)

**Decision.** The AI chatbot is dropped; interested visitors route **directly to the business WhatsApp** via on-brand click-to-chat. The bottom-of-page area is **WhatsApp-only for now** — the reference site the client borrowed from stacked other widgets (Google Reviews etc.), but those are deferred (§11.6). *(Confirmed: client emails 2026-07-01 & 2026-07-02.)*

**Reason.** Client wants qualified leads landing in a human WhatsApp inbox (WhatsApp = his CRM), at lower cost/effort for both sides and with no AI service to build, pay for, or maintain. He explicitly rejected a cheaper/weaker bot — remove the concept rather than degrade it.

**Implementation.**
- **Click-to-chat deep link** — `https://wa.me/<E.164>?text=<prefill>` (or `api.whatsapp.com/send`); opens the WhatsApp app on mobile / WhatsApp Web on desktop. No API key, no fees, no backend.
- **Pre-filled message, varied by entry point** — general enquiry vs. the "¿Eres chef profesional?" B2B block (§5) get different prefills so leads arrive pre-qualified and triageable.
- **Placement** — a persistent floating control (bottom-right) on every scene, plus contextual CTAs in the Contact section (§11) and the B2B block (§5).
- **On-brand — never a stock green WhatsApp bubble.** Obey palette (§3), cursor (§8), motion (§9): a discreet dark pill / thin outline with the WhatsApp glyph, gold/amber glow + zero-lag cursor state on hover, slow entrance. A luxury concierge affordance, not a support widget.
- **Accessible** — real `<a>` with `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`.
- **Optional (confirm, don't assume)** — a short "lead form → richer prefill" step; WhatsApp Business catalog/greeting on the client's side.

**Scope/quote note.** Removes the whole chatbot line (no LLM, backend, knowledge base, training, or running cost), replaced by a much smaller WhatsApp-integration line — a net cost reduction, per the client's goal.

**Pending (§15).** Business WhatsApp number (E.164); preferred prefill(s) & language (ES vs. bilingual, B2B vs. general); direct click-to-chat vs. form-first.

---

## 11.6 Deferred — Google Reviews (future, opt-in "peek" pattern)

**Decision.** **NOT in current scope** — the client flagged it as "maybe later" (2026-07-02). Do not build now; captured only so the WhatsApp control (§11.5) leaves room for it and we don't redesign later.

**Reason.** He wants reviews **available on demand, invisible by default**: a permanent badge would fight the black/gold restraint (§3), but fully hidden "won't do anything."

**Implementation (if greenlit).** A discreet edge-docked **side pull-tab/arrow**; reviews sit off-canvas and either (1) **slide out on click** or (2) **auto-peek ~1 min then retract** into the same tab — the same component ± an auto-open timer. On-brand (§3 palette, §8 cursor, §9 slow slide), no stock Google star widget. Dock opposite the WhatsApp FAB (likely left/mid-edge) so they never collide; respect `prefers-reduced-motion`; an auto-peek must not steal focus. Data source TBD (Google Places API vs. cached testimonials) — a live API pull is a separate line item.

**Pending (only if greenlit).** Go/no-go + which variant; which edge & desktop-only vs. mobile; data source & count.

---

## 12. Recommended Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js** + **TypeScript** |
| Styling | **Tailwind CSS** (with the tokens above as CSS vars) |
| Core animation | **GSAP** + **ScrollTrigger** |
| Smooth scroll | **Lenis** |
| Hero / 3D light | **React Three Fiber / Three.js** (+ shaders); **Spline** for lightweight 3D assets |
| Micro-interactions | **Framer Motion**, **Motion One** for simpler effects |
| Media | **Cloudinary** / `next/image` |
| Lead capture | **WhatsApp click-to-chat** (`wa.me` deep link — no API/subscription); see §11.5 |

---

## 13. Do / Don't Checklist

**Do**
- Black canvas, white accent, **gold/amber for light/motion**, green for the footer wordmark only; ≤4 colors on screen.
- Oversized type, sparse copy, generous whitespace.
- Smooth inertia scroll; scene-to-scene storytelling; scroll-driven background color shift.
- Cinematic light-in-darkness hero; subtle glow.
- Custom cursor with **zero lag** (magnetic buttons optional, unconfirmed — see §8).
- Split-screen menu with the live page background blurred and bleeding through.
- Poster-scale wordmark footer; one minimal light contact section.
- Treat photography as a first-class design element.
- Route leads to the **business WhatsApp** via an on-brand click-to-chat control (§11.5) — the chatbot is gone.

**Don't**
- White default background.
- Dense paragraphs / cluttered grids.
- Generic video-background hero.
- Fast, flashy, or childish motion (no confetti, flying cards, crazy 3D).
- More than a handful of colors.
- Amazon/Shopify-theme commerce patterns.
- A stock green WhatsApp bubble/widget — style the click-to-chat control in Nostrum's own language (§11.5).
- Building an AI chatbot — it was dropped; don't re-introduce it or any paid conversational backend.

---

## 14. Asset Index (`/assests`)

| File | What it shows / use |
|---|---|
| `golden-curved-light-line-rope-...webp` | Gold light-streak — hero light-trail reference |
| `Screenshot ...21.26.51.png` | Spanish "¿Eres chef profesional?" — contact/B2B block, dark ink on paper |
| `Screenshot ...22.09.56*.png` | Red road light-trails photo — hero motion reference |
| `Screenshot ...15.46.17.png` | Louis Vuitton grid — luxury product spacing (client sent it but didn't comment — see Open Questions §15) |
| `Screenshot ...16.58.39.png` | Balmain footer — minimal blocks, large wordmark |
| `Screenshot ...17.00.02.png` | Bugatti — oversized wordmark on near-black |
| `Screenshot ...17.00.19.png` | Rolls "Spectre" — minimal hero |
| `Screenshot ...17.00.56.png` | Rolls split-screen menu — menu reference |
| `Screenshot ...17.01.37.png` | Bang & Olufsen oversized footer wordmark |
| `Screenshot ...17.13.59.png` | Framer **ImageWheel** — floating 3D gallery; model for the Gallery/Lifestyle scene (§5) |
| `Screenshot ...17.14.27.png` | Framer — glow, light-on-dark, soft motion |
| `Screenshot ...17.21.06.png` | Porsche header — dark cinematic nav |
| `Screenshot ...14.57.37.png` | Locomotive hero — kinetic type, blue/editorial |
| `Screenshot ...14.59.49.png` | Craft.do floating **pill navbar** — appears at the bottom of the **Basic Agency** scroll; floating-nav reference |
| `Screenshot ...WhatsApp ref (2026-07-01/02)` | Client's WhatsApp Business / lead-capture idea that replaces the AI chatbot (§11.5). **No longer blocking** — 2026-07-02 email resolved it to *WhatsApp-only, styled on-brand*; the reference site's other bottom widgets (Google Reviews etc.) are deferred (§11.6). Ignore the raw badge styling in the shot |

---

## 15. Open Questions for the Client

Confirm these before development to avoid revision cycles. **Foundational (§0) questions come first — they gate everything else.**

**A. Brand & business fundamentals (blocking — see §0)**

> *Confirmed: Nostrum is an olive oil factory / producer. Remaining fundamentals below.*

1. **Business model.** DTC bottled-oil sales, B2B/wholesale to chefs & restaurants, bulk/distribution, or a mix? Any mill/estate or boutique to feature?
2. **Target audience.** Primary visitor — consumers, professional chefs/restaurants, distributors?
3. **Purpose & vision of the site.** Brand-storytelling, lead-gen, online sales, wholesale onboarding? What does success look like?
4. **The "first-impression" idea.** Confirm the exact opening concept the client suggested in the earlier thread so the hero is built around it.
5. **Product range & brand story.** Oils/varietals/sizes offered, and the heritage/craft story behind the mill.

**B. Feedback on this analysis**

6. **Does this design direction resonate?** We'd like the client's reaction to the overall analysis, positioning, and mood — and a flag on anything that feels off-brand before we invest in it.

**C. Design & content specifics**

7. **Product / catalogue page.** If Nostrum sells products, a listing almost certainly exists — but the client sent the **Louis Vuitton grid (Image 5) without commenting on it.** Ask directly: *"Do you need a product listing/catalogue page, and is the LV grid the reference for it?"*
8. **Accent colors.** Confirm the exact **gold/amber** for light/motion and the exact **"cool green"** for the footer wordmark (placeholders set in §3). *Note (2026-07-02): the client is sending a specs PDF with his palette/tone as a **"first direction," not strict** — reconcile it against §3 rather than treating either as final (see §3 callout).*
9. **Fonts.** Confirm licensed display + body faces (§4 recommends a refined grotesk + editorial display).
10. **Photography/video.** The client flagged that getting professional visuals is *"difficult."* Confirm who supplies hero footage and product photography, since ~80% of the result depends on it.
11. **Remaining requirements & content.** Any pages, features, functionality, or content the client has in mind that aren't captured here — needed to finalize scope, timeline, and quotation.

**D. WhatsApp lead capture (replaces the chatbot — see §11.5)**

> *Resolved 2026-07-02: **WhatsApp-only** for the bottom-of-page area — the reference site's other widgets are out of scope. The reference screenshot is no longer blocking.*

12. **Business WhatsApp number** in E.164 format to wire into the `wa.me` deep links.
13. **Pre-filled message(s) & language** (Spanish vs. bilingual), and whether B2B/chef leads and general leads should carry different prefills.
14. **Direct vs. form-first.** Direct click-to-chat, or a short lead form (name/interest) that composes a richer prefilled WhatsApp message?
15. **Quote adjustment.** Confirm the chatbot line is removed from the quote/contract and replaced by the smaller WhatsApp-integration line (lower total cost, per the client's goal).

**E. Google Reviews (deferred — see §11.6)**

16. **Go/no-go & timing.** Not now, per the 2026-07-02 email — confirm if/when he wants it.
17. **Which variant** — a click-to-open side pull-tab/arrow, or a timed auto-peek (~1 min) that retracts into the same tab.
18. **Edge, devices & data source** — which screen edge it docks to, desktop-only vs. mobile too, and live Google API vs. hand-picked cached reviews.

**F. Project logistics**

19. **Contract.** Client is preparing the contract (2026-07-02) but **won't activate it that day** — expect it shortly after. No build work is committed until it's active.

---
---

# Part II — Business, Product & Technical Foundation

> **Why this part exists.** Sections 1–15 answer *what the site should look and feel like* — and they answer it well. They do **not** yet answer *what Nostrum is as a business, who it serves, what the site must actually do, and how it is built.* This part fills those gaps. Without it we can't finalize scope, timeline, quote, or the commerce/CMS/hosting stack — and we'd risk designing beautiful scenes on top of undecided foundations.
>
> ⚠️ **Same status caveat as Part I, stronger.** Almost everything here is a **proposal to react to**, not a decision. The point is not to guess the business into existence — it's to put a concrete, opinionated straw-man in front of the client so he can say "yes / no / actually it's like this" fast. That is faster and more valuable to a founder than a list of blank questions.

> **Working principle — propose, don't wait.** Valentí is treating this as *half development, half product design* — he keeps asking *"what do you think?"* rather than handing over a locked brief. Match that. The moment we know a fact (e.g. "it's olive oil"), we come back with a **recommendation and a draft**, not just a follow-up question. Every section below leads with a proposed direction and only then lists what needs confirming. See §27 for the content modules we should proactively put on the table.

---

## 16. Brand Strategy — the "why" (BLOCKING)

Right now we know *what* Nostrum sells (olive oil) but not **why it exists, why now, or why it's better than the bottle next to it.** Every luxury brand in the reference set (§1) sells a *why* first and a product second. If a visitor asked *"What makes Nostrum better than any other olive oil?"* — the current spec cannot answer. That answer must exist before we write a single line of hero copy, because the hero **is** that answer rendered cinematically.

**The three questions we must be able to answer:**

1. **Why Nostrum?** — the reason to believe (the differentiator).
2. **Why now?** — the moment/occasion (new harvest, new estate, a revival, a standard being raised).
3. **What makes them different?** — the single ownable claim no competitor can copy.

**Positioning statement (fill-in template to confirm with client):**

> *For **[audience]** who **[need/occasion]**, **Nostrum** is the **[category]** that **[single differentiator]** — because **[reason to believe / proof]**.*

**Candidate differentiators to test with the client** (olive-oil brands typically win on one or two of these — we pick the true ones, not all):

| Angle | The ownable claim | Proof it needs |
|---|---|---|
| **Single-estate / terroir** | One grove, one place, one soil | Location, estate story, photography |
| **Harvest date / freshness** | Pressed & bottled this season, dated | Harvest calendar, lot numbers |
| **Cultivar / varietal** | A specific olive (Arbequina, Picual, etc.) | Tasting notes, varietal story |
| **Cold extraction / craft** | Method that protects flavour & polyphenols | Process (§27), lab/polyphenol numbers |
| **Heritage / family** | Generations of the same family/mill | Timeline, faces, archive imagery |
| **Sustainability** | Regenerative groves, low-impact mill | Certifications, practices |
| **Awards / recognition** | Externally validated quality | Award logos, competition results |

**Deliverable:** a one-paragraph brand answer + a one-line tagline candidate we draft *first* and refine with the client — not one we wait for him to supply. This feeds §6 (hero) and all copy.

---

## 17. Business Goals (ranked)

The site can't serve every goal equally — ranking them decides what gets the hero, what gets a scene, and what gets a link. **Proposed ranking to confirm** (derived from §0: olive-oil producer, likely DTC + professional channel):

| Rank | Goal | What it demands of the site | Success signal |
|---|---|---|---|
| **1 — Primary** | Sell olive oil (DTC) | Real commerce: catalogue, product, cart, checkout, payment (§20) | Orders / revenue |
| **2 — Secondary** | Win restaurants & chefs (B2B/wholesale) | "¿Eres chef profesional?" block → **WhatsApp lead** (§11.5) + wholesale flow (§19) | Qualified WhatsApp leads |
| **3 — Tertiary** | Brand awareness / prestige | Story scenes, photography, the whole cinematic layer | Time on site, shares, return visits |
| **4** | Newsletter / owned audience | Email capture at contact + post-purchase (§23) | List growth |

Confirm the order — it's the single biggest driver of scope and quote. If Goal 1 is actually *lead-gen only* (no online sales), the entire commerce stack (§20–§21) drops out and the project shrinks dramatically. **This is the most important thing to nail down after §16.**

---

## 18. Customer Journey (macro arc)

Every reference site is built around a journey, not a set of pages. Nostrum's proposed end-to-end arc, mapped onto the scene sequence (§5):

```
Visitor
  ↓   (arrives cold — ad, search, referral)
Hero            → cinematic light-in-darkness; the "why now"
  ↓
Story           → heritage / estate / the "why Nostrum" (§16)
  ↓
Products        → the range, elevated as objects (§20)
  ↓
Trust           → awards, certifications, chef endorsements, reviews (§27)
  ↓
Process         → craft / cold-extraction / the mill (§27)
  ↓
Shop            → catalogue → product → cart
  ↓
Checkout        → payment (§20/§23)
  ↓
Email           → confirmation + newsletter opt-in (§23)
  ↓
Repeat customer → re-order / subscription / seasonal harvest drop
```

**Emotional arc:** *intrigue (hero) → belief (story/trust) → desire (products/process) → action (shop/checkout) → belonging (email/repeat).* Each scene must move the visitor one step, not just look good. The "Trust" beat is currently missing from §5 and should be added as a scene.

---

## 19. Audience Segments & User Flows

At least **two** distinct visitors, possibly three — each needs its own flow. The site must serve both without feeling like two sites.

**A. DTC consumer (primary — Goal 1)**
```
Guest → Browse catalogue → Product → Add to cart → Checkout (guest) → Confirmation → Email
```
- Guest checkout must exist (accounts optional — forcing signup kills luxury DTC conversion).

**B. Professional chef / restaurant (secondary — Goal 2)**
```
"¿Eres chef profesional?" → Wholesale info → WhatsApp lead (§11.5)  [phase 1]
                                            → (later) Account → Orders → Invoices  [phase 2, if portal]
```
- Phase 1 is just the WhatsApp handoff (already scoped). A full wholesale **portal** (pricing tiers, order history, invoices) is a **big** additional scope — flag it explicitly and don't assume it.

**C. Distributor (tertiary — confirm it even exists)**
```
Enquiry → WhatsApp / contact form → human follow-up
```

**Decision needed:** do consumers get **accounts** at all (order history, saved addresses, subscriptions), or is it **guest-only**? This single answer drives §21 (data model) and §22 (portal). Recommendation: **guest-first at launch**, accounts only if subscriptions or the wholesale portal are confirmed.

---

## 20. Product Model & Commerce Scope (BLOCKING for the shop)

We cannot choose the commerce stack until we know the shape of the catalogue. **Unknowns that change everything:**

| Question | Why it matters |
|---|---|
| **How many products?** (5 / 20 / 500) | 5 SKUs → custom + Stripe is trivial. 500 → needs real commerce platform. |
| **Variants?** (size 250ml/500ml/1L, tins vs bottles) | Drives product schema & cart logic. |
| **Bundles / gift sets?** | Custom bundle pricing logic. |
| **Subscriptions?** (seasonal harvest, monthly) | Requires recurring billing (Stripe Billing / Shopify subs) + accounts. |
| **Shipping** — domestic only or EU/international? | Rates, carriers (§23), customs, cost at checkout. |
| **Inventory** tracked? | Stock counts, oversell protection, "sold out" states. |
| **Taxes** — Spanish IVA, EU VAT, VAT-OSS for cross-border? | Legal/checkout requirement; strong reason to lean on a platform. |

**Recommendation — decision tree:**

- **Few SKUs, brand-led, simple shipping, no subscriptions** → **custom Next.js storefront + Stripe Checkout** (keeps full control of the luxury UI; least platform tax; matches the bespoke design).
- **Growing catalogue, variants, inventory, subscriptions, or client wants to self-manage products/orders** → **Shopify (Headless / Storefront API)** behind the custom Next.js front-end — client gets a real commerce admin (§22) while we keep the bespoke design.
- **Avoid** a themed Shopify/Amazon storefront — it breaks the whole design language (see §13 Don't).

> **Default hypothesis until confirmed:** boutique catalogue (≤ ~20 SKUs), a few size variants, Spain + EU shipping, IVA/VAT, possibly a seasonal subscription. That points to **Shopify headless *or* Stripe** — decided by the subscription + self-management answers. Confirm §20 before quoting the shop.

---

## 21. Data Model (only if accounts/orders/portal are in scope)

If §19 confirms accounts, orders, or a wholesale portal, we need persistence. **If we go Shopify headless, Shopify owns most of this** (products, variants, orders, customers, inventory) and we store very little ourselves. **If custom + Stripe,** we own the schema. Proposed core entities:

```
User        (id, email, name, role: consumer|pro|admin, locale, created_at)
Address     (id, user_id, type: shipping|billing, lines, city, postcode, country)
Product     (id, slug, name, story, cultivar, status, cms_ref)
Variant     (id, product_id, size, sku, price, stock, weight)
Order       (id, user_id?, guest_email?, status, totals, currency, created_at)
OrderItem   (id, order_id, variant_id, qty, unit_price)
Invoice     (id, order_id, number, pdf_url, issued_at)          ← wholesale/legal
Subscription(id, user_id, variant_id, interval, status)         ← only if subs
Review      (id, product_id, author, rating, body, status)      ← if reviews (§27/§11.6)
Lead        (id, source, segment: consumer|chef, message, created_at)  ← WhatsApp/form leads
NewsletterSubscriber (id, email, locale, consent_at)
```

Proposed store if custom: **Postgres (Neon/Supabase)** + an ORM (Prisma/Drizzle). Keep PII minimal (GDPR — §23/§24). **Do not build any of this unless §19/§20 require it** — guest-only DTC on Shopify needs almost none of it.

---

## 22. Admin / Client Portal & CMS

Two different needs often conflated — separate them clearly:

**A. Content management (CMS) — almost certainly required.** The client *will* eventually say *"I want to change this text / swap this photo / add a recipe."* The current spec implicitly assumes hardcoded content — that's a trap. **Recommendation: Sanity** (great DX, real-time, structured content, excellent image pipeline, generous free tier), with **Payload** as the alternative if he wants self-hosted/owns-the-DB. What should be editable:

- Hero copy & taglines, all scene copy, brand story
- Products' *editorial* content (story, tasting notes, imagery) — even if commerce data lives in Shopify
- **Recipes, awards, certifications, timeline, FAQ** (§27)
- Gallery images, press/press-kit, contact details, WhatsApp number & prefills (§11.5)
- **Translations** (see §24 — multilingual)

**B. Commerce admin — provided by the platform.** If Shopify: orders, inventory, shipping, refunds, discounts are managed in Shopify admin (no build). If custom + Stripe: we'd have to **build** an admin for orders/inventory — a significant line item; another reason Shopify may win.

**C. Wholesale/client portal — its own project.** The "Client Portal" the client mentioned (pro accounts, order history, invoices, tiered pricing) is **not** the CMS and **not** trivial. Scope and price it separately; recommend **phase 2** unless he insists on launch.

> **Who manages what** must be written down and agreed: products, orders, images, languages, shipping, inventory, prices — each mapped to CMS vs commerce admin vs portal. Ambiguity here causes the most post-launch friction.

---

## 23. Integrations (defined, not just named)

Part I *names* tools; here we **define** them with sensible, Spain-aware defaults to confirm. *(Inference: the client's name — Valentí Piñol Ortoneda — is Catalan, so the business is very likely in Spain/Catalonia. That informs payment, shipping, tax, language, and consent defaults below. **Confirm the country/region.**)*

| Concern | Recommended default | Alternatives / notes |
|---|---|---|
| **Payments** | **Stripe** (cards, Apple/Google Pay) | **Redsys** is the dominant Spanish bank gateway — many ES businesses need it; **PayPal** as a trust add-on. Confirm which the client's bank requires. |
| **Shipping** | Carrier + rates at checkout | Spain: **Correos, SEUR, MRW, GLS**; EU/intl: **DHL/UPS**. Flat-rate vs live rates? Free-shipping threshold? |
| **Tax** | Spanish **IVA**; EU **VAT-OSS** if cross-border | Strong reason to use a platform that computes VAT. |
| **Transactional email** | **Resend** (React Email templates) | Order confirmation, shipping, wholesale replies. SMTP fallback. |
| **Newsletter** | Confirm: Resend Audiences / Mailchimp / Klaviyo | Klaviyo if commerce-heavy flows wanted. |
| **Analytics** | **GA4** + **Meta Pixel** | Conversion tracking for ads. |
| **Consent** | **Cookie-consent / CMP** (GDPR + Spanish LSSI-CE) | **Required** in Spain/EU before analytics/pixel fire. |
| **Maps** | Only if estate/boutique shown | Mapbox (dark styles match the theme better than Google). |
| **Reviews** | Deferred (see §11.6) | Google Reviews via API into the on-brand slide-out (client's own idea). |
| **WhatsApp** | `wa.me` click-to-chat (§11.5) | Already scoped. |

---

## 24. SEO & Structured Data

Olive oil is a **high-intent, content-rich search category** (recipes, health/polyphenols, "best olive oil," gifting). SEO is a genuine growth channel, not an afterthought — and it pairs perfectly with the §27 content modules.

- **Multilingual.** Likely **ES + CA (Catalan) + EN** (confirm — the Catalan surname and Spanish screenshot suggest at least ES; CA if Catalonia-based; EN for reach/export). Implement Next.js i18n routing + **`hreflang`** + per-locale metadata + translated content in the CMS (§22). This decision affects URL structure, CMS modelling, and effort **significantly** — confirm early.
- **Structured data (schema.org):** `Product` + `Offer` (price/availability), `Recipe` (huge for olive oil — rich results), `Organization`/`LocalBusiness` (the estate/mill), `BreadcrumbList`, `Review`/`AggregateRating`, `FAQPage`.
- **Technical SEO:** dynamic `sitemap.xml`, `robots.txt`, canonical tags, clean slugs, `next/image` for Core Web Vitals, per-page **OG + Twitter cards** (critical for the shareable, image-led brand).
- **Content SEO:** recipes and process/heritage articles (§27) are the organic-traffic engine — design the CMS to support them from day one.

> **Tension to manage:** the heavy motion/3D (GSAP, R3F) can hurt crawlability and Core Web Vitals if done carelessly. SSR/SSG the content, keep the WebGL non-blocking and progressively enhanced. This ties directly into §25.

---

## 25. Performance Budget

> **This is where luxury sites die.** GSAP + Three.js + parallax + video + 100 MB of hero imagery → Lighthouse 38, a janky scroll, and a bounce. We set **hard budgets now** and treat them as acceptance criteria, not aspirations.

**Targets (mobile, mid-tier device):**

| Metric | Budget |
|---|---|
| **LCP** | ≤ 2.5 s |
| **CLS** | ≤ 0.1 |
| **INP** | ≤ 200 ms |
| **Lighthouse Performance** | ≥ 90 (content pages), ≥ 80 (hero/WebGL page) |
| **JS on first load** | ≤ ~200 KB gzipped app code; R3F/GSAP **code-split & lazy** |
| **Hero image** | ≤ ~300 KB (AVIF/WebP, responsive `srcset`) |
| **Any single image** | ≤ ~500 KB after optimization |
| **Video** | ≤ ~3–5 MB per loop, muted, `preload=none`, poster frame, lazy |
| **Animation** | 60 fps target; never block the main thread on scroll |

**Rules:**
- **Respect `prefers-reduced-motion`** — degrade the hero and scroll effects gracefully (accessibility + perf).
- Lazy-load everything below the fold; defer WebGL until the hero is in view; pause the R3F render loop when offscreen.
- All media through **Cloudinary / `next/image`** — no raw uploads.
- **Ship a Lighthouse/CI budget check** so regressions are caught before merge.

---

## 26. Hosting & Deployment Architecture

One diagram everyone can point at. Proposed target architecture (adjusts with §20/§22 decisions):

```
                        ┌────────────────────────┐
        Visitor  ─────► │  Next.js (App Router)   │  ◄── Vercel (edge/CDN,
                        │  SSR/SSG + ISR          │      previews, prod)
                        └───────────┬────────────┘
                                    │
        ┌──────────────┬───────────┼──────────────┬───────────────┐
        ▼              ▼           ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐   ┌──────────┐
   │ Sanity  │   │ Shopify  │  │Cloudinary│  │  Resend  │   │Analytics │
   │  CMS    │   │(headless)│  │  media   │  │  email   │   │GA4/Pixel │
   │ content │   │ OR       │  │ pipeline │  │          │   │ + CMP    │
   └─────────┘   │ Stripe + │  └──────────┘  └──────────┘   └──────────┘
                 │ Postgres │
                 │ (Neon)   │
                 └────┬─────┘
                      ▼
                 ┌──────────┐
                 │ WhatsApp │  (wa.me deep link — no backend)
                 └──────────┘
```

- **Front-end:** Next.js on **Vercel** (first-class Next hosting, edge CDN, preview deploys per PR, image optimization).
- **Commerce:** **Shopify Storefront API** *(if self-managed catalogue/subs)* **or** **Stripe + Postgres/Neon** *(if boutique/custom)* — per §20.
- **Content:** **Sanity** (§22). **Media:** **Cloudinary** (§10/§25). **Email:** **Resend** (§23).
- **Env/secrets:** per-environment (dev/preview/prod); no keys in the repo. WhatsApp number & prefills configurable via CMS/env, not hardcoded.
- The alternate hosts mentioned earlier (Netlify/Render) remain valid fallbacks; **Vercel is the recommendation** for a Next.js + ISR + preview-driven workflow.

---

## 27. Proposed Content & Storytelling Modules (taking initiative)

Rather than wait for the client to enumerate pages, **we put the menu on the table.** These are the content modules a premium olive-oil brand typically needs — proposed proactively so Valentí reacts and prioritizes (this is the "propose, don't wait" principle in action):

- **Recipes** — pairing/usage content; doubles as the SEO engine (§24 `Recipe` schema) and a repeat-visit hook.
- **Awards & recognition** — external validation of quality (§16 differentiator, §18 Trust beat).
- **Production process / craft** — harvest → cold extraction → bottling; the "how it's made" scene (§5 Process).
- **The farm / estate / mill** — place & terroir; the single-estate story and photography.
- **Chef / professional section** — the "¿Eres chef profesional?" B2B hub → WhatsApp (§11.5) + wholesale (§19).
- **Sustainability** — regenerative groves, low-impact milling; increasingly decisive for premium buyers.
- **Heritage timeline** — family/generations; earns "quiet luxury" credibility (§1).
- **Certifications** — DOP/PDO, organic, quality seals; trust + `Product` schema.
- **FAQs** — shipping, storage, harvest dates, wholesale; also `FAQPage` schema (§24).

Frame to the client as: *"Based on 'olive oil,' here's what I think the site should include — which of these are real for Nostrum, and what's the priority?"* Each accepted module maps to a scene (§5), a CMS type (§22), and often a schema (§24).

---

## 28. Updated Discovery Questions (business/technical — gate the quote)

These extend §15 and, together with §0/§16–§20, must be answered before a firm scope/timeline/quote. Ordered by blocking impact:

1. **Business goals ranking (§17)** — confirm primary→quaternary. *Is online selling actually in scope, or is this lead-gen/brand only?* (Biggest scope lever.)
2. **Brand "why" (§16)** — the differentiator + a reaction to our draft positioning/tagline.
3. **Catalogue shape (§20)** — how many SKUs, variants, bundles, subscriptions, inventory tracking?
4. **Accounts? (§19/§21)** — guest-only, or consumer accounts, and/or a wholesale portal? (Portal = phase 2 unless required.)
5. **Commerce stack (§20)** — does he want to self-manage products/orders (→ Shopify headless) or is a boutique custom+Stripe fine?
6. **CMS (§22)** — confirm he wants to edit content himself (→ Sanity). What must be editable?
7. **Country & languages (§23/§24)** — confirm Spain/region; ES / CA / EN? (Drives i18n, tax, payment, shipping, consent.)
8. **Payments & shipping providers (§23)** — Stripe vs Redsys vs PayPal; which carriers; free-shipping threshold; domestic vs EU/intl.
9. **Content ownership (§10/§27)** — who supplies photography/video and writes the recipes/story? (~80% of quality is imagery — §10.)
10. **Performance & analytics (§24/§25)** — confirm GA4/Meta Pixel + a GDPR/LSSI cookie-consent layer are wanted; agree the perf budget as acceptance criteria.
11. **Phasing** — agree what's **launch** vs **phase 2** (portal, subscriptions, Google Reviews panel, extra content modules) so the first quote is realistic.
