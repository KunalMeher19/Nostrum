import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll/SmoothScroll";
import UnderlayNav from "@/components/UnderlayNav/UnderlayNav";

// Refined grotesk for UI/body (§4 — free stand-in until client confirms licensed faces)
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Editorial display face for hero/wordmark moments (§4)
const display = Fraunces({
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        {/* Global smooth scroll — no visual output */}
        <SmoothScroll />
        {/* Global navigation — fixed, always on top */}
        <UnderlayNav />
        {/* Page content — receives [data-main] in each page component */}
        {children}
      </body>
    </html>
  );
}
