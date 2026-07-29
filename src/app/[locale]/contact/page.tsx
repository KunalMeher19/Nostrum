import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import ContactSection from "@/components/ContactSection/ContactSection";
import "@/app/contact/contact.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "contact", "/contact");
}

export default function ContactPage() {
  return (
    <main data-main className="contact-page">
      <ContactSection />
    </main>
  );
}
