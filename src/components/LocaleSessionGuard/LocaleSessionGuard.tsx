"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n";

const SESSION_KEY = "nostrum_locale_session_started";

export default function LocaleSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;

    sessionStorage.setItem(SESSION_KEY, "true");
    const firstSegment = pathname.split("/")[1];
    if (isValidLocale(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
      router.replace(`/${DEFAULT_LOCALE}`);
    }
  }, [pathname, router]);

  return null;
}