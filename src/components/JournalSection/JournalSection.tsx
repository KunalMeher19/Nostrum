"use client";

// JournalSection · the Journal landing: a hero, then the digital
// museum (four rooms you walk through, scroll-driven), then the
// stories (the blog). Dark brand page; imagery carries the weight,
// captions whisper.
//
// Multi-language support (2026-08-20): posts can have translations.
// When displaying, we check if the current locale has a translation;
// if yes, show it; otherwise fall back to the English (base) content.
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  type JournalPost,
  type MuseumExhibit,
} from "@/lib/api";
import "./journal.css";

// Helper to get localized post content
function getLocalizedPost(post: JournalPost, locale: string) {
  // If locale is 'en' or no translations exist, return base content
  if (locale === 'en' || !post.translations) {
    return {
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
    };
  }

  // Check if translation exists for this locale
  const translation = post.translations[locale as 'es' | 'ca' | 'it' | 'el'];
  if (translation) {
    return {
      title: translation.title,
      excerpt: translation.excerpt,
      body: translation.body,
    };
  }

  // Fallback to English
  return {
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
  };
}

export default function JournalSection({
  posts,
  exhibits,
}: {
  posts: JournalPost[];
  exhibits: MuseumExhibit[];
}) {
  const { t, locale } = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll choreography: room walls reveal, exhibits rise into place,
  // captions fade in late (a beat after their image). Reduced motion:
  // everything is simply visible.
  useEffect(() => {
    const el = root.current;
    if (!el || !mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is--static");
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let alive = true;
    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.gsap ?? gsapMod.default;
      gsap.registerPlugin(ScrollTrigger);
      if (!alive) return;

      const branchWrapper = document.querySelector<HTMLElement>(".jr__branch-wrapper");
      const branchPaths = Array.from(
        document.querySelectorAll<SVGGeometryElement>("[data-jr-branch] path")
      );
      let inertiaReset: ReturnType<typeof setTimeout> | undefined;
      const settleBranch = branchWrapper
        ? gsap.quickTo(branchWrapper, "y", {
            duration: 0.8,
            ease: "power3.out",
          })
        : undefined;
      let previousScrollY = window.scrollY;
      const onScroll = () => {
        if (!branchWrapper || !settleBranch) return;
        const delta = window.scrollY - previousScrollY;
        previousScrollY = window.scrollY;
        settleBranch(gsap.utils.clamp(-30, 30, -delta * 0.35));
        if (inertiaReset) window.clearTimeout(inertiaReset);
        inertiaReset = window.setTimeout(() => settleBranch(0), 90);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      ctx = gsap.context(() => {
        // Hero: headline lines rise out of their masks, the furniture
        // (eyebrow, lede, footer row) settles a beat later, the golden
        // streak breathes in, and the olive branch sketches itself.
        gsap.fromTo(
          "[data-jr-line]",
          { yPercent: 118 },
          {
            yPercent: 0,
            duration: 1.5,
            ease: "expo.out",
            stagger: 0.16,
            delay: 0.25,
          }
        );
        gsap.fromTo(
          "[data-jr-item]",
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.14,
            delay: 0.6,
          }
        );
        gsap.fromTo(
          "[data-jr-streak]",
          { autoAlpha: 0, scaleX: 0.4 },
          { autoAlpha: 1, scaleX: 1, duration: 2.4, ease: "expo.out", delay: 0.7 }
        );
        branchPaths.forEach((p, i) => {
          const len = p.getTotalLength();
          gsap.fromTo(
            p,
            { strokeDasharray: len, strokeDashoffset: len, autoAlpha: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.2,
              ease: "power2.inOut",
              delay: 0.9 + i * 0.07,
            }
          );
        });

        // Gentle depth as the hero scrolls away: headline drifts.
        gsap.to("[data-jr-title]", {
          yPercent: -14,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-jr-hero]",
            start: "top top",
            end: "bottom 30%",
            scrub: true,
          },
        });

        if (branchWrapper) {
          gsap.to(branchWrapper, {
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "bottom 85%",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        // Stories: rows rise as they enter.
        gsap.utils.toArray<HTMLElement>("[data-jr-story]").forEach((row) => {
          gsap.fromTo(
            row,
            { autoAlpha: 0, y: 30 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: row, start: "top 85%" },
            }
          );
        });

        ScrollTrigger.refresh();
      }, el);
    })();

    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      if (inertiaReset) window.clearTimeout(inertiaReset);
      ctx?.revert();
    };
  }, [posts.length, exhibits.length, mounted]);

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const branchPortal = mounted && createPortal(
    <div className="jr__branch-wrapper" data-jr-branch>
        <svg
          className="jr__hero-branch"
          viewBox="0 0 320 800"
          fill="none"
          aria-hidden="true"
          preserveAspectRatio="xMidYMin meet"
        >
          {/* Stem: a gentle, living curve extended all the way down. */}
          <path
            d="M66 404 C 78 380 86 364 96 344 C 106 324 113 308 124 290 C 135 272 141 256 152 238 C 163 220 171 204 182 186 C 193 168 202 152 214 134 C 226 116 236 100 248 84 C 258 71 268 56 278 42"
            strokeWidth="1.6"
          />
          {/* Leaves grow FROM the stem nodes, alternating sides. */}
          <path d="M96 344 Q58 352 30 380 Q68 372 96 344" />
          <path d="M124 290 Q156 310 194 308 Q162 288 124 290" />
          <path d="M152 238 Q113 238 80 260 Q119 260 152 238" />
          <path d="M182 186 Q219 190 252 172 Q215 168 182 186" />
          <path d="M214 134 Q185 111 148 108 Q177 131 214 134" />
          <path d="M248 84 Q280 92 310 78 Q278 70 248 84" />
          <path d="M278 42 Q301 31 312 8 Q289 19 278 42" />
          {/* Faint midribs give the leaves a hand-sketched interior. */}
          <g opacity="0.5" strokeWidth="1">
            <path d="M90 347 Q64 362 40 374" />
            <path d="M130 292 Q158 300 186 306" />
            <path d="M146 240 Q118 248 90 256" />
            <path d="M188 185 Q218 180 244 174" />
            <path d="M208 131 Q182 120 158 112" />
            <path d="M254 84 Q280 84 302 79" />
          </g>
          {/* Two olives hanging from drooping stalks at a lower node. */}
          <path d="M110 317 Q120 338 114 354" />
          <path d="M110 317 Q130 332 142 344" />
          <path d="M114 354 a 12 15 -10 1 1 0.1 0" strokeWidth="1.5" />
          <path d="M142 344 a 11 14 -24 1 1 0.1 0" strokeWidth="1.5" />
        </svg>
    </div>,
    document.body
  );

  return (
    <>
      {branchPortal}
      <div ref={root} className="jr">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="jr__hero" data-jr-hero>
        {/* Golden horizon streak, drifting slowly behind the headline. */}
        {/* <span className="jr__hero-streak" data-jr-streak aria-hidden="true" />
 */}

        <div className="jr__hero-top" data-jr-item>
          <span className="jr__hero-rule" aria-hidden="true" />
          <p className="jr__eyebrow">{t("journal.eyebrow")}</p>
        </div>

        <h1 className="jr__title" data-jr-title>
          <span className="jr__title-line">
            <span className="jr__title-seg" data-jr-line>
              {t("journal.title_a")}
            </span>
          </span>
          <span className="jr__title-line is--accent">
            <span className="jr__title-seg" data-jr-line>
              {t("journal.title_b")}
            </span>
          </span>
        </h1>

        <p className="jr__lede" data-jr-item>
          {t("journal.lede")}
        </p>

        <div className="jr__hero-foot" data-jr-item>
          <p className="jr__hint" aria-hidden="true">
            <span className="jr__hint-line" />
            {t("journal.scroll_hint")}
          </p>
        </div>
      </header>

      {/* ── The stories (blog) ───────────────────────────────────── */}
      <section className="jr__stories" data-jr-stories aria-label={t("journal.stories_title")}>
        {/* Posts column: single column, no sticky sidebar */}
        <div className="jr__stories-main">
          <header className="jr__stories-head">
            <p className="jr__eyebrow">{t("journal.stories_eyebrow")}</p>
            <h2 className="jr__stories-title">{t("journal.stories_title")}</h2>
          </header>

          {posts.length === 0 ? (
            // Loading skeleton placeholders when backend is not available
            <ol className="jr__list">
              {[1, 2, 3].map((n) => (
                <li key={n} data-jr-story>
                  <div className="jr__story jr__story--skeleton">
                    <span className="jr__story-media jr__skeleton-shimmer">
                      <span className="jr__skeleton-placeholder" />
                    </span>
                    <span className="jr__story-body">
                      <span className="jr__story-date jr__skeleton-text">
                        <span className="jr__skeleton-bar" style={{ width: "30%" }} />
                      </span>
                      <span className="jr__story-title jr__skeleton-text">
                        <span className="jr__skeleton-bar" style={{ width: "85%" }} />
                      </span>
                      <span className="jr__story-excerpt jr__skeleton-text">
                        <span className="jr__skeleton-bar" style={{ width: "100%", marginBottom: "0.5em" }} />
                        <span className="jr__skeleton-bar" style={{ width: "70%" }} />
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="jr__list">
              {posts.map((p) => {
                const localized = getLocalizedPost(p, locale);
                return (
                  <li key={p.id} data-jr-story>
                    <Link href={`/${locale}/journal/${p.slug}`} className="jr__story">
                      {p.coverImage && (
                        <span className="jr__story-media">
                          <Image
                            src={p.coverImage}
                            alt=""
                            fill
                            sizes="(max-width: 760px) 92vw, 28vw"
                          />
                        </span>
                      )}
                      <span className="jr__story-body">
                        <span className="jr__story-date">{dateFmt(p.publishedAt)}</span>
                        <span className="jr__story-title">{localized.title}</span>
                        <span className="jr__story-excerpt">{localized.excerpt}</span>
                        <span className="jr__story-more">
                          {t("journal.read_story")}
                          <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
                            <path
                              d="M1 13 13 1M4 1h9v9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                            />
                          </svg>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
