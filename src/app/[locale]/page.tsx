import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import CrispHeader from "@/components/CrispHeader/CrispHeader";
import StorySection from "@/components/StoryParallax/StoryParallax";
import ProductsSection from "@/components/ProductsSection/ProductsSection";
import SiteFooter from "@/components/SiteFooter/SiteFooter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "home", "/");
}

export default function Home() {
  return (
    <main data-main>
      <CrispHeader />
      <StorySection />
      <ProductsSection />
      <SiteFooter />
    </main>
  );
}
