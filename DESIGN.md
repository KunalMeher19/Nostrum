---
name: Nostrum
description: Premium agricultural olive oil — dark brand storytelling, white shop clarity.
colors:
  ink-black: "#050505"
  near-black: "#090909"
  charcoal: "#111111"
  deep-olive: "#1e2a16"
  bark-brown: "#2c2117"
  warm-ink: "#14160f"
  logo-lime: "#a6ce3a"
  gold-metal: "#e6b422"
  gold-warm: "#e6b45a"
  amber-hot: "#ff8a3d"
  warm-white: "#edebe3"
  off-white: "#f5f5f3"
  pure-paper: "#f4f4f2"
  muted-warm: "#9a978d"
  shop-muted: "#6f6a5f"
typography:
  display:
    fontFamily: "Raleway, Georgia, serif"
    fontSize: "clamp(3rem, calc(4vw + 4dvh), 14rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Raleway, Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Raleway, Georgia, serif"
    fontSize: "clamp(1.35rem, 2vw, 1.7rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.32em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  card: "20px"
  pill: "999px"
spacing:
  xs: "0.6rem"
  sm: "1.25rem"
  md: "2.5rem"
  lg: "5rem"
  xl: "clamp(4rem, 8vh, 7rem)"
components:
  button-primary:
    backgroundColor: "{colors.warm-ink}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.5em"
  button-primary-hover:
    backgroundColor: "{colors.gold-metal}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.none}"
    padding: "1.15em 1.5em"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.none}"
    padding: "1.1em 1.5em"
  button-pill:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    rounded: "{rounded.pill}"
    padding: "0.95em 1.6em"
  lux-button:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    rounded: "{rounded.none}"
    padding: "0"
---

# Design System: Nostrum

## Overview

**Creative North Star: "The Agricultural Sanctum"**

Nostrum's visual world holds a tension that most luxury brands collapse: the cold precision of a supercar brand and the warm soul of a family harvest. The design resolves this by treating darkness as earth, not void. The near-black canvas (`#050505`) reads as rich soil, not a tech void; the warm olive and bark-brown panels that emerge from it (`#1e2a16`, `#2c2117`) read as aged wood and pressed stone, not dark mode UI. Gold (`#e6b422`) is never decoration — it is light itself, the single precious element that elevates the agricultural to the sacred.

The system has two modes baked into its architecture, and they are as different as a cellar and a sunlit market. Dark brand pages (Home, Origins, Contact, portals) lean into the Sanctum: cinematic darkness, sparing gold accents, editorial restraint, oversized display type. The white Shop (`#edebe3`) flips the register entirely — warm paper, generous whitespace, ink typography, the same gold hairlines now reading as precision rather than warmth. A single CSS variable `--page-t` (0 → 1) scrubs the viewport between these two worlds at the dark-to-Shop boundary, so the inversion is continuous, never a cut.

Motion grammar follows the luxury easing curve `--ease-lux: cubic-bezier(0.625, 0.05, 0, 1)`: slow entry, no bounce, expo-style deceleration. Nothing arrives fast or bounces. The ring cursor (`mix-blend-mode: difference`) inverts against whatever sits below it — always legible on both dark and light surfaces without any computed colour. Reduced motion is a hard requirement: every animation degrades gracefully to an instant reveal or a static state, never leaving content invisible.

**Key Characteristics:**
- Near-black canvas reads as earth, not void; warmth comes from the brown/olive family
- Two-mode split: dark Sanctum for brand, warm-white for commerce — never mixed
- Gold and lime are precious accents used at ≤10% of any screen surface
- Typography lives at poster scale on dark pages; restrained and readable on the Shop
- Motion is slow, unidirectional, expo-deceleration — never bouncy or performative
- Zero-lag ring cursor inverts via difference blend; custom across the whole site
- `prefers-reduced-motion` compliance is non-negotiable throughout

## Colors

Two palettes coexist in one system: the dark Sanctum family for brand pages, and the warm-white Shop family for commerce. Gold bridges both.

### Primary
- **Ink Black** (`#050505`): The primary canvas on all dark brand pages — `body`, hero backgrounds, portal shells. Reads as rich earth, not tech void. Never used in the Shop.
- **Warm Ink** (`#14160f`): The Shop's ink color — text, filled buttons, borders on the light surface. The same dark warmth as Ink Black, but tuned for contrast against warm-white backgrounds.

### Secondary
- **Gold Metal** (`#e6b422`): The precise jewelry accent. Active tab underlines, CTA hover fill sweeps, product card hover glow, gold hairlines on the portal panel top edge, trust-badge icons, scroll comet, sparkles. Never used as a background fill except in hover sweep states.
- **Gold Warm** (`#e6b45a`): The softer, warmer register of gold — nav accent color, footer link hover underline, LuxButton underline. Slightly more amber than Gold Metal; used in ambient light contexts rather than precision detail.
- **Logo Lime** (`#a6ce3a`): Reserved for the poster wordmark's cursor-proximity color effect in the footer. Rarely appears elsewhere. Never used as a flat fill or a background.

### Tertiary
- **Amber Hot** (`#ff8a3d`): The loader's hot light highlight — appears only in the loading screen's gradient and scroll-comet gradient. Never used in page content.
- **Deep Olive** (`#1e2a16`): Portal and card panel gradient anchor — the warm organic green-dark that grounds the portal card against the ink-black backdrop.
- **Bark Brown** (`#2c2117`): Portal panel gradient counterpoint — warm brown used alongside Deep Olive in the 152° portal gradient, adding a harvest-material warmth.

### Neutral
- **Off-White** (`#f5f5f3`): Body text and UI text on all dark-canvas pages. Nav labels, hero subtitles, menu links, loader wordmark. The slightly warm white that reads as refined rather than stark.
- **Warm White** (`#edebe3`): The Shop background. Also used as the pressed warm-off-white for light-mode elements. The antidote to clinical pure white — it carries the brand's organic warmth into the light section.
- **Pure Paper** (`#f4f4f2`): Light-mode card tile background (`.shop-light-tile`, `.pdp__media` background). Slightly cooler than warm-white, provides subtle separation between card and page.
- **Muted Warm** (`#9a978d`): Secondary/muted text on dark pages — portal muted labels, footer address, nav-dimmed states.
- **Shop Muted** (`#6f6a5f`): Secondary text on the light Shop — product subtitles, breadcrumb labels, tab inactive, trust-badge sub-labels. The light-mode equivalent of Muted Warm.

### Named Rules
**The Jewelry Rule.** Gold and lime are used at ≤10% of any given screen. Their rarity is the point. Flat-filling a large area with either color is a failure state — they exist as light, not paint.

**The Two-Mode Rule.** Dark canvas is for brand pages; warm-white is for the Shop. Never invert this or blend the two registers on a single surface. The `--page-t` variable exists precisely to make the boundary cinematic, not to merge the worlds.

**The Difference-Blend Exception.** The ring cursor and the fixed nav header paint pure white and composite via `mix-blend-mode: difference` — they are always legible on both surfaces without any brand color. Never use a brand color inside these elements; it renders as a tinted negative.

## Typography

**Display Font:** Raleway (variable, full wght axis, `var(--font-display)`) with Georgia, serif fallback
**Body Font:** Libre Franklin (`var(--font-sans)`) with system-ui, sans-serif fallback

**Character:** Raleway's geometric elegance at ultra-loose tracking gives headlines a fashion-house weight without coldness; Libre Franklin's clarity keeps UI labels and body copy readable and understated. The pairing holds the luxury/agriculture tension: editorial display, functional body.

### Hierarchy
- **Display** (weight 400, `clamp(3rem, calc(4vw + 4dvh), 14rem)`, line-height 0.95, tracking −0.03em): Hero headlines on dark pages — the cinematic moment. Scale is viewport-derived so it fills the frame. Used once per hero.
- **Headline** (weight 400, `clamp(2.25rem, 6vw, 4.5rem)`, line-height 0.98, tracking −0.03em): Section titles, Shop heading, product names. The editorial workhorse — same Raleway family, scaled down from display but still tight and poster-inflected.
- **Title** (weight 400, `clamp(1.35rem, 2vw, 1.7rem)`, line-height 1.05, tracking −0.01em): Product card names, portal panel section headings, footer tagline. Display scale in miniature.
- **Body** (weight 400, `0.92rem`, line-height 1.75): Tab panel prose, portal order descriptions, contact form helper text. The only place where reading comfort matters more than visual impact. Max 34rem width.
- **Label** (weight 500, `0.68–0.72rem`, line-height 1.2, tracking 0.24–0.42em, uppercase): The system's workhorse micro-type. Eyebrows, breadcrumbs, field labels, tab names, card details, nav links, footer column titles. Libre Franklin at wide tracking — the system communicates primarily through labels, not paragraphs.

### Named Rules
**The Sparse Copy Rule.** Every string must earn its place. Labels and eyebrows carry the system; paragraphs are a privilege reserved for the Origins page. Never fill space with copy — let whitespace and photography carry the weight.

**The Poster Scale Rule.** On dark hero/brand pages, display type scales with the viewport (`calc(4vw + 4dvh)`). The headline should feel slightly too large the first time you see it. That discomfort is the luxury signal.

## Layout

The system uses a generous centred-rail model. Dark brand pages ride a `max-width: 78rem` rail with `clamp(1.5rem, 5vw, 5rem)` horizontal padding — the wide rail lets the display type breathe. The Shop and product pages use `max-width: 84rem` to accommodate the three-column product grid. All containers are centred; no asymmetric gutters on dark pages.

**Vertical rhythm** is governed by `clamp()` ranges rather than fixed steps: e.g. `clamp(4rem, 8vh, 7rem)` for section top padding, `clamp(2.5rem, 5vh, 4rem)` for internal gaps. This prevents the layouts from compressing on short viewports or over-expanding on tall ones — a particular concern given the cinematic hero that occupies `100svh`.

**Product grid:** 3-column (`repeat(3, 1fr)`) at ≥960px, 2-column at 640–960px, single-column below 620px. Gap scales with `clamp(1.5rem, 3vw, 3rem)`.

**Product detail page:** 7:5 two-column grid (media left, detail right) collapsing to single-column at ≤900px. The 7:5 split gives the image dominant territory without the 50/50 flatness of a symmetric grid.

**Nav bar:** Fixed, full-width, `padding: 2em 2.5em` on desktop, `1.25em` on mobile. Logo centered absolutely; Menu toggle left; cart + account right. The bar composes via `mix-blend-mode: difference` so it needs no background — it floats over any surface.

**Footer:** Three-column `repeat(3, 1fr)` collapsing to 2-column + full-width first column below 640px. The oversized poster wordmark spans the full container width below the grid.

**Scrollbar:** Hidden site-wide (Lenis owns smooth scroll). `overflow-x: clip` on `body` (not `hidden` — `hidden` creates a scroll container that breaks `position: sticky`).

## Elevation & Depth

The system uses no ambient drop shadows on standard surfaces. Depth is expressed through tonal layering and transparency: the portal card sits on Ink Black via a `linear-gradient(152deg, Deep Olive → Warm Ink → Bark Brown)` rather than a shadow lift. The dark-to-light scroll inversion (`--page-t`) creates perceived depth by contrasting the dark history and the bright Shop without any z-axis shadow.

Shadows appear only as a focused structural signal in two contexts:

### Shadow Vocabulary
- **Portal lift** (`0 44px 90px -48px rgba(0,0,0,0.85)`): The customer/admin portal panel. A single deep shadow that separates the card from the ink-black page — structural, not decorative.
- **Gold hover glow** (`0 18px 46px -30px color-mix(in srgb, #e6b422 70%, transparent)` / `0 10px 30px -14px color-mix(in srgb, #e6b422 75%, transparent)`): Product card and pill CTA on hover. A soft golden bloom that reads as the product emitting warm light. Never on at rest.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Shadows only appear as a response to state (hover glow) or structural separation (portal card on its ink backdrop). A shadow on a button or nav element would break the system.

## Shapes

The system is almost entirely sharp. Corners are square (`border-radius: 0`) on all interactive elements and content tiles — buttons, inputs, product media frames, tab underlines. This is a deliberate refusal of the rounded-card defaults that read as generic dark-mode UI.

The exceptions are architecturally meaningful:
- **Portal card** (`border-radius: 20px`): The one surface that signals "you are inside a personal space, not the brand." The rounding marks it as a portal shell, not a content panel.
- **Pill CTA** (`border-radius: 999px`): The Shop's "Explore" CTA pill — signals discovery, not action. Appears once per Shop surface.
- **Cart-badge** (`border-radius: 999px`): The count dot on the cart icon — functional rounding, never replicated on other badges.
- **Nav thumbnail frames** (`border-radius: 0.25em`): The hero slideshow thumbnails — a subtle softening so they read as photography selectors, not UI chips.

**Gold hairlines** (`1px solid color-mix(in srgb, #e6b422 35–45%, transparent)`) define the border language: the Shop product media frame, the product detail price separator, the trust-badge top border, portal panel top keyline gradient. These are 1px lines, never thick borders. On dark surfaces the hairline appears as a precious thread; at full `#e6b422` it becomes a hover-state signal.

**Named Rules:**
**The Sharp Default Rule.** All interactive elements and content tiles default to zero border-radius. Rounding is applied only when it serves a specific architectural meaning (portal enclosure, pill discovery CTA, functional dot). Rounded cards everywhere is the pattern-library default Nostrum explicitly refuses.

## Components

### Buttons
The system has three button families covering the brand's interaction surfaces:

**LuxButton (editorial CTA — dark pages):** The signature dark-page CTA. Zero background, zero border. A text label in Libre Franklin 500 / 0.82em / 0.22em tracking / uppercase, with a gold underline rail below (1px, 22% opacity at rest). A short "tick" (1.6em) of solid gold hints the accent before hover. On hover: the label slides up and is replaced by a gold duplicate rising from below (mask-reveal), while the underline fill draws left-to-right via GSAP. Used on heroes, section CTAs, the Origins outro. Never on the Shop.

**Primary (Shop add-to-cart):** Full-width ink bar (`#14160f` background, `#edebe3` text), no border-radius, `1.15em 1.5em` padding, label left / live price right. On hover: a gold gradient sweeps across via `scaleX(0 → 1)` from the left and text inverts to ink. The "action" button of the Shop — appears once per product detail page.

**Ghost (buy now / secondary Shop):** Full-width transparent, `1px solid color-mix(in srgb, #14160f 35%, transparent)` border, no fill. Hover: border brightens to full ink, background picks up 5% ink tint. The quiet twin to Primary.

**Pill CTA (Shop explore):** Gold-bordered `999px` pill, transparent fill, `0.72rem` label. On hover: gold gradient sweeps fill and label inverts to ink + a gold glow blooms below. The discovery affordance — never an action trigger.

- **Shape:** Zero radius (Primary/Ghost), `999px` (Pill)
- **Hover timing:** `0.45–0.55s var(--ease-lux)` for fill; `0.4s` for color/border

### Chips / Segment Controls
The size and pack selector on the product detail page. Transparent background, `1px solid color-mix(in srgb, #14160f 22%, transparent)`, `0.8em 1.35em` padding, zero radius. Active state: full ink fill, warm-white text. Pack discount labels carry gold text (`color-mix(in srgb, #e6b422 88%, black)`) that stays gold in the active state. Transition: `0.4s var(--ease-lux)`.

### Cards / Containers
**Shop product card:** No explicit border-radius. Media frame: `aspect-ratio: 3/3.8`, `1px solid color-mix(in srgb, #e6b422 45%, transparent)` at rest, full `#e6b422` on hover + `scale(1.012)` + gold glow shadow. Quick-add button rises from below on hover (`opacity: 0 → 1`, `translateY(0.5rem → 0)`). Card meta sits below the frame in display/label type — no card chrome around it.

**Portal panel:** `border-radius: 20px`, `max-width: 62rem`, olive-to-bark-brown diagonal gradient, `1px solid color-mix(in srgb, #e6b422 13%, transparent)` border, gold keyline gradient along the top edge, deep shadow below. Entrance: `translateY(1.2rem → 0)` with `cubic-bezier(0.22, 1, 0.36, 1)`.

### Inputs / Fields
Bare stroke style: transparent background, `1px solid color-mix(in srgb, #14160f 25%, transparent)` border, no border-radius (`rounded.none`). Focus: border shifts to `#e6b422` (Gold Metal). No box shadow on focus. Error states: inherit border treatment, red is not in the palette — error is signaled through copy, not color. Disabled: inherits muted text color.

On dark pages (contact form, portal fields): dark input tile background (`#20261a` or similar), `rgba(245,245,243,0.15)` border at rest, gold focus.

### Navigation
**Fixed header bar:** Floats over the full page at `z-index: 100` via `mix-blend-mode: difference`. All children paint pure white; the blend inverts them per-pixel — ink on light, white on dark, always legible. Logo centered via `position: absolute; left: 50%; transform: translateX(-50%)`, Menu toggle left, cart + account right. The bar slides off-screen (`translateY(-120%)`) while the scroll-through animation plays, then returns.

**Full-screen menu takeover (Rolls-Royce split):** A fixed overlay (`z-index: 90`) that clips in from the left via `clip-path`. The left `clamp(320px, 45vw, 650px)` panel: `backdrop-filter: blur(22px) saturate(1.35)` pass-through of the page below + `rgba(10,8,6,0.65)` scrim. Links right-aligned inside the blur panel: Libre Franklin 500 / 0.85–1rem / 0.22em tracking / uppercase. Active and hover: gold (`#e6b45a`). Sub-items expand via `grid-template-rows: 0fr → 1fr` with a `└`-shaped elbow connector.

**Language switcher (inside menu):** `0.65–0.75rem` / 0.18em tracking / uppercase / `rgba(245,245,243,0.4)` at rest → gold + 0.24em tracking on hover. Active: gold, weight 600.

### Signature Components

**LuxButton gold underline rail:** The most-repeated signature micro-interaction. A 1px full-width horizontal rule beneath a CTA label. At rest: 22% opacity white + a 1.6em gold "tick" at the left. On hover (GSAP): tick fades, fill draws left-to-right, duplicate label rises. Encodes the brand's restraint philosophy: the gold is always implied before it arrives.

**Poster wordmark (footer):** Full-width Raleway display, `font-variation-settings: 'wght'` driven by cursor proximity — each letter's weight increases as the cursor approaches, animated via JavaScript. Ghost at rest (`22% opacity fg`), lime-tinted at cursor peak. A one-time masked-rise entrance animation brings all letters up from an overflow clip when the footer first scrolls in.

**Ring cursor:** Fixed `18px` circle, `mix-blend-mode: difference`, pure white border. Grows to `scale(1.55)` on hover, shrinks to `scale(0.82)` on press. Zero JavaScript lag — position set imperatively each frame, no lerp. Degrades gracefully: hidden on coarse-pointer devices, no transition on reduced-motion (instant scale).

**Scroll comet:** A gold light thread on the hero's first slide. A 1px column with a short bright segment (`height: 45%`) that falls through it on a `2.4s cubic-bezier(0.7, 0, 0.3, 1)` loop. The comet is the only perpetual animation in the system; under reduced-motion it holds static at `translateY(60%)`.

## Do's and Don'ts

### Do:
- **Do** use `--ease-lux: cubic-bezier(0.625, 0.05, 0, 1)` for all state transitions and hover fills. It is the brand's motion signature — slow entry, expo deceleration, no bounce.
- **Do** default all interactive elements and content tiles to zero border-radius. Apply rounding only when it signals a specific architectural role (portal enclosure → `20px`, discovery pill → `999px`).
- **Do** use gold (`#e6b422` / `#e6b45a`) only on details: tab underlines, hairline borders, hover fills, glow shadows, icon strokes. Its rarity is the luxury signal.
- **Do** use `color-mix(in srgb, #e6b422 35–45%, transparent)` for resting gold hairlines. Full gold is the hover/active state, not the default.
- **Do** keep the two-mode split absolute: dark brand pages use the ink-black/olive/brown family; the Shop uses warm-white. The `--page-t` scroll inversion is the only sanctioned crossover point.
- **Do** paint the ring cursor and fixed nav children as pure white — `mix-blend-mode: difference` handles contrast. Any non-white value renders as a tinted negative.
- **Do** use `clamp()` for all spatial values that need to respond to viewport height or width — never hardcoded `px` for section padding.
- **Do** honor `prefers-reduced-motion: reduce` with `animation-duration: 0.001ms` on all animated elements. The brand's cinematic quality must not come at the cost of accessibility.

### Don't:
- **Don't** use the em-dash (`—`) in any user-visible copy. Use commas, periods, or the interpunct (`·`) instead. This is a hard client constraint.
- **Don't** flat-fill a large area with lime (`#a6ce3a`) or gold. They are accents — "the jewelry." A lime background or a gold hero section breaks the Jewelry Rule.
- **Don't** add box-shadows to buttons, nav elements, or standard content tiles at rest. Shadows appear only on the portal panel (structural) and product card / pill CTA on hover (gold glow).
- **Don't** use bounce easing (`cubic-bezier` values above 1, spring physics, elastic exits). The brand moves with weight and confidence, not springiness.
- **Don't** use rounded cards as a generic container pattern. The `20px` portal radius is architecturally meaningful; applying it to product cards, modals, or nav elements collapses the hierarchy.
- **Don't** put display typography (`font-family: var(--font-display)`) on body copy, labels, or UI elements. Raleway carries heroes, section titles, product names, and the wordmark — Libre Franklin carries everything functional.
- **Don't** make the Shop dark or the brand pages white. The two-mode split is the product's identity.
- **Don't** reach for the rustic/artisan visual language — kraft textures, hand-drawn elements, terracotta palettes, or serif-heavy "small-batch" aesthetics. Nostrum is luxury agriculture, not farmers-market craft.
- **Don't** use generic dark-mode pattern-library defaults (slate greys, border-`neutral-200`, rounded-`lg` cards everywhere). The ink-black/olive/brown family and sharp forms are what makes this system Nostrum.
