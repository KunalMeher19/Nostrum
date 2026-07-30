"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "../LocaleContext/LocaleContext";
import "./account-section.css";

/* ------------------------------------------------------------------ */
/* ResetSection — /account/reset?token=... · choose a new password.     */
/* Same card language as AccountSection.                                */
/* ------------------------------------------------------------------ */

export default function ResetSection() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          t(
            data.error === "weak_password"
              ? "account.error_weak_password"
              : "account.verified_bad"
          )
        );
        setBusy(false);
        return;
      }
      router.push(`/${locale}/account?reset=1`);
    } catch {
      setError(t("account.error_generic"));
      setBusy(false);
    }
  };

  return (
    <section className="ac" aria-labelledby="ac-title">
      <div className="ac__card">
        <div className="ac__glow" aria-hidden="true" />
        <div className="ac__grain" aria-hidden="true" />

        <header className="ac__head">
          <p className="ac__eyebrow">{t("account.eyebrow")}</p>
          <h1 id="ac-title" className="ac__headline">
            {t("account.headline_forgot")}
          </h1>
          <p className="ac__lede">{t("account.lede_reset")}</p>
        </header>

        {error && (
          <p className="ac__flash is--error" role="alert">
            {error}
          </p>
        )}

        <form className="ac__form" onSubmit={onSubmit}>
          <div className="ac__field">
            <label htmlFor="ac-new-password">
              {t("account.field_new_password")}
            </label>
            <input
              id="ac-new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              required
            />
            <span className="ac__field-line" aria-hidden="true" />
          </div>

          <div className="ac__submit-row">
            <button type="submit" className="ac__submit" disabled={busy}>
              <span>
                {busy ? t("account.working") : t("account.submit_reset")}
              </span>
              <span className="ac__submit-arrow" aria-hidden="true">
                →
              </span>
              <span className="ac__submit-line" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
