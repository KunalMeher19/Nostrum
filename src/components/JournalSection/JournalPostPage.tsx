"use client";

// JournalPostPage · one story, read quietly. Large cover, measured
// text column, a way back to the journal and onward to the shop.
//
// Multi-language support (2026-08-20): displays translated content
// if available for the current locale, otherwise falls back to English.
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "../LocaleContext/LocaleContext";
import type { JournalPost } from "@/lib/api";
import "./journal.css";

// Helper to get localized post content
function getLocalizedPost(post: JournalPost, locale: string) {
  if (locale === 'en' || !post.translations) {
    return {
      title: post.title,
      excerpt: post.excerpt,
      body: post.body || '',
    };
  }

  const translation = post.translations[locale as 'es' | 'ca' | 'it' | 'el'];
  if (translation) {
    return {
      title: translation.title,
      excerpt: translation.excerpt,
      body: translation.body,
    };
  }

  return {
    title: post.title,
    excerpt: post.excerpt,
    body: post.body || '',
  };
}

export default function JournalPostPage({ post }: { post: JournalPost }) {
  const { t, locale } = useLocale();
  const root = useRef<HTMLDivElement>(null);

  // Get localized content
  const localized = getLocalizedPost(post, locale);

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
      const gsap = gsapMod.gsap ?? gsapMod.default;
      if (!alive) return;
      ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-jp-reveal]",
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.1,
          }
        );
      }, el);
    })();
    return () => {
      alive = false;
      ctx?.revert();
    };
  }, []);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const paragraphs = (post.body ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div ref={root} className="jp">
      <article className="jp__article">
        <header className="jp__head">
          <Link href={`/${locale}/journal`} className="jp__back" data-jp-reveal>
            ← {t("journal.back")}
          </Link>
          <p className="jr__eyebrow" data-jp-reveal>
            {date}
          </p>
          <h1 className="jp__title" data-jp-reveal>
            {post.title}
          </h1>
        </header>

        {post.coverImage && (
          <div className="jp__cover" data-jp-reveal>
            <Image
              src={post.coverImage}
              alt=""
              fill
              priority
              sizes="(max-width: 900px) 96vw, 72vw"
            />
          </div>
        )}

        <div className="jp__body" data-jp-reveal>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <footer className="jp__foot" data-jp-reveal>
          <Link href={`/${locale}/journal`} className="jp__foot-link">
            {t("journal.back")}
          </Link>
          <Link href={`/${locale}/products`} className="jp__foot-link is--shop">
            {t("journal.to_shop")}
            <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
              <path
                d="M1 13 13 1M4 1h9v9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </Link>
        </footer>
      </article>
    </div>
  );
}
