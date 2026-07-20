import type { Metadata } from "next";
import Link from "next/link";
import StoryScenes from "@/components/StoryScenes/StoryScenes";
import StoryProcess from "@/components/StoryProcess/StoryProcess";
import "./origins.css";

export const metadata: Metadata = {
  title: "Origins — Nostrum",
  description:
    "Where Nostrum begins. The grove, the family, and how the oil is made — from harvest to first cold pressing.",
};

/**
 * Origins — the deep storytelling page (NOSTRUM-DESIGN §7 "History").
 * Client direction (2026-07): the process timeline felt like it stretched the
 * homepage — especially on mobile — so it moved HERE, where going long is the
 * point. Split agreed with the client: "Our Story" on Home stays a short
 * cinematic teaser that links in; Origins carries the full narrative.
 *
 * Structure: dark editorial hero → StoryProcess (the timeline, unchanged) →
 * a quiet outro CTA into the Shop. Real copy + photography aren't ready
 * (§7), so the hero/outro text is rich placeholder in the brief's voice.
 */
export default function OriginsPage() {
  return (
    <main data-main className="origins">
      {/* Cinematic pinned scroll-story — the land → family → harvest.
          Opens the page and flows straight into the process timeline. */}
      <StoryScenes />

      {/* The process timeline — moved from the homepage Story section. */}
      <StoryProcess />

      <section className="origins__outro" aria-label="Continue to the shop">
        <p className="origins__outro-eyebrow">First cold pressing</p>
        <p className="origins__outro-line">From our grove to your table.</p>
        <Link href="/products" className="origins__cta">
          <span>Shop the collection</span>
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
            <path
              d="M1 13 13 1M4 1h9v9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </Link>
      </section>
    </main>
  );
}
