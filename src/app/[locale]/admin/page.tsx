import { notFound, redirect } from "next/navigation";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import AdminPortal from "@/components/AdminPortal/AdminPortal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "admin", "/admin");
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  // Role gate: signed-out → account entry; non-admin → their portal.
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/account`);
  if (session.user.role !== "admin") redirect(`/${locale}/account`);

  return (
    <main data-main className="admin-page">
      <AdminPortal name={session.user.name ?? null} />
    </main>
  );
}
