"use client";

import { useEffect, useRef, useState } from "react";
import {
  hasClientNavigated,
  CURTAIN_REVEAL_EVENT,
} from "../RouteCurtain/curtainNav";
import "./contact-section.css";
import { useLocale } from "../LocaleContext/LocaleContext";
import { submitContact, type ContactTopic } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* ContactSection — the /contact split (NOSTRUM-DESIGN §7 "Contact").   */
/*                                                                      */
/* LEFT  — the brand moment: a deep-olive card with the warm gold bloom */
/*         (same family as the load glow), poster headline, and the     */
/*         direct channels — email · phone · address · WhatsApp (§12    */
/*         contextual CTA) · socials. Details are placeholders (§20.6). */
/* RIGHT — the form: name / email / topic / message. Topic doubles as   */
/*         B2B lead routing ("Professional" = the ¿Eres chef            */
/*         profesional? path, §7 B2B).                                  */
/*                                                                      */
/* Entry: same curtain-aware choreography as StoryScenes — staged in    */
/* is--pre, released to is--enter when the RouteCurtain starts lifting  */
/* (or immediately on a hard load). Pure CSS transitions, no GSAP.      */
/* ------------------------------------------------------------------ */

const CONTACT = {
  email: "sales@nostrumoils.com",
  salesEmail: "sales@nostrumoils.com",
  phone: "+34 680 889 399",
  address: ["El Perelló, Catalonia", "Spain, EU"],
  whatsapp:
    "https://wa.me/34680889399?text=Hola%20Nostrum%2C%20me%20gustar%C3%ADa%20hablar%20con%20vosotros.",
};

// Labels are i18n keys resolved via t() at render.
const TOPICS = [
  { value: "general", labelKey: "contact.topic_general" },
  { value: "professional", labelKey: "contact.topic_professional" },
  { value: "press", labelKey: "contact.topic_press" },
];

type SendState = "idle" | "sending" | "sent" | "error";

export default function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [topic, setTopic] = useState("general");
  const [sendState, setSendState] = useState<SendState>("idle");
  const { t, locale } = useLocale();

  // Curtain-aware entry: hold the staged pre-state until the RouteCurtain
  // starts revealing the page, then release — the settle plays AS the drape
  // lifts, one continuous beat (same pattern as StoryScenes).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return; // no staging — content is simply visible
    }

    let entryTimer = 0;
    let doneTimer = 0;
    const beginEntry = () => {
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      root.classList.remove("is--pre");
      void root.offsetWidth; // reflow so pre→enter actually transitions
      root.classList.add("is--enter");
      // Shed the entry class once played so hover/focus transitions aren't
      // fighting the long entry curves.
      doneTimer = window.setTimeout(
        () => root.classList.remove("is--enter"),
        2400
      );
    };

    root.classList.add("is--pre");
    if (hasClientNavigated()) {
      window.addEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      entryTimer = window.setTimeout(beginEntry, 3500); // curtain safety net
    } else {
      entryTimer = window.setTimeout(beginEntry, 60);
    }

    return () => {
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  // POST to the Express API (stored + relayed to the house inbox; the
  // relay itself is a console stub until an email provider is wired).
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendState === "sending" || sendState === "sent") return;
    const form = new FormData(e.currentTarget);
    setSendState("sending");
    try {
      await submitContact({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        topic: topic as ContactTopic,
        message: String(form.get("message") ?? ""),
        locale,
      });
      setSendState("sent");
    } catch {
      // Keep the form (and what they typed) so they can simply retry.
      setSendState("error");
    }
  };

  return (
    <section ref={rootRef} className="ct" aria-labelledby="ct-title">
      {/* ── LEFT · the brand card ─────────────────────────────── */}
      <aside className="ct__panel">
        {/* Stock photo: olive oil pour — overlaid with dark gradient for legibility */}
        {/* <div className="ct__panel-photo" aria-hidden="true" /> */}
        <div className="ct__panel-glow" aria-hidden="true" />
        <div className="ct__panel-grain" aria-hidden="true" />

        <div className="ct__panel-head" data-ct-reveal>
          <p className="ct__eyebrow">{t("contact.eyebrow")}</p>
          <h1 id="ct-title" className="ct__headline">
            {t("contact.headline")}
          </h1>
          <p className="ct__lede">{t("contact.lede")}</p>
        </div>

        <div className="ct__channels" data-ct-reveal>
          <div className="ct__channel">
            <span className="ct__channel-label">{t("contact.email_label")}</span>
            <a className="ct__channel-value" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>
          <div className="ct__channel">
            <span className="ct__channel-label">{t("contact.phone_label")}</span>
            <a
              className="ct__channel-value"
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
            >
              {CONTACT.phone}
            </a>
          </div>
          <div className="ct__channel">
            <span className="ct__channel-label">{t("contact.estate_label")}</span>
            <address className="ct__channel-value ct__address">
              {CONTACT.address[0]}
              <br />
              {CONTACT.address[1]}
            </address>
          </div>

          {/* WhatsApp — the §12 contextual CTA: discreet outline pill, never
              the stock green bubble. */}
          <a
            className="ct__wa"
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("contact.whatsapp_label")}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.1 4c-.2 0-.4 0-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.2 1.6 2.5 4 3.4 2 .8 2.4.6 2.8.6.4 0 1.4-.5 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2-1.5-.7c-.2-.1-.4-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3.2-.5v-.4L10 8.1c-.1-.3-.3-.3-.5-.3h-.6Z"
              />
            </svg>
            <span>WhatsApp</span>
            <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
              <path
                d="M2 10 10 2M4 2h6v6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </a>
        </div>

        {/* Socials removed — client has no social media accounts */}
      </aside>

      {/* ── RIGHT · the form ──────────────────────────────────── */}
      <div className="ct__form-col">
        {sendState === "sent" ? (
          <div className="ct__sent" role="status">
            <span className="ct__sent-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  d="M4 12.5 9.5 18 20 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h2 className="ct__sent-title">{t("contact.sent_title")}</h2>
            <p className="ct__sent-line">{t("contact.sent_line")}</p>
          </div>
        ) : (
          <form className="ct__form" onSubmit={onSubmit} noValidate={false}>
            <p className="ct__form-eyebrow" data-ct-reveal>
              {t("contact.form_eyebrow")}
            </p>

            <div className="ct__field" data-ct-reveal>
              <label htmlFor="ct-name">{t("contact.field_name")}</label>
              <input
                id="ct-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="María Serra"
                required
              />
              <span className="ct__field-line" aria-hidden="true" />
            </div>

            <div className="ct__field" data-ct-reveal>
              <label htmlFor="ct-email">{t("contact.field_email")}</label>
              <input
                id="ct-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="maria@example.com"
                required
              />
              <span className="ct__field-line" aria-hidden="true" />
            </div>

            {/* Topic — segmented radios; "Professional · B2B" is the chef/
                distributor lead path (§7 B2B). */}
            <fieldset className="ct__topics" data-ct-reveal>
              <legend>{t("contact.field_topic")}</legend>
              <div className="ct__topics-row" role="radiogroup">
                {TOPICS.map(({ value, labelKey }) => (
                  <label
                    key={value}
                    className={`ct__topic${topic === value ? " is--on" : ""}`}
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={value}
                      checked={topic === value}
                      onChange={() => setTopic(value)}
                    />
                    <span>{t(labelKey)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="ct__field" data-ct-reveal>
              <label htmlFor="ct-message">{t("contact.field_message")}</label>
              <textarea
                id="ct-message"
                name="message"
                rows={4}
                placeholder={
                  topic === "professional"
                    ? t("contact.placeholder_professional")
                    : t("contact.placeholder_general")
                }
                required
              />
              <span className="ct__field-line" aria-hidden="true" />
            </div>

            <div className="ct__submit-row" data-ct-reveal>
              <button
                type="submit"
                className="ct__submit"
                disabled={sendState === "sending"}
              >
                <span className="ct__submit-label">
                  <span className="ct__submit-inner">
                    {sendState === "sending" ? t("contact.sending") : t("contact.send")}
                  </span>
                  <span className="ct__submit-inner is--dup" aria-hidden="true">
                    {sendState === "sending" ? t("contact.sending") : t("contact.send")}
                  </span>
                </span>
                <span className="ct__submit-arrow" aria-hidden="true">
                  →
                </span>
                <span className="ct__submit-line" aria-hidden="true" />
              </button>
              <p className="ct__gdpr">
                {sendState === "error"
                  ? t("contact.send_error")
                  : t("contact.gdpr")}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
