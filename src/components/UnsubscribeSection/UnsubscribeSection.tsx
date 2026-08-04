"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "../LocaleContext/LocaleContext";
import { unsubscribeNewsletter } from "@/lib/api";
import "./unsubscribe.css";

/* ------------------------------------------------------------------ */
/* UnsubscribeSection — /[locale]/unsubscribe?token=...                 */
/*                                                                      */
/* The quiet exit from the Journal. Same material language as the       */
/* Account card: olive gradient panel on the ink canvas, gold bloom,    */
/* grain, hairline border. Confirmation is an explicit click (never on  */
/* page load) so inbox link-scanners cannot unsubscribe people.         */
/* States: confirm → done · missing token → invalid note.               */
/* ------------------------------------------------------------------ */

type Phase = "confirm" | "working" | "done" | "error";

export default function UnsubscribeSection() {
  const { t } = useLocale();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [phase, setPhase] = useState<Phase>("confirm");

  const confirm = async () => {
    if (phase === "working" || phase === "done") return;
    setPhase("working");
    try {
      await unsubscribeNewsletter(token);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  };

  return (
    <section className="un" aria-labelledby="un-title">
      <div className="un__card">
        <span className="un__glow" aria-hidden="true" />
        <span className="un__grain" aria-hidden="true" />

        <p className="un__eyebrow">{t("unsubscribe.eyebrow")}</p>

        {!token ? (
          <>
            <h1 id="un-title" className="un__title">
              {t("unsubscribe.invalid_title")}
            </h1>
            <p className="un__line">{t("unsubscribe.invalid_line")}</p>
          </>
        ) : phase === "done" ? (
          <>
            <h1 id="un-title" className="un__title">
              {t("unsubscribe.done_title")}
            </h1>
            <p className="un__line">{t("unsubscribe.done_line")}</p>
          </>
        ) : (
          <>
            <h1 id="un-title" className="un__title">
              {t("unsubscribe.title")}
            </h1>
            <p className="un__line">{t("unsubscribe.lede")}</p>
            <button
              type="button"
              className="un__cta"
              onClick={confirm}
              disabled={phase === "working"}
            >
              {phase === "working"
                ? t("unsubscribe.working")
                : t("unsubscribe.confirm")}
            </button>
            {phase === "error" && (
              <p className="un__error" role="alert">
                {t("unsubscribe.error")}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
