import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from './lib/i18n';

const COOKIE = 'NEXT_LOCALE';

// Skip static assets and Next internals
const SKIP = /^\/(_next|api|favicon\.ico|.*\.(svg|png|jpg|jpeg|webp|avif|ico|woff2?|ttf|otf|css|js))(\?.*)?$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SKIP.test(pathname)) return NextResponse.next();

  // Already has a valid locale prefix — pass through and refresh cookie
  const first = pathname.split('/')[1];
  if (isValidLocale(first)) {
    const res = NextResponse.next();
    res.cookies.set(COOKIE, first, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' });
    return res;
  }

  // Determine best locale: cookie → default
  // (We default to 'en' so new users see English by default,
  // but keep the browser language detection code below as requested)
  const cookie = req.cookies.get(COOKIE)?.value;
  let locale = isValidLocale(cookie ?? '') ? (cookie as string) : 'en';

  if (!locale) {
    const accept = req.headers.get('accept-language') ?? '';
    for (const part of accept.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase().slice(0, 2);
      if (isValidLocale(tag)) { locale = tag; break; }
    }
  }

  locale ??= DEFAULT_LOCALE;

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
