import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, getMessages, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/components/LocaleContext/LocaleContext";
import HtmlLang from "@/components/HtmlLang/HtmlLang";
import UnderlayNav from "@/components/UnderlayNav/UnderlayNav";
import RouteCurtain from "@/components/RouteCurtain/RouteCurtain";
import NewsletterModal from "@/components/NewsletterModal/NewsletterModal";
import CartDrawer from "@/components/Cart/CartDrawer";
import LegalModal from "@/components/LegalModal/LegalModal";
import LocaleSessionGuard from "@/components/LocaleSessionGuard/LocaleSessionGuard";
import CookieBanner from "@/components/CookieBanner/CookieBanner";

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
      <LocaleSessionGuard />
      <HtmlLang lang={locale} />
      <UnderlayNav />
      <RouteCurtain />
      {/* Slide-in cart (site chrome, dark like the menu takeover). Lives
          here, not the root layout, so it can read the locale context.
          Opens from the nav cart icon and automatically on add-to-cart. */}
      <CartDrawer />
      {children}
      <CookieBanner />
      {/* "The Nostrum Journal" invitation — ~1min after the loader, once
          per session. Renders nothing until it opens. Lives here (not the
          root layout) so it can read the locale context. */}
      <NewsletterModal />
      {/* Legal document modal — premium viewer for Privacy Policy, Cookie
          Policy, Terms of Sale, Legal Notice. Opens via showLegalModal()
          exported from LegalModal component. */}
      <LegalModal />
    </LocaleProvider>
  );
}
