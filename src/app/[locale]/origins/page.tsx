import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, t, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import StoryScenes from "@/components/StoryScenes/StoryScenes";
import StoryProcess from "@/components/StoryProcess/StoryProcess";
import OriginMap from "@/components/OriginMap/OriginMap";
import OriginThread from "@/components/OriginThread/OriginThread";
import "@/app/origins/origins.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "origins", "/origins");
}

export default async function OriginsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return (
    <main data-main className="origins">
      <OriginThread />
      <div data-origin-chapter="The story">
        <StoryScenes />
      </div>
      <div data-origin-chapter="The craft">
        <StoryProcess />
      </div>
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
