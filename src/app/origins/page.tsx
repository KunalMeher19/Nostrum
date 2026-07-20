import type { Metadata } from "next";
import Link from "next/link";
import StoryScenes from "@/components/StoryScenes/StoryScenes";
import StoryProcess from "@/components/StoryProcess/StoryProcess";
import OriginMap from "@/components/OriginMap/OriginMap";
import OriginThread from "@/components/OriginThread/OriginThread";
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
 * Structure (a book, chapter by chapter — the OriginThread tracks them):
 * manifesto + scroll-story → StoryProcess (the timeline) → the place (map)
 * → a quiet outro CTA into the Shop. (The voice-quote and numbers chapters
 * were cut on client direction, 2026-07.) Copy is placeholder in the
 * brief's voice (§7) until the client's real content lands.
 */
export default function OriginsPage() {
  return (
    <main data-main className="origins">
      {/* The chapter thread — fixed progress line, ticks per chapter
          (discovers [data-origin-chapter] sections below). */}
      <OriginThread />

      {/* Cinematic pinned scroll-story — manifesto title page, then
          the land → family → harvest. Opens the page. */}
      <div data-origin-chapter="The story">
        <StoryScenes />
      </div>

      {/* The process timeline — moved from the homepage Story section. */}
      <div data-origin-chapter="The craft">
        <StoryProcess />
      </div>

      {/* The place — hand-drawn Catalan coast, one gold marker. Sits after
          the craft (client direction, 2026-07) on the same ink canvas. */}
      <div data-origin-chapter="The place">
        <OriginMap />
      </div>

      <section className="origins__outro" aria-label="Continue to the shop">
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
