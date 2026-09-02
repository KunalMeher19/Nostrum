import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isValidLocale } from './lib/i18n';

// Skip static assets and Next internals
const SKIP = /^\/(_next|api|favicon\.ico|.*\.(svg|png|jpg|jpeg|webp|avif|ico|woff2?|ttf|otf|css|js))(\?.*)?$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SKIP.test(pathname)) return NextResponse.next();

  // Already has a valid locale prefix — the client keeps the choice for this tab.
  const first = pathname.split('/')[1];
  if (isValidLocale(first)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
