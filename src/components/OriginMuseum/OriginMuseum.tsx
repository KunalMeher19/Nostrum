"use client";

// OriginMuseum · "A house you can walk through" section moved from Journal
// to Origins page. Four rooms showcasing the grove, harvest, mill, and family.
import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  MUSEUM_ROOMS,
  type MuseumExhibit,
  type MuseumRoom,
} from "@/lib/api";
import "./origin-museum.css";

export default function OriginMuseum({
  exhibits,
}: {
  exhibits: MuseumExhibit[];
}) {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);

  // Scroll choreography: room walls reveal, exhibits rise into place
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
        // Each room: number + title unmask as the room enters
        gsap.utils.toArray<HTMLElement>("[data-origin-room]").forEach((room) => {
          const head = room.querySelectorAll("[data-origin-room-head] > *");
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

        // Each exhibit: frame reveals, image drifts, caption follows
        gsap.utils.toArray<HTMLElement>("[data-origin-exhibit]").forEach((ex) => {
          const frame = ex.querySelector("[data-origin-frame]");
          const img = ex.querySelector("img");
          const cap = ex.querySelector("[data-origin-caption]");
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

        ScrollTrigger.refresh();
      }, el);
    })();

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, [exhibits.length]);

  const byRoom = (room: MuseumRoom) =>
    exhibits.filter((e) => e.room === room);
  const rooms = MUSEUM_ROOMS.filter((r) => byRoom(r).length > 0);

  if (rooms.length === 0) return null;

  return (
    <section
      ref={root}
      className="origin-museum"
      aria-label={t("journal.museum_title")}
    >
      <div className="origin-museum__door">
        <p className="origin-museum__eyebrow">{t("journal.museum_eyebrow")}</p>
        <h2 className="origin-museum__title">{t("journal.museum_title")}</h2>
        <p className="origin-museum__lede">{t("journal.museum_lede")}</p>
      </div>

      {rooms.map((room, ri) => (
        <article className="origin-museum__room" data-origin-room key={room}>
          <header className="origin-museum__room-head" data-origin-room-head>
            <span className="origin-museum__room-no">
              {["I", "II", "III", "IV"][ri]}
            </span>
            <h3 className="origin-museum__room-title">{t(`journal.room_${room}`)}</h3>
            <p className="origin-museum__room-sub">{t(`journal.room_${room}_sub`)}</p>
          </header>

          <div className="origin-museum__pieces">
            {byRoom(room).map((ex, i) => (
              <figure
                className="origin-museum__exhibit"
                data-origin-exhibit
                key={i}
              >
                <div className="origin-museum__frame" data-origin-frame>
                  <Image
                    src={ex.image}
                    alt={ex.title}
                    fill
                    sizes="(max-width: 760px) 92vw, 60vw"
                  />
                </div>
                <figcaption className="origin-museum__caption" data-origin-caption>
                  <span className="origin-museum__caption-title">{ex.title}</span>
                  <span className="origin-museum__caption-text">{ex.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
