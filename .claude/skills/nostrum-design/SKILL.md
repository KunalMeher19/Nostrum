---
name: nostrum-design
description: Design language, visual rules, motion direction, and build conventions for the Nostrum luxury brand website. Invoke whenever building, styling, animating, or reviewing ANY Nostrum UI — pages, sections, components, hero, menu, cursor, color, typography, motion, or copy layout — to keep work on-brand (black canvas, lime accent, cinematic minimal, story-first). Use before writing CSS/JSX, choosing colors/fonts, adding animations, or structuring page sections.
---

# Nostrum Design

Nostrum is **a premium, dark, agriculture-rooted olive oil brand — with a clean white Shop that gets out of the way and lets you buy.** Story first, product second. Dark brand pages (luxury car / fashion house), bright white Shop (LV/Balmain). Keep the **family, from-the-land soul** under the luxury polish — *olive oil, not a supercar.* Never generic e-commerce (no Amazon/Shopify patterns).

**Always read `NOSTRUM-DESIGN.md` (repo root) for the full spec** — it's now grounded in the client's official brief (`assests/Nostrum.pdf`). This skill is the quick enforcement layer.

## The principles
1. Luxury first — every interaction intentional, exclusive, expensive.
2. Minimal but cinematic — space + motion over clutter. **Premium = restraint.**
3. Tell the story, don't list products (History is the one text-rich page).
4. Agriculture soul — warm, family, from-the-land; not cold.
5. Motion with purpose — subtle, performant, reduced-motion-safe.
6. Photography is ~80% of the result — layout elevates images.
7. Fewest words possible — exact words only; design + photos carry the weight.

Mood: **Luxury. Quiet. Confident. Warm. Cinematic.**

## Two modes: dark brand, white Shop
- **Dark:** Home, History, Contact, B2B. **Light/white:** Shop, Product, Cart, Checkout. Don't mix them up (the light section is the **Shop**, NOT Contact — Contact is dark).

## Color — CONFIRMED palette (client's, §3)
- Backgrounds (brand/dark): ink-black `#14160F`, deep-olive `#1E2A16`, bark-brown `#2C2117`. Warm near-black canvas, layer for depth — not flat pure black.
- Accents ("the jewelry", **sparingly**): **logo-lime `#A6CE3A` AND gold `#E6B422`** — both are legit for CTAs/highlights. Leaf-green `#3B7A3E` for softer organic moments.
- **Light-streak hero motion = GOLDEN** (`#E6B422`).
- Shop background = warm-white `#FAF8F2`. Text on dark = off-white `#EDEBE3`. Pure white `#FFFFFF` where needed.
- Keep ≤ a handful of colors on screen. Never flat-fill big areas with lime/gold. (Lime is a real accent now — NOT footer-only.)

## Typography (open, direction fixed)
- Huge type, very little text, lots of whitespace. **No dense paragraphs** (except History).
- Editorial display for headlines (a little character) + clean readable sans for body/UI. **2 families max.**
- **Must support ES/CA accents** (CJK if ZH). Avoid generic/overused fonts.
- Display poster-scale (`clamp(3rem,12vw,14rem)`), tight tracking; eyebrows uppercase + wide tracking; headlines may animate word-by-word.

## Structure (multi-page, 4-item nav)
Home (dark hero + CTA into Shop) · Shop (LIGHT: list→product→cart→checkout) · History (dark, scroll-driven story) · B2B (small block at end of Shop + CTAs) · Contact (dark) · Account→portal · Admin. Global: language switcher (ES/EN/CA·maybe ZH) · floating WhatsApp · cookie banner · footer. Nav = logo center/left + menu + **search** + account + cart. It's a multi-page site — cinematic scenes live mainly on Home + History (not one long scroll page).

## Signature interactions
- **Hero (Home):** cinematic dark; **golden light-streaks/car-light-trails**, motion-blurred, mouse-reactive, soft glow. NOT a video bg. Subtle. (Rive OK for richer pieces.)
- **Motion ideas (options, Home):** spinning olives on scroll (rotate on own axis, not tumbling); hand-drawn/sketch (esbozo) olives/branch/logo for craft warmth; "draining/pouring" (escurrir) micro-anim on the Shop CTA; optional toggleable ambient leaf sound.
- **Menu:** Rolls-Royce split screen — links one side, **actual current page bg BLURRED** bleeding through the other. Open blur+fade+scale, smooth. No instant popup.
- **Cursor:** custom circle, **ZERO lag — no lerp/easing** (Rolls no-delay). Hover = reveal/scale/fade/mask/blur/glow.
- **Footer:** poster-scale "NOSTRUM" wordmark + Balmain-style sections/socials/legal/lang+country.
- **WhatsApp:** floating bubble bottom-right (with the arrow), every page — on-brand dark pill, NOT a stock green widget. Replaces the (dropped) chatbot.

## Shop / Product specifics
Shop = white, whitespace, big product images, clean grid, quick add-to-cart on hover. Products: olive oil, mainly 5L, x1/x2/x3 packs + other sizes, ~€35/5L. Product page: big image(s) · name·€price · size selector · quantity x1/x2/x3 OR free custom amount (don't limit them) · add to cart · tight description + shipping note. Catalog flexible (honey maybe later).

## Accounts (all in scope)
Login: email+password + **working Google** (was broken on GK.IA — must work). Portal: order history · active orders (shipping status) · downloadable invoices · shipping/account details · CTA to buy more · NO wishlist. Admin: orders · exportable customers list (for email marketing) · shop management (products/prices/stock/sizes/packs). GDPR: consent checkbox on signup/checkout + privacy policy.

## Motion
Slow, elegant, custom easing (~0.8–1.2s, expo/power3). Scroll reveals = fade + slight rise + clip-path mask. Purposeful only. Respect `prefers-reduced-motion`. Never hurt load time / feel gimmicky.

## Tech stack
Client's call (Shopify vs custom). Next.js + TS · Tailwind · GSAP+ScrollTrigger · Lenis · R3F/Three.js(+Spline) golden hero light · Rive (richer) · Framer Motion/Motion One · Sanity CMS · Cloudinary/next/image · Resend · Vercel · **Shopify Storefront API OR Stripe+Postgres/Neon**. Must satisfy: multilingual (ES/EN/CA, ZH-ready), working Google login, admin+customer-export, custom dark design + animations (Shopify theming is restrictive — weigh it).

## Interpretation principle: silence ≠ prohibition
Anything the client didn't mention is fair game to propose/build — only his explicit "don'ts" are hard limits. **He LIKES loaders** → a branded loader is a wanted feature (short, GPU-cheap, skippable, reduced-motion-safe; Shop stays instant, don't gate it). Enhancements he never asked for (split-screen menu, zero-lag cursor, loader) are welcome if they honor the guardrails below.

## Hard DON'Ts (things he explicitly said not to do)
Chatbot (dropped → WhatsApp) · walls of text (History excepted) · wishlist/favorites · limiting purchase quantity · repeating the broken Google login. Guardrails: nothing that hurts load time or feels gimmicky · respect reduced-motion · premium = restraint.

## Also avoid (design-language consistency)
Dark Shop or white brand pages · flat-fill big lime/gold areas · cluttered grids · stock green WhatsApp bubble · themed Shopify/Amazon storefront · forced-signup checkout · hardcoded contact/WhatsApp details · tanking Core Web Vitals.

## When invoked
1. If unsure of a concrete value, read `NOSTRUM-DESIGN.md`.
2. Apply the two-mode color/type/motion/structure rules above.
3. Flag anything that drifts toward generic-ecommerce, cold/flashy/cluttered, or that loses the agriculture soul — steer back to warm quiet luxury.
