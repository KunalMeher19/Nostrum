// /[locale]/journal · the Journal: a digital museum you walk through,
// then the stories. Content comes from the Express API at request time
// (published posts + exhibits, authored in the admin portal); the page
// renders fine with empty sections if the API is unreachable.
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import JournalSection from "@/components/JournalSection/JournalSection";
import { API_URL, type JournalPost, type MuseumExhibit } from "@/lib/api";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "journal", "/journal");
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function JournalPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const [{ posts }, { exhibits }] = await Promise.all([
    fetchJson<{ posts: JournalPost[] }>("/api/journal/posts", { posts: [] }),
    fetchJson<{ exhibits: MuseumExhibit[] }>("/api/journal/museum", {
      exhibits: [],
    }),
  ]);

  return (
    <main data-main className="journal">
      <JournalSection posts={posts} exhibits={exhibits} />
    </main>
  );
}
