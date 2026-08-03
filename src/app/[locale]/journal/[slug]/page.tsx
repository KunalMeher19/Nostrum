// /[locale]/journal/[slug] · a single journal story, dark editorial.
import { getMessages, isValidLocale, t, type Locale } from "@/lib/i18n";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";
import JournalPostPage from "@/components/JournalSection/JournalPostPage";
import { API_URL, type JournalPost } from "@/lib/api";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function fetchPost(slug: string): Promise<JournalPost | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/journal/posts/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { post: JournalPost };
    return data.post;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  const base = generateLocalizedMetadata(
    locale as Locale,
    messages,
    "journal",
    `/journal/${slug}`
  );
  const post = await fetchPost(slug);
  if (!post) return base;
  return {
    ...base,
    title: `${post.title} · ${t(messages, "nav.journal")} · Nostrum`,
    description: post.excerpt || base.description,
  };
}

export default async function PostRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const post = await fetchPost(slug);
  if (!post) notFound();

  return (
    <main data-main className="journal journal--post">
      <JournalPostPage post={post} />
    </main>
  );
}
