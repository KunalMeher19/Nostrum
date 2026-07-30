import { notFound } from "next/navigation";
import { Suspense } from "react";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import ResetSection from "@/components/AccountSection/ResetSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "account", "/account/reset");
}

export default function ResetPage() {
  return (
    <main data-main className="account-page">
      <Suspense>
        <ResetSection />
      </Suspense>
    </main>
  );
}
