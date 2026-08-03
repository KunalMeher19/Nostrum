"use client";

// JournalSection · the Journal landing: a hero, then the digital
// museum (four rooms you walk through, scroll-driven), then the
// stories (the blog). Dark brand page; imagery carries the weight,
// captions whisper.
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  MUSEUM_ROOMS,
  type JournalPost,
  type MuseumExhibit,
  type MuseumRoom,
} from "@/lib/api";
import "./journal.css";

export default function JournalSection({
  posts,
  exhibits,
}: {
  posts: JournalPost[];
  exhibits: MuseumExhibit[];
}) {
  const { t, locale } = useLocale();
  const root = useRef<HTMLDivElement>(null);

  // Scroll choreography: room walls reveal, exhibits rise into place,
  // captions fade in late (a beat after their image). Reduced motion:
  // everything is simply visible.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
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
        gsap.utils
          .toArray<SVGGeometryElement>("[data-jr-branch] path")
          .forEach((p, i) => {
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

        // Gentle depth as the hero scrolls away: headline and branch
        // drift at different speeds.
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
        gsap.to("[data-jr-branch]", {
          y: 110,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-jr-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Each room: number + title unmask as the room enters.
        gsap.utils.toArray<HTMLElement>("[data-jr-room]").forEach((room) => {
          const head = room.querySelectorAll("[data-jr-room-head] > *");
          gsap.fromTo(
            head,
            { autoAlpha: 0, y: 34 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              stagger: 0.1,
              scrollTrigger: { trigger: room, start: "top 72%" },
            }
          );
        });

        // Each exhibit: frame reveals with a clip mask, image drifts to
        // rest, caption follows a beat later.
        gsap.utils.toArray<HTMLElement>("[data-jr-exhibit]").forEach((ex) => {
          const frame = ex.querySelector("[data-jr-frame]");
          const img = ex.querySelector("img");
          const cap = ex.querySelector("[data-jr-caption]");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: ex, start: "top 78%" },
          });
          if (frame)
            tl.fromTo(
              frame,
              { clipPath: "inset(8% 6% 8% 6%)", autoAlpha: 0 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                autoAlpha: 1,
                duration: 1.2,
                ease: "expo.out",
              }
            );
          if (img)
            tl.fromTo(
              img,
              { scale: 1.12 },
              { scale: 1, duration: 1.6, ease: "power3.out" },
              "<"
            );
          if (cap)
            tl.fromTo(
              cap,
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" },
              "-=0.9"
            );
        });

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
      ctx?.revert();
    };
  }, [posts.length, exhibits.length]);

  const byRoom = (room: MuseumRoom) =>
    exhibits.filter((e) => e.room === room);
  const rooms = MUSEUM_ROOMS.filter((r) => byRoom(r).length > 0);

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  return (
    <div ref={root} className="jr">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="jr__hero" data-jr-hero>
        {/* Golden horizon streak, drifting slowly behind the headline. */}
        <span className="jr__hero-streak" data-jr-streak aria-hidden="true" />

        {/* Hand-drawn olive branch (esbozo) that sketches itself in. */}
        <svg
          className="jr__hero-branch"
          data-jr-branch
          viewBox="0 0 320 420"
          fill="none"
          aria-hidden="true"
        >
          {/* Stem: a gentle, living curve. */}
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
          <p className="jr__hero-index">
            {rooms.length > 0 && (
              <span>
                {["I", "II", "III", "IV"][rooms.length - 1]}{" "}
                {t("journal.hero_rooms")}
              </span>
            )}
            {rooms.length > 0 && posts.length > 0 && (
              <span className="jr__hero-index-dot" aria-hidden="true" />
            )}
            {posts.length > 0 && (
              <span>
                {String(posts.length).padStart(2, "0")}{" "}
                {t("journal.hero_notes")}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* ── The museum ───────────────────────────────────────────── */}
      {rooms.length > 0 && (
        <section className="jr__museum" aria-label={t("journal.museum_title")}>
          <div className="jr__museum-door">
            <p className="jr__eyebrow">{t("journal.museum_eyebrow")}</p>
            <h2 className="jr__museum-title">{t("journal.museum_title")}</h2>
            <p className="jr__museum-lede">{t("journal.museum_lede")}</p>
          </div>

          {rooms.map((room, ri) => (
            <article className="jr__room" data-jr-room key={room}>
              <header className="jr__room-head" data-jr-room-head>
                <span className="jr__room-no">
                  {["I", "II", "III", "IV"][ri]}
                </span>
                <h3 className="jr__room-title">{t(`journal.room_${room}`)}</h3>
                <p className="jr__room-sub">{t(`journal.room_${room}_sub`)}</p>
              </header>

              <div className="jr__pieces">
                {byRoom(room).map((ex, i) => (
                  <figure
                    className={`jr__exhibit${i % 2 ? " is--right" : ""}`}
                    data-jr-exhibit
                    key={ex.id}
                  >
                    <div className="jr__frame" data-jr-frame>
                      <Image
                        src={ex.image}
                        alt={ex.title}
                        fill
                        sizes="(max-width: 760px) 92vw, 60vw"
                      />
                    </div>
                    <figcaption className="jr__caption" data-jr-caption>
                      <span className="jr__caption-title">{ex.title}</span>
                      <span className="jr__caption-text">{ex.caption}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </article>
          ))}

          <p className="jr__museum-close">{t("journal.museum_close")}</p>
        </section>
      )}

      {/* ── The stories (blog) ───────────────────────────────────── */}
      <section className="jr__stories" aria-label={t("journal.stories_title")}>
        <header className="jr__stories-head">
          <p className="jr__eyebrow">{t("journal.stories_eyebrow")}</p>
          <h2 className="jr__stories-title">{t("journal.stories_title")}</h2>
        </header>

        {posts.length === 0 && (
          <p className="jr__empty">{t("journal.stories_empty")}</p>
        )}

        <ol className="jr__list">
          {posts.map((p) => (
            <li key={p.id} data-jr-story>
              <Link href={`/${locale}/journal/${p.slug}`} className="jr__story">
                {p.coverImage && (
                  <span className="jr__story-media">
                    <Image
                      src={p.coverImage}
                      alt=""
                      fill
                      sizes="(max-width: 760px) 92vw, 34vw"
                    />
                  </span>
                )}
                <span className="jr__story-body">
                  <span className="jr__story-date">{dateFmt(p.publishedAt)}</span>
                  <span className="jr__story-title">{p.title}</span>
                  <span className="jr__story-excerpt">{p.excerpt}</span>
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
          ))}
        </ol>
      </section>
    </div>
  );
}
