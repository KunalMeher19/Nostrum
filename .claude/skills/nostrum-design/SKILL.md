---
name: nostrum-design
description: Design language, visual rules, motion direction, and build conventions for the Nostrum luxury brand website. Invoke whenever building, styling, animating, or reviewing ANY Nostrum UI — pages, sections, components, hero, menu, cursor, color, typography, motion, or copy layout — to keep work on-brand (black canvas, lime accent, cinematic minimal, story-first). Use before writing CSS/JSX, choosing colors/fonts, adding animations, or structuring page sections.
---

# Nostrum Design

Nostrum is **a luxury brand experience that happens to sell products** — story first, product second. The client's references (Bugatti, Rolls-Royce, YSL, Audemars Piguet, Balmain, Aston Martin, Bang & Olufsen, Locomotive, Basic/Dept, Framer) all sell a *feeling*. Never build generic e-commerce (no Amazon/Shopify patterns).

**Always read `NOSTRUM-DESIGN.md` (repo root) for the full spec.** This skill is the quick enforcement layer.

## The 6 principles
1. Luxury first — every interaction intentional and refined.
2. Minimal but cinematic — space + motion over clutter.
3. Tell the story — don't just list products.
4. Motion with purpose — guide attention, never distract.
5. Photography is 80% of the result — layout elevates images.
6. Consistent language — black, lime, clean type, smooth transitions, subtle light.

Mood: **Luxury. Quiet. Confident. Editorial. Cinematic.**

## Color (≤4 on screen)
- Backgrounds: `#050505` (default), `#090909`, `#111111` (cards), `#1a1a1a` (borders).
- White `#f5f5f3` (sparingly), muted grey `#8a8a8a`.
- **Light/motion = warm gold/amber** `#e6b45a` / `#ff8a3d` — trails, glow, hero, hover/CTA. The client's actual light-trail assets are gold/amber, NOT green.
- **Green `#9bd64a` is RESERVED for the footer wordmark ONLY** (client said "cool green" once, only for the B&O-style footer). Do not make green a site-wide accent.
- The ONE light section (Contact): paper `#f4f4f2`, ink `#0e1a26`.
- Black is the canvas; white is an accent; gold is energy/light, not flat fill everywhere.

## Typography
- Huge type, very little text, lots of whitespace. **No dense paragraphs.**
- Display poster-scale (`clamp(3rem,12vw,14rem)`), tight tracking; small eyebrows uppercase + wide tracking.
- Refined grotesk for UI/body; editorial display for hero. Confirm licensed fonts with client.
- Headlines may animate word-by-word.

## Structure (scenes, not sections)
Hero → Brand Story → Featured Products → Philosophy → Collection Preview → Gallery/Lifestyle → Process/Craftsmanship → Professional Clients/Restaurants (B2B "¿Eres chef profesional?") → Shop → Contact (light section) → Large poster-scale footer wordmark.
Smooth inertia scroll; scene-to-scene storytelling; luxury spacing.
**Scroll color shift:** background tone transitions subtly as you scroll to the bottom (Basic Agency cue — client liked this). Slow/atmospheric, not a hard switch.
**Gallery/Lifestyle scene:** floating 3D image gallery modeled on Framer's ImageWheel; slow/elegant motion.

## Signature interactions
- **Hero:** light moving through darkness — canvas/shader **gold/amber** light-trails, motion-blurred, mouse-reactive, soft glow. NOT a video background. Subtle, never flashy. (Borrow only Locomotive's immersive hero-heading idea, not its overall style.)
- **Menu:** Rolls-Royce split screen — links on one side, the **actual current page background image BLURRED** bleeding through on the other (not a flat overlay). Open with blur + fade + scale, smooth. No instant popup.
- **Cursor:** custom white circle tracking the mouse with **ZERO lag — no lerp/easing** (client liked Rolls' no-delay cursor). Hover = reveal/scale/fade/mask/blur/glow. (Magnetic buttons = optional suggestion, NOT client-requested.)
- **Footer:** poster-like oversized "NOSTRUM" wordmark, minimal links; home of the reserved green moment.
- **Contact:** single paper section, big headline, small details, whitespace, no fancy form. Balmain 3-card block (Boutiques/Care/FAQ) goes HERE, not the homepage.

## Motion
Slow, elegant, custom easing (~0.8–1.2s, expo/power3-style). Scroll reveals = fade + slight rise + clip-path mask. Purposeful only.

## Tech stack
Next.js + TypeScript · Tailwind · GSAP + ScrollTrigger · Lenis · React Three Fiber/Three.js (+ Spline) for hero light · Framer Motion / Motion One for micro-interactions · Cloudinary / next/image.

## DON'T
White default background · dense copy · cluttered grids · generic video-bg hero · fast/flashy/childish motion (no confetti, flying cards, crazy 3D) · >4 colors · Amazon/Shopify commerce patterns.

## When invoked
1. If unsure of a concrete value, read `NOSTRUM-DESIGN.md`.
2. Apply the color/type/motion rules above to the work at hand.
3. Flag anything that drifts toward generic-ecommerce or flashy/cluttered and steer it back to quiet luxury.
