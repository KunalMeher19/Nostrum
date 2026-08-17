// /[locale]/origins · the Origins page. The process ("How it is made")
// step images come from the Express API at request time (curated in the
// admin portal's Content tab); the page renders with the built-in
// placeholders if the API is unreachable.
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, t, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import StoryScenes from "@/components/StoryScenes/StoryScenes";
import StoryProcess from "@/components/StoryProcess/StoryProcess";
import OriginMap from "@/components/OriginMap/OriginMap";
import OriginThread from "@/components/OriginThread/OriginThread";
import OriginMuseum from "@/components/OriginMuseum/OriginMuseum";
import {
  API_URL,
  type ProcessImagesContent,
  type SiteContentResponse,
  type MuseumExhibit,
} from "@/lib/api";
import "@/app/origins/origins.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "origins", "/origins");
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

export default async function OriginsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  const { value: processImages } = await fetchJson<
    SiteContentResponse<ProcessImagesContent>
  >("/api/content/process-images", { key: "process-images", value: null });

  const { exhibits } = await fetchJson<{ exhibits: MuseumExhibit[] }>(
    "/api/journal/museum",
    { exhibits: [] }
  );

  return (
    <main data-main className="origins">
      <OriginThread />
      <div data-origin-chapter="The story">
        <StoryScenes />
      </div>
      <div data-origin-chapter="The craft">
        <StoryProcess stepImages={processImages?.steps} />
      </div>
      {/* <OriginMuseum exhibits={exhibits} /> */}
      <div data-origin-chapter="The place">
        <OriginMap />
      </div>
      <section className="origins__outro" aria-label="Continue to the shop">
        <Link href={`/${locale}/products`} className="origins__cta">
          <span>{t(messages, "origins.cta")}</span>
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
            <path d="M1 13 13 1M4 1h9v9" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
