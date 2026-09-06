"use client";

import { useState } from "react";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  PRODUCT_LOCALES,
  type ProductCopy,
  type ProductDetailRow,
  type ProductLocale,
} from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Product page copy · description + details, in every language.        */
/*                                                                      */
/* One panel, one language at a time. English is the base copy: it owns  */
/* the DETAILS row list and is what the public product page falls back   */
/* to whenever a locale is left blank. The other four locales reuse      */
/* those same rows by id, so a translator never rebuilds the structure,  */
/* only the wording. Every English string appears as the placeholder of  */
/* its translated field, which doubles as the reference text and makes   */
/* an empty field read as "inherits this" rather than "is broken".       */
/* ------------------------------------------------------------------ */

export const emptyCopy = (): ProductCopy => ({ description: "", details: [] });

export const emptyTranslations = (): Record<ProductLocale, ProductCopy> =>
  Object.fromEntries(PRODUCT_LOCALES.map((l) => [l, emptyCopy()])) as Record<
    ProductLocale,
    ProductCopy
  >;

/* Stable, opaque row identity. Deliberately NOT derived from the label:
   renaming "Variety" must not orphan the translations attached to that row. */
let detailRowSeq = 0;
export const newDetailRowId = () =>
  `d${Date.now().toString(36)}${(detailRowSeq++).toString(36)}`;

const COPY_LOCALES = ["en", ...PRODUCT_LOCALES] as const;
type CopyLocale = (typeof COPY_LOCALES)[number];

const LOCALE_NAMES: Record<CopyLocale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
  it: "Italiano",
  el: "Ελληνικά",
};

/* Empty · nothing typed. Partial · some of it. Complete · a description plus
   a value for every base row. Drives the dot on each language pill so the
   admin sees what is still missing without opening all five tabs. */
function copyStatus(
  copy: ProductCopy,
  baseRows: ProductDetailRow[]
): "empty" | "partial" | "complete" {
  const hasDesc = Boolean(copy.description.trim());
  const filled = baseRows.filter((r) =>
    copy.details.find((d) => d.id === r.id && d.value.trim())
  ).length;
  if (!hasDesc && filled === 0) return "empty";
  if (hasDesc && filled === baseRows.length) return "complete";
  return "partial";
}

export default function ProductCopyEditor({
  uid,
  base,
  translations,
  onBaseChange,
  onTranslationChange,
}: {
  uid: string;
  base: ProductCopy;
  translations: Record<ProductLocale, ProductCopy>;
  onBaseChange: (copy: ProductCopy) => void;
  onTranslationChange: (locale: ProductLocale, copy: ProductCopy) => void;
}) {
  const { t } = useLocale();
  const [lang, setLang] = useState<CopyLocale>("en");

  const isBase = lang === "en";
  const active: ProductCopy = isBase ? base : translations[lang as ProductLocale];
  const emit = (copy: ProductCopy) =>
    isBase ? onBaseChange(copy) : onTranslationChange(lang as ProductLocale, copy);

  /* Rows shown in the current panel. The base owns the list; a translation is
     projected onto it, so a row added in English appears immediately in every
     other language, blank and ready to translate. */
  const rows: ProductDetailRow[] = isBase
    ? base.details
    : base.details.map(
        (r) =>
          active.details.find((d) => d.id === r.id) ?? {
            id: r.id,
            label: "",
            value: "",
          }
      );

  const setRow = (id: string, key: "label" | "value", val: string) =>
    emit({
      ...active,
      details: rows.map((r) => (r.id === id ? { ...r, [key]: val } : r)),
    });

  const addRow = () =>
    onBaseChange({
      ...base,
      details: [...base.details, { id: newDetailRowId(), label: "", value: "" }],
    });

  /* Removing in English removes the row everywhere: translations are keyed by
     id, so orphans stop being projected and the backend drops them on save. */
  const removeRow = (id: string) =>
    onBaseChange({ ...base, details: base.details.filter((r) => r.id !== id) });

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= base.details.length) return;
    const next = [...base.details];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onBaseChange({ ...base, details: next });
  };

  /* Seed a translation from English so the translator edits real sentences
     instead of facing empty boxes. */
  const copyFromBase = () =>
    onTranslationChange(lang as ProductLocale, {
      description: base.description,
      details: base.details.map((r) => ({ ...r })),
    });

  return (
    <section className="ad__copy" aria-label={t("admin.copy_title")}>
      <div className="ad__copy-head">
        <h3 className="ad__mini-title">{t("admin.copy_title")}</h3>
        <p className="ad__hint">{t("admin.copy_note")}</p>
      </div>

      {/* Language rail */}
      <div className="ad__copy-langs" role="tablist" aria-label={t("admin.copy_title")}>
        {COPY_LOCALES.map((l) => {
          const status =
            l === "en"
              ? copyStatus(base, base.details)
              : copyStatus(translations[l as ProductLocale], base.details);
          return (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              className={`ad__copy-lang${lang === l ? " is--active" : ""}`}
              onClick={() => setLang(l)}
            >
              <span className={`ad__copy-dot is--${status}`} aria-hidden="true" />
              <span className="ad__copy-lang-code">{l.toUpperCase()}</span>
              <span className="ad__copy-lang-name">
                {l === "en" ? t("admin.copy_base_tag") : LOCALE_NAMES[l]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="ad__copy-panel" role="tabpanel" key={lang}>
        <div className="ad__copy-panel-head">
          <p className="ad__copy-panel-title">{LOCALE_NAMES[lang]}</p>
          {!isBase && (
            <button type="button" className="ad__chip" onClick={copyFromBase}>
              {t("admin.copy_from_base")}
            </button>
          )}
        </div>

        {/* Description */}
        <div className="ad__field is--grow">
          <label htmlFor={`ad-desc-${lang}-${uid}`}>
            {t("admin.product_description")}
          </label>
          <textarea
            id={`ad-desc-${lang}-${uid}`}
            rows={4}
            maxLength={2000}
            value={active.description}
            placeholder={isBase ? undefined : base.description || undefined}
            onChange={(e) => emit({ ...active, description: e.target.value })}
          />
          <p className="ad__hint">
            {isBase ? t("admin.copy_desc_hint") : t("admin.copy_inherit_hint")}
          </p>
        </div>

        {/* Details rows */}
        <h4 className="ad__copy-sub">{t("admin.copy_details_title")}</h4>
        <p className="ad__hint">
          {isBase ? t("admin.copy_details_hint") : t("admin.copy_locked_hint")}
        </p>

        {base.details.length === 0 ? (
          <p className="ad__copy-empty">
            {isBase ? t("admin.copy_no_rows") : t("admin.copy_no_rows_locked")}
          </p>
        ) : (
          <div className="ad__rows is--copy">
            <div className="ad__row is--head">
              <span>{t("admin.copy_key")}</span>
              <span>{t("admin.copy_value")}</span>
              <span />
            </div>
            {rows.map((row, i) => {
              const baseRow = base.details[i];
              return (
                <div className="ad__row" key={row.id}>
                  <input
                    aria-label={t("admin.copy_key")}
                    type="text"
                    maxLength={60}
                    value={row.label}
                    placeholder={
                      isBase ? t("admin.copy_key_ph") : baseRow?.label || undefined
                    }
                    onChange={(e) => setRow(row.id, "label", e.target.value)}
                  />
                  <input
                    aria-label={t("admin.copy_value")}
                    type="text"
                    maxLength={200}
                    value={row.value}
                    placeholder={
                      isBase ? t("admin.copy_value_ph") : baseRow?.value || undefined
                    }
                    onChange={(e) => setRow(row.id, "value", e.target.value)}
                  />
                  {isBase ? (
                    <span className="ad__copy-rowtools">
                      <button
                        type="button"
                        className="ad__copy-move"
                        aria-label={t("admin.copy_move_up")}
                        disabled={i === 0}
                        onClick={() => moveRow(i, i - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ad__copy-move"
                        aria-label={t("admin.copy_move_down")}
                        disabled={i === base.details.length - 1}
                        onClick={() => moveRow(i, i + 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="ad__row-x"
                        aria-label={t("admin.remove")}
                        onClick={() => removeRow(row.id)}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isBase && (
          <button type="button" className="ad__add" onClick={addRow}>
            + {t("admin.copy_add_row")}
          </button>
        )}
      </div>
    </section>
  );
}
