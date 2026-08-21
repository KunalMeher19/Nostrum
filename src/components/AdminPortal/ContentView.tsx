"use client";

// ContentView · the Content tab of the admin portal: curate the five
// process images of the "How it is made" section on /origins without
// touching code. Same picker + upload UX as the Shop and Journal tabs.
import { useEffect, useState } from "react";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  api,
  type ProcessImagesContent,
  type SiteContentResponse,
} from "@/lib/api";
import { ImagePicker } from "./JournalAdmin";
import AdminSkeleton from "./AdminSkeletons";

const STEP_COUNT = 5;

type Slot = { url: string; alt: string };
type Draft = Slot[];

const emptyDraft = (): Draft =>
  Array.from({ length: STEP_COUNT }, () => ({ url: "", alt: "" }));

export default function ContentView() {
  const { t } = useLocale();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    api<SiteContentResponse<ProcessImagesContent>>(
      "/api/admin/content/process-images"
    )
      .then((d) => {
        const base = emptyDraft();
        d.value?.steps?.forEach((s, i) => {
          if (i < STEP_COUNT) {
            base[i] = { url: s.url ?? "", alt: s.alt ?? "" };
          }
        });
        setDraft(base);
      })
      .catch(() => setFailed(true));
  }, []);

  const setSlot = (i: number, patch: Partial<Slot>) =>
    setDraft((d) => d?.map((s, j) => (j === i ? { ...s, ...patch } : s)) ?? null);

  const save = async () => {
    if (!draft || state === "saving") return;
    setState("saving");
    try {
      const steps = draft.map((s) => ({ url: s.url.trim(), alt: s.alt.trim() }));
      await api("/api/admin/content/process-images", {
        method: "PUT",
        body: JSON.stringify({ steps }),
      });
      setState("saved");
      setTimeout(() => setState("idle"), 2800);
    } catch {
      setState("error");
    }
  };

  if (failed) {
    return (
      <div className="ad__view">
        <p className="ad__quiet">{t("portal.error_load")}</p>
      </div>
    );
  }
  if (!draft) {
    return (
      <div className="ad__view">
        <AdminSkeleton variant="content" />
      </div>
    );
  }

  return (
    <div className="ad__view">
      <p className="ad__note">{t("admin.content_note")}</p>

      <div className="ad__order-detail ad__editor">
        {draft.map((slot, i) => (
          <section key={i}>
            <h3 className="ad__mini-title">
              {t("process.step")} 0{i + 1} · {t(`process.step${i + 1}_title`)}
            </h3>
            <ImagePicker
              value={slot.url || null}
              onChange={(url) => setSlot(i, { url: url ?? "" })}
              idBase={`content-${i}`}
            />
            <div className="ad__field is--grow">
              <label htmlFor={`ad-content-alt-${i}`}>
                {t("admin.content_alt_label")}
              </label>
              <input
                id={`ad-content-alt-${i}`}
                type="text"
                value={slot.alt}
                maxLength={160}
                placeholder={t("admin.content_alt_hint")}
                onChange={(e) => setSlot(i, { alt: e.target.value })}
              />
            </div>
          </section>
        ))}

        <div className="ad__save-row">
          <button
            type="button"
            className="ad__save is--primary"
            disabled={state === "saving"}
            onClick={() => void save()}
          >
            <span>
              {state === "saving" ? t("account.working") : t("portal.save")}
            </span>
            <span className="ad__save-line" aria-hidden="true" />
          </button>
          {state === "saved" && (
            <p className="ad__saved" role="status">
              {t("portal.saved")}
            </p>
          )}
          {state === "error" && (
            <p className="ad__saved is--error" role="alert">
              {t("account.error_generic")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
