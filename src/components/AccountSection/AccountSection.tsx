"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  hasClientNavigated,
  CURTAIN_REVEAL_EVENT,
} from "../RouteCurtain/curtainNav";
import { useLocale } from "../LocaleContext/LocaleContext";
import "./account-section.css";

/* ------------------------------------------------------------------ */
/* AccountSection — the /account entry (NOSTRUM-DESIGN §8 "Accounts").  */
/*                                                                      */
/* Dark brand-side page (accounts belong to the house, not the Shop):   */
/* a single centered olive card over the ink canvas, warm gold bloom,   */
/* poster greeting, and the two doors — sign in / create account —      */
/* with Google as the fast lane. GDPR consent is a hard gate on signup. */
/*                                                                      */
/* Entry mirrors ContactSection: staged is--pre, released on curtain    */
/* reveal. Pure CSS transitions.                                        */
/* ------------------------------------------------------------------ */

type Mode = "signin" | "create" | "forgot";
type Busy = "idle" | "working" | "done";

export default function AccountSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gdpr, setGdpr] = useState(false);

  /* Entry choreography (same beat as ContactSection). */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let entryTimer = 0;
    let doneTimer = 0;
    const beginEntry = () => {
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      root.classList.remove("is--pre");
      void root.offsetWidth;
      root.classList.add("is--enter");
      doneTimer = window.setTimeout(
        () => root.classList.remove("is--enter"),
        2400
      );
    };

    root.classList.add("is--pre");
    if (hasClientNavigated()) {
      window.addEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      entryTimer = window.setTimeout(beginEntry, 3500);
    } else {
      entryTimer = window.setTimeout(beginEntry, 60);
    }
    return () => {
      window.removeEventListener(CURTAIN_REVEAL_EVENT, beginEntry);
      window.clearTimeout(entryTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  /* Email-verification / reset landing (?verified=1|0, ?reset=1). */
  useEffect(() => {
    const v = params.get("verified");
    if (v === "1") setNotice(t("account.verified_ok"));
    else if (v === "0") setError(t("account.verified_bad"));
    if (params.get("reset") === "1") setNotice(t("account.reset_ok"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
    setBusy("idle");
  };

  const onGoogle = () => {
    setError(null);
    void signIn("google", { callbackUrl: `/${locale}/account` });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy === "working") return;
    setError(null);
    setNotice(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setBusy("working");
    try {
      if (mode === "forgot") {
        await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setNotice(t("account.forgot_sent"));
        setBusy("done");
        return;
      }

      if (mode === "create") {
        const name = String(form.get("name") ?? "").trim();
        if (!gdpr) {
          setError(t("account.error_consent"));
          setBusy("idle");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            locale,
            gdprConsent: gdpr,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          const map: Record<string, string> = {
            email_taken: "account.error_email_taken",
            weak_password: "account.error_weak_password",
            consent_required: "account.error_consent",
          };
          setError(t(map[data.error ?? ""] ?? "account.error_generic"));
          setBusy("idle");
          return;
        }
        setNotice(t("account.created_notice"));
        // Fall through: sign the new user straight in.
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(t("account.error_invalid"));
        setBusy("idle");
        return;
      }
      router.refresh(); // server component re-reads the session
    } catch {
      setError(t("account.error_generic"));
      setBusy("idle");
    }
  };

  const working = busy === "working";

  return (
    <section ref={rootRef} className="ac" aria-labelledby="ac-title">
      <div className="ac__card">
        <div className="ac__glow" aria-hidden="true" />
        <div className="ac__grain" aria-hidden="true" />

        <header className="ac__head" data-ac-reveal>
          <p className="ac__eyebrow">{t("account.eyebrow")}</p>
          <h1 id="ac-title" className="ac__headline">
            {mode === "create"
              ? t("account.headline_create")
              : mode === "forgot"
                ? t("account.headline_forgot")
                : t("account.headline_signin")}
          </h1>
          <p className="ac__lede">
            {mode === "forgot" ? t("account.lede_forgot") : t("account.lede")}
          </p>
        </header>

        {/* The two doors */}
        {mode !== "forgot" && (
          <div className="ac__tabs" role="tablist" data-ac-reveal>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={`ac__tab${mode === "signin" ? " is--on" : ""}`}
              onClick={() => switchMode("signin")}
            >
              {t("account.tab_signin")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "create"}
              className={`ac__tab${mode === "create" ? " is--on" : ""}`}
              onClick={() => switchMode("create")}
            >
              {t("account.tab_create")}
            </button>
          </div>
        )}

        {(error || notice) && (
          <p
            className={`ac__flash${error ? " is--error" : ""}`}
            role={error ? "alert" : "status"}
          >
            {error ?? notice}
          </p>
        )}

        <form className="ac__form" onSubmit={onSubmit}>
          {mode === "create" && (
            <div className="ac__field" data-ac-reveal>
              <label htmlFor="ac-name">{t("account.field_name")}</label>
              <input
                id="ac-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="María Serra"
                required
              />
              <span className="ac__field-line" aria-hidden="true" />
            </div>
          )}

          <div className="ac__field" data-ac-reveal>
            <label htmlFor="ac-email">{t("account.field_email")}</label>
            <input
              id="ac-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="maria@example.com"
              required
            />
            <span className="ac__field-line" aria-hidden="true" />
          </div>

          {mode !== "forgot" && (
            <div className="ac__field" data-ac-reveal>
              <label htmlFor="ac-password">{t("account.field_password")}</label>
              <input
                id="ac-password"
                name="password"
                type="password"
                autoComplete={
                  mode === "create" ? "new-password" : "current-password"
                }
                placeholder="••••••••"
                minLength={8}
                required
              />
              <span className="ac__field-line" aria-hidden="true" />
            </div>
          )}

          {mode === "create" && (
            <label className="ac__gdpr" data-ac-reveal>
              <input
                type="checkbox"
                checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
                required
              />
              <span className="ac__gdpr-box" aria-hidden="true" />
              <span className="ac__gdpr-text">
                {t("account.gdpr_label")}{" "}
                <a href={`/${locale}/privacy`}>{t("account.gdpr_link")}</a>
              </span>
            </label>
          )}

          <div className="ac__submit-row" data-ac-reveal>
            <button type="submit" className="ac__submit" disabled={working}>
              <span>
                {working
                  ? t("account.working")
                  : mode === "create"
                    ? t("account.submit_create")
                    : mode === "forgot"
                      ? t("account.submit_forgot")
                      : t("account.submit_signin")}
              </span>
              <span className="ac__submit-arrow" aria-hidden="true">
                →
              </span>
              <span className="ac__submit-line" aria-hidden="true" />
            </button>

            {mode === "signin" && (
              <button
                type="button"
                className="ac__forgot"
                onClick={() => switchMode("forgot")}
              >
                {t("account.forgot")}
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                className="ac__forgot"
                onClick={() => switchMode("signin")}
              >
                {t("account.back_signin")}
              </button>
            )}
          </div>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="ac__or" aria-hidden="true" data-ac-reveal>
              <span />
              <em>{t("account.or")}</em>
              <span />
            </div>

            {/* Google — the fast lane. Must ALWAYS work (§8). */}
            <button
              type="button"
              className="ac__google"
              onClick={onGoogle}
              data-ac-reveal
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.76 0 3.34.6 4.59 1.8l3.43-3.44A11.97 11.97 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.76 12 4.76z"
                />
              </svg>
              <span>{t("account.google")}</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
