"use client";

// MediaLibrary · the shared image picker used by the shop editor and the
// journal author. Opens a grid of every picture the house has, with an
// upload tile as the first cell so new photography can be added without
// leaving the panel. Uploads go to ImageKit through the admin API.
import { useCallback, useEffect, useState } from "react";

/* Pictures that ship with the site. Uploaded ones are appended to this
   list at runtime (and persist through the product/post record). */
export const LIBRARY_IMAGES: string[] = [
  ...[1, 2, 3, 4, 5].map((n) => `/images/${n}.png`),
  ...[1, 2, 3].map((n) => `/images/origin_${n}.png`),
  "/images/stock-grove.jpg",
  "/images/stock-harvest.jpg",
  "/images/stock-olives.jpg",
  "/images/stock-pour.jpg",
  ...Array.from({ length: 14 }, (_, i) => `/products/${i + 1}.webp`),
];

/* Session-scoped memory of everything uploaded, so a picture uploaded in
   the shop editor is immediately offered in the journal too. */
let uploadedCache: string[] = [];

export function useMediaLibrary() {
  const [uploaded, setUploaded] = useState<string[]>(uploadedCache);
  const remember = useCallback((url: string) => {
    if (uploadedCache.includes(url)) return;
    uploadedCache = [url, ...uploadedCache];
    setUploaded(uploadedCache);
  }, []);
  return { uploaded, remember };
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/proxy/admin/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new Error(`upload_${res.status}`);
  const data = (await res.json()) as { url: string };
  return data.url;
}

/* ── The grid ─────────────────────────────────────────────────────── */

export function MediaGrid({
  selected,
  onPick,
  onClear,
  labels,
}: {
  /** Currently chosen image(s) — highlighted in the grid. */
  selected: string[];
  onPick: (url: string) => void;
  /** When given, renders the "no image" cell as the first tile. */
  onClear?: () => void;
  labels: { upload: string; uploading: string; failed: string; none: string };
}) {
  const { uploaded, remember } = useMediaLibrary();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  useEffect(() => {
    if (state !== "error") return;
    const t = setTimeout(() => setState("idle"), 3200);
    return () => clearTimeout(t);
  }, [state]);

  const handleFiles = async (files: FileList) => {
    setState("busy");
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        remember(url);
        onPick(url);
      }
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const all = [...uploaded, ...LIBRARY_IMAGES];

  return (
    <div className="ad__imagepick-grid" role="listbox">
      {/* Upload tile — always first, so it is where the eye lands. */}
      <label
        className={`ad__imagepick-cell ad__imagepick-cell--upload${
          state === "error" ? " is--error" : ""
        }`}
        title={labels.upload}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          disabled={state === "busy"}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="ad__imagepick-upload-mark" aria-hidden="true">
          {state === "busy" ? "…" : state === "error" ? "!" : "+"}
        </span>
        <span className="ad__imagepick-upload-text">
          {state === "busy"
            ? labels.uploading
            : state === "error"
              ? labels.failed
              : labels.upload}
        </span>
      </label>

      {onClear && (
        <button
          type="button"
          className={`ad__imagepick-cell is--none${selected.length === 0 ? " is--on" : ""}`}
          onClick={onClear}
          title={labels.none}
        >
          ×
        </button>
      )}

      {all.map((src) => (
        <button
          key={src}
          type="button"
          className={`ad__imagepick-cell${selected.includes(src) ? " is--on" : ""}`}
          onClick={() => onPick(src)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}
