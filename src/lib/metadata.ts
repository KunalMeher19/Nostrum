import type { Metadata } from 'next';
import { LOCALES, type Locale, t } from './i18n';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://nostrum.com';

export function generateLocalizedMetadata(
  locale: Locale,
  messages: Record<string, unknown>,
  page: string,
  pathname: string,
): Metadata {
  return {
    title: t(messages, `meta.${page}_title`),
    description: t(messages, `meta.${page}_description`),
    alternates: {
      canonical: `${BASE_URL}/${locale}${pathname}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE_URL}/${l}${pathname}`])
      ) as Record<string, string>,
    },
  };
}
