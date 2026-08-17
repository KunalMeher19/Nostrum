import { notFound } from "next/navigation";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import CheckoutCancelSection from "@/components/CheckoutCancel/CheckoutCancelSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(
    locale as Locale,
    messages,
    "checkout_cancel",
    "/shop/checkout/cancel"
  );
}

export default function CheckoutCancelPage() {
  return (
    <main data-main>
      <CheckoutCancelSection />
    </main>
  );
}
