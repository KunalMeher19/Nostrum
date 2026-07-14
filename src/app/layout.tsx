import type { Metadata, Viewport } from "next";
import { Libre_Franklin, Raleway } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll/SmoothScroll";
import UnderlayNav from "@/components/UnderlayNav/UnderlayNav";
import RingCursor from "@/components/RingCursor/RingCursor";

// Clean, quiet sans for UI/body (§4 — client-approved type direction)
const sans = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Fashion-sleek display face for hero/wordmark moments (§4)
const display = Raleway({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Nostrum — Olive Oil",
  description:
    "Nostrum is not simply olive oil. A luxury brand experience — story first, product second.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Critical loading CSS — inlined into <head> so it is applied at the VERY first
 * paint, before globals.css / crisp-header.css finish loading.
 *
 * Root cause it fixes: the rules that lock document scroll, hide the still-
 * hidden hero, and paint the load glow live only in those (async-injected, in
 * dev) stylesheets. On a hard reload there was a window before they applied
 * where the document was scrollable (a native scrollbar flashed) and the hero
 * collapsed — exposing the below-hero Products/Story sections, and letting the
 * browser restore scroll onto them — instead of the golden glow. Painting these
 * few rules from the SSR'd HTML removes that window entirely: overflow is hidden
 * from frame one (so scroll restoration has nowhere to land and no scrollbar
 * appears), and the glow backdrop is the first thing on screen.
 *
 * Every rule here is an exact subset of globals.css / crisp-header.css — once
 * those load they match identically, so there is no conflict or override.
 */
const CRITICAL_LOADING_CSS = `
html, body { background-color: #050505; }
html:has(.crisp-header.is--loading) { overflow: hidden; }
html:has(.crisp-header.is--loading) body { overflow: hidden; height: 100dvh; }
main:has(.crisp-header.is--loading) { height: 100dvh; overflow: hidden; }
.crisp-loader { display: none; }
.crisp-header.is--loading .crisp-header__slider { display: none; }
.crisp-header.is--loading .crisp-loader { display: flex; }
.crisp-header.is--loading.is--hidden { display: none; }
html:has(.crisp-header.is--loading) [data-main] > *:not(.crisp-header) { visibility: hidden; }
html:has(.crisp-header.is--loading) [data-main] {
  background-image: radial-gradient(
    ellipse 72% 52% at 50% 50%,
    rgba(74, 58, 31, 0.95) 0%,
    rgba(51, 40, 22, 0.6) 30%,
    rgba(20, 15, 9, 0.85) 58%,
    #050505 82%
  );
  background-repeat: no-repeat;
  background-position: center;
}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
      </head>
      <body>
        {/* Critical loading styles — must be in the initial HTML so the load
            glow + scroll lock apply at first paint, before the async
            stylesheets. See CRITICAL_LOADING_CSS above. */}
        <style
          id="critical-loading"
          dangerouslySetInnerHTML={{ __html: CRITICAL_LOADING_CSS }}
        />
        {/* Global smooth scroll — no visual output */}
        <SmoothScroll />
        {/* Global navigation — fixed, always on top */}
        <UnderlayNav />
        {/* White ring pointer follower (RR-style). Self-disables on touch. */}
        <RingCursor />
        {/* Page content — receives [data-main] in each page component */}
        {children}
      </body>
    </html>
  );
}
