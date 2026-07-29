export const LOCALES = ['en', 'es', 'ca', 'el', 'it'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<Locale, { name: string; nativeName: string }> = {
  en: { name: 'English',  nativeName: 'English'  },
  es: { name: 'Spanish',  nativeName: 'Español'  },
  ca: { name: 'Catalan',  nativeName: 'Català'   },
  el: { name: 'Greek',    nativeName: 'Ελληνικά' },
  it: { name: 'Italian',  nativeName: 'Italiano' },
};

export function isValidLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}

export async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  const mod = await import(`../../messages/${locale}.json`);
  return mod.default ?? mod;
}

export function t(messages: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = messages;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : key;
}
