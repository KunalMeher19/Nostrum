import { notFound } from "next/navigation";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import TrackOrderSection from "@/components/TrackOrderSection/TrackOrderSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "track", "/track");
}

export default function TrackPage() {
  return (
    <main data-main>
      <TrackOrderSection />
    </main>
  );
}
