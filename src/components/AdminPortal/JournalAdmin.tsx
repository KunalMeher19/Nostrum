"use client";

// JournalAdmin · the Journal tab of the admin portal: write and
// publish stories (the blog) and curate the museum's exhibits.
// Images are chosen from the placeholder library in /public until a
// real media pipeline lands with the final shop stack.
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale } from "../LocaleContext/LocaleContext";
import {
  api,
  MUSEUM_ROOMS,
  type AdminExhibit,
  type AdminPost,
  type MuseumRoom,
} from "@/lib/api";
import { MediaGrid } from "./MediaLibrary";

export default function JournalAdmin() {
  const { t } = useLocale();
  const [mode, setMode] = useState<"posts" | "museum">("posts");

  return (
    <div className="ad__view">
      <div className="ad__filters" role="group" aria-label={t("admin.journal_mode")}>
        {(["posts", "museum"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`ad__chip${mode === m ? " is--on" : ""}`}
            onClick={() => setMode(m)}
          >
            {t(`admin.journal_${m}`)}
          </button>
        ))}
      </div>
      {mode === "posts" ? <PostsAdmin /> : <MuseumAdmin />}
    </div>
  );
}

/* ── Image picker (shared) ─────────────────────────────────────────── */

function ImagePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  idBase?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="ad__imagepick">
      <button
        type="button"
        className="ad__imagepick-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? (
          <span className="ad__imagepick-thumb">
            <Image src={value} alt="" fill sizes="72px" />
          </span>
        ) : (
          <span className="ad__imagepick-none">{t("admin.no_image")}</span>
        )}
        <span>{t("admin.choose_image")}</span>
      </button>
      {open && (
        <MediaGrid
          selected={value ? [value] : []}
          onPick={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClear={() => {
            onChange(null);
            setOpen(false);
          }}
          labels={{
            upload: t("admin.upload_image"),
            uploading: t("account.working"),
            failed: t("account.error_generic"),
            none: t("admin.no_image"),
          }}
        />
      )}
    </div>
  );
}

/* ── Posts (blog authoring) ────────────────────────────────────────── */

const EMPTY_POST = {
  title: "",
  excerpt: "",
  body: "",
  coverImage: null as string | null,
};

function PostsAdmin() {
  const { t, locale } = useLocale();
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | "new" | null>(null);

  const load = () =>
    api<{ posts: AdminPost[] }>("/api/admin/posts")
      .then((d) => setPosts(d.posts))
      .catch(() => setFailed(true));

  useEffect(() => {
    void load();
  }, []);

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "·";

  return (
    <div className="ad__journal">
      <div className="ad__view-bar">
        <p className="ad__quiet">
          {posts ? `${posts.length} ${t("admin.posts_count")}` : ""}
        </p>
        <button
          type="button"
          className="ad__add"
          onClick={() => setOpen((o) => (o === "new" ? null : "new"))}
        >
          + {t("admin.new_post")}
        </button>
      </div>

      {open === "new" && (
        <PostEditor
          onDone={(saved) => {
            setOpen(saved ? null : "new");
            if (saved) void load();
          }}
        />
      )}

      {posts === null && !failed && <p className="ad__quiet">{t("portal.loading")}</p>}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}
      {posts !== null && posts.length === 0 && (
        <p className="ad__quiet">{t("admin.posts_none")}</p>
      )}

      <ul className="ad__list">
        {(posts ?? []).map((p) => (
          <li key={p.id} className={`ad__order${open === p.id ? " is--open" : ""}`}>
            <button
              type="button"
              className="ad__order-row"
              aria-expanded={open === p.id}
              onClick={() => setOpen((o) => (o === p.id ? null : p.id))}
            >
              <span className="ad__order-number">{p.title}</span>
              <span className="ad__order-date">{dateFmt(p.publishedAt ?? p.createdAt)}</span>
              <span
                className={`ad__status ad__status--${
                  p.status === "published" ? "delivered" : "placed"
                }`}
              >
                {t(`admin.post_${p.status}`)}
              </span>
            </button>
            {open === p.id && (
              <PostEditor
                post={p}
                onDone={(saved) => {
                  setOpen(null);
                  if (saved) void load();
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostEditor({
  post,
  onDone,
}: {
  post?: AdminPost;
  onDone: (saved: boolean) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(() =>
    post
      ? {
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          coverImage: post.coverImage,
        }
      : EMPTY_POST
  );
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const save = async (status?: "draft" | "published") => {
    if (state === "saving" || !draft.title.trim()) return;
    setState("saving");
    try {
      const payload = { ...draft, ...(status ? { status } : {}) };
      if (post) {
        await api(`/api/admin/posts/${post.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onDone(true);
    } catch {
      setState("error");
    }
  };

  const remove = async () => {
    if (!post || state === "saving") return;
    if (!window.confirm(t("admin.delete_confirm"))) return;
    setState("saving");
    try {
      await api(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      onDone(true);
    } catch {
      setState("error");
    }
  };

  const published = post?.status === "published";

  return (
    <div className="ad__order-detail ad__editor">
      <div className="ad__field is--grow">
        <label htmlFor={`ad-post-title-${post?.id ?? "new"}`}>
          {t("admin.post_title")}
        </label>
        <input
          id={`ad-post-title-${post?.id ?? "new"}`}
          type="text"
          value={draft.title}
          maxLength={160}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </div>

      <div className="ad__field is--grow">
        <label htmlFor={`ad-post-excerpt-${post?.id ?? "new"}`}>
          {t("admin.post_excerpt")}
        </label>
        <input
          id={`ad-post-excerpt-${post?.id ?? "new"}`}
          type="text"
          value={draft.excerpt}
          maxLength={300}
          onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
        />
      </div>

      <div className="ad__field is--grow">
        <label htmlFor={`ad-post-body-${post?.id ?? "new"}`}>
          {t("admin.post_body")}
        </label>
        <textarea
          id={`ad-post-body-${post?.id ?? "new"}`}
          rows={10}
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        />
        <p className="ad__hint">{t("admin.post_body_hint")}</p>
      </div>

      <ImagePicker
        value={draft.coverImage}
        onChange={(coverImage) => setDraft((d) => ({ ...d, coverImage }))}
        idBase={`post-${post?.id ?? "new"}`}
      />

      <div className="ad__save-row">
        <button
          type="button"
          className="ad__save"
          disabled={state === "saving" || !draft.title.trim()}
          onClick={() => void save(published ? undefined : "draft")}
        >
          <span>
            {state === "saving" ? t("account.working") : t("admin.save_draft")}
          </span>
          <span className="ad__save-line" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ad__save is--primary"
          disabled={state === "saving" || !draft.title.trim()}
          onClick={() => void save("published")}
        >
          <span>{published ? t("portal.save") : t("admin.publish")}</span>
          <span className="ad__save-line" aria-hidden="true" />
        </button>
        {post && published && (
          <button
            type="button"
            className="ad__chip"
            disabled={state === "saving"}
            onClick={() => void save("draft")}
          >
            {t("admin.unpublish")}
          </button>
        )}
        {post && (
          <button
            type="button"
            className="ad__chip is--danger"
            disabled={state === "saving"}
            onClick={() => void remove()}
          >
            {t("admin.delete")}
          </button>
        )}
        {state === "error" && (
          <p className="ad__saved is--error" role="alert">
            {t("account.error_generic")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Museum curation ───────────────────────────────────────────────── */

function MuseumAdmin() {
  const { t } = useLocale();
  const [exhibits, setExhibits] = useState<AdminExhibit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | "new" | null>(null);

  const load = () =>
    api<{ exhibits: AdminExhibit[] }>("/api/admin/exhibits")
      .then((d) => setExhibits(d.exhibits))
      .catch(() => setFailed(true));

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="ad__journal">
      <p className="ad__note">{t("admin.museum_note")}</p>
      <div className="ad__view-bar">
        <p className="ad__quiet">
          {exhibits ? `${exhibits.length} ${t("admin.exhibits_count")}` : ""}
        </p>
        <button
          type="button"
          className="ad__add"
          onClick={() => setOpen((o) => (o === "new" ? null : "new"))}
        >
          + {t("admin.new_exhibit")}
        </button>
      </div>

      {open === "new" && (
        <ExhibitEditor
          onDone={(saved) => {
            setOpen(saved ? null : "new");
            if (saved) void load();
          }}
        />
      )}

      {exhibits === null && !failed && <p className="ad__quiet">{t("portal.loading")}</p>}
      {failed && <p className="ad__quiet">{t("portal.error_load")}</p>}

      <ul className="ad__list">
        {(exhibits ?? []).map((ex) => (
          <li key={ex.id} className={`ad__order${open === ex.id ? " is--open" : ""}`}>
            <button
              type="button"
              className="ad__order-row"
              aria-expanded={open === ex.id}
              onClick={() => setOpen((o) => (o === ex.id ? null : ex.id))}
            >
              <span className="ad__exhibit-thumb">
                <Image src={ex.image} alt="" fill sizes="64px" />
              </span>
              <span className="ad__order-number">{ex.title}</span>
              <span className="ad__order-date">
                {t(`journal.room_${ex.room}`)} · {ex.order}
              </span>
              <span
                className={`ad__status ad__status--${ex.published ? "delivered" : "placed"}`}
              >
                {ex.published ? t("admin.shown") : t("admin.hidden")}
              </span>
            </button>
            {open === ex.id && (
              <ExhibitEditor
                exhibit={ex}
                onDone={(saved) => {
                  setOpen(null);
                  if (saved) void load();
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExhibitEditor({
  exhibit,
  onDone,
}: {
  exhibit?: AdminExhibit;
  onDone: (saved: boolean) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(() =>
    exhibit
      ? {
          title: exhibit.title,
          caption: exhibit.caption,
          image: exhibit.image as string | null,
          room: exhibit.room,
          order: exhibit.order,
          published: exhibit.published,
        }
      : {
          title: "",
          caption: "",
          image: null as string | null,
          room: "grove" as MuseumRoom,
          order: 0,
          published: true,
        }
  );
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const valid = draft.title.trim() && draft.image;

  const save = async () => {
    if (state === "saving" || !valid) return;
    setState("saving");
    try {
      if (exhibit) {
        await api(`/api/admin/exhibits/${exhibit.id}`, {
          method: "PATCH",
          body: JSON.stringify(draft),
        });
      } else {
        await api("/api/admin/exhibits", {
          method: "POST",
          body: JSON.stringify(draft),
        });
      }
      onDone(true);
    } catch {
      setState("error");
    }
  };

  const remove = async () => {
    if (!exhibit || state === "saving") return;
    if (!window.confirm(t("admin.delete_confirm"))) return;
    setState("saving");
    try {
      await api(`/api/admin/exhibits/${exhibit.id}`, { method: "DELETE" });
      onDone(true);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="ad__order-detail ad__editor">
      <div className="ad__field is--grow">
        <label htmlFor={`ad-ex-title-${exhibit?.id ?? "new"}`}>
          {t("admin.exhibit_title")}
        </label>
        <input
          id={`ad-ex-title-${exhibit?.id ?? "new"}`}
          type="text"
          value={draft.title}
          maxLength={120}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </div>

      <div className="ad__field is--grow">
        <label htmlFor={`ad-ex-caption-${exhibit?.id ?? "new"}`}>
          {t("admin.exhibit_caption")}
        </label>
        <textarea
          id={`ad-ex-caption-${exhibit?.id ?? "new"}`}
          rows={3}
          maxLength={500}
          value={draft.caption}
          onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
        />
      </div>

      <div className="ad__track-fields">
        <div className="ad__field">
          <label htmlFor={`ad-ex-room-${exhibit?.id ?? "new"}`}>
            {t("admin.exhibit_room")}
          </label>
          <select
            id={`ad-ex-room-${exhibit?.id ?? "new"}`}
            value={draft.room}
            onChange={(e) =>
              setDraft((d) => ({ ...d, room: e.target.value as MuseumRoom }))
            }
          >
            {MUSEUM_ROOMS.map((r) => (
              <option key={r} value={r}>
                {t(`journal.room_${r}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="ad__field">
          <label htmlFor={`ad-ex-order-${exhibit?.id ?? "new"}`}>
            {t("admin.exhibit_order")}
          </label>
          <input
            id={`ad-ex-order-${exhibit?.id ?? "new"}`}
            type="number"
            min={0}
            value={draft.order}
            onChange={(e) =>
              setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))
            }
          />
        </div>
        <label className="ad__switch">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) =>
              setDraft((d) => ({ ...d, published: e.target.checked }))
            }
          />
          <span className="ad__switch-track" aria-hidden="true" />
          <span className="ad__switch-label">
            {draft.published ? t("admin.shown") : t("admin.hidden")}
          </span>
        </label>
      </div>

      <ImagePicker
        value={draft.image}
        onChange={(image) => setDraft((d) => ({ ...d, image }))}
        idBase={`ex-${exhibit?.id ?? "new"}`}
      />

      <div className="ad__save-row">
        <button
          type="button"
          className="ad__save"
          disabled={state === "saving" || !valid}
          onClick={() => void save()}
        >
          <span>{state === "saving" ? t("account.working") : t("portal.save")}</span>
          <span className="ad__save-line" aria-hidden="true" />
        </button>
        {exhibit && (
          <button
            type="button"
            className="ad__chip is--danger"
            disabled={state === "saving"}
            onClick={() => void remove()}
          >
            {t("admin.delete")}
          </button>
        )}
        {state === "error" && (
          <p className="ad__saved is--error" role="alert">
            {t("account.error_generic")}
          </p>
        )}
      </div>
    </div>
  );
}
