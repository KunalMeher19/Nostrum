import type { Metadata } from "next";
import Link from "next/link";
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
      <header className="origins__hero">
        <div className="origins__hero-inner">
          <p className="origins__eyebrow">From the land</p>
          <h1 className="origins__title">Origins</h1>
          <p className="origins__lead">
            A family grove on the Mediterranean coast. Old trees, patient
            hands, and one rule that never changed&nbsp;— the fruit decides
            when.
          </p>
        </div>
      </header>

      {/* The process timeline — moved from the homepage Story section. */}
      <StoryProcess />

      <section className="origins__outro" aria-label="Continue to the shop">
        <p className="origins__outro-
        line">
          From our grove to your table.
        </p>
        <Link href="/products" className="origins__cta">
          Shop the collection
        </Link>
      </section>
    </main>
  );
}
