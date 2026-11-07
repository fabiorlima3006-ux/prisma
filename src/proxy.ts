import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Páginas de ativo só existem em minúsculas: maiúsculas redirecionam (308) antes da renderização. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();
  if (lower !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = lower;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/acoes/:path*', '/fiis/:path*', '/etfs/:path*', '/cripto/:path*'],
};
