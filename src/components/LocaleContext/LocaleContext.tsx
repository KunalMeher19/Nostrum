"use client";

import { createContext, useContext, useCallback } from "react";
import type { Locale } from "@/lib/i18n";
import { t as tFn } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  messages: Record<string, unknown>;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const t = useCallback((key: string) => tFn(messages, key), [messages]);
  return (
    <LocaleContext.Provider value={{ locale, messages, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
