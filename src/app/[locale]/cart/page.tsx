import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import CartPage from "@/app/cart/page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "cart", "/cart");
}

export default CartPage;
