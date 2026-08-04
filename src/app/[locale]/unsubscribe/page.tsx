import { notFound } from "next/navigation";
import { Suspense } from "react";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import UnsubscribeSection from "@/components/UnsubscribeSection/UnsubscribeSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(
    locale as Locale,
    messages,
    "unsubscribe",
    "/unsubscribe"
  );
}

export default function UnsubscribePage() {
  return (
    <main data-main>
      {/* Suspense: UnsubscribeSection reads useSearchParams (the token). */}
      <Suspense>
        <UnsubscribeSection />
      </Suspense>
    </main>
  );
}
