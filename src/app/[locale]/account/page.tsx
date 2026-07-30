import { notFound } from "next/navigation";
import { Suspense } from "react";
import { generateLocalizedMetadata } from "@/lib/metadata";
import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import AccountSection from "@/components/AccountSection/AccountSection";
import SignedInCard from "@/components/AccountSection/SignedInCard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);
  return generateLocalizedMetadata(locale as Locale, messages, "account", "/account");
}

export default async function AccountPage() {
  const session = await auth();

  return (
    <main data-main className="account-page">
      {session?.user ? (
        <SignedInCard
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          role={session.user.role}
        />
      ) : (
        <Suspense>
          <AccountSection />
        </Suspense>
      )}
    </main>
  );
}
