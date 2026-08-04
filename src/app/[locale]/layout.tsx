import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, getMessages, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/components/LocaleContext/LocaleContext";
import HtmlLang from "@/components/HtmlLang/HtmlLang";
import UnderlayNav from "@/components/UnderlayNav/UnderlayNav";
import RouteCurtain from "@/components/RouteCurtain/RouteCurtain";
import NewsletterModal from "@/components/NewsletterModal/NewsletterModal";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return (
    <LocaleProvider locale={locale as Locale} messages={messages}>
      <HtmlLang lang={locale} />
      <UnderlayNav />
      <RouteCurtain />
      {children}
      {/* "The Nostrum Journal" invitation — ~1min after the loader, once
          per session. Renders nothing until it opens. Lives here (not the
          root layout) so it can read the locale context. */}
      <NewsletterModal />
    </LocaleProvider>
  );
}
