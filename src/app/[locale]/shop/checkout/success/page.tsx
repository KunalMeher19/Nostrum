import { Suspense } from "react";
import { notFound } from "next/navigation";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import CheckoutSuccessSection from "@/components/CheckoutSuccess/CheckoutSuccessSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(
    locale as Locale,
    messages,
    "checkout_success",
    "/shop/checkout/success"
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main data-main>
      <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
        <CheckoutSuccessSection />
      </Suspense>
    </main>
  );
}
