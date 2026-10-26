import { NextResponse, type NextRequest } from 'next/server';
import { indexable } from './public-data/discovery';
import { readPublishedSite } from './public-data/node-loader';
import {
  classifyPublicRoute,
  needsPublicRouteCheck,
} from './public-data/routing';

/** Next Proxy uses Node.js; no internal HTTP, Host-based fetch or raw CMS reads. */
async function routePublicRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!needsPublicRouteCheck(pathname, request.method))
    return NextResponse.next();
  if (pathname === '/not-found')
    return NextResponse.next({
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  const site = ['/not-found', '/projects', '/posts'].includes(pathname)
    ? { status: 'empty' as const, publication: null }
    : await readPublishedSite();
  const decision = classifyPublicRoute(pathname, site, request.method);
  if (decision.kind === 'next') return NextResponse.next();
  if (decision.kind === 'redirect') {
    const destination = request.nextUrl.clone();
    destination.pathname = decision.pathname;
    return NextResponse.redirect(destination, 308);
  }
  if (decision.kind === 'unavailable')
    return new NextResponse(
      'Content is temporarily unavailable. Please try again shortly.',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
    );
  const destination = request.nextUrl.clone();
  destination.pathname = '/not-found';
  destination.search = '';
  return NextResponse.rewrite(destination, {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

// Resolve indexing from runtime configuration while preserving all existing
// publication-aware status codes, redirects and missing-route handling.
export async function proxy(request: NextRequest) {
  const response = await routePublicRequest(request);
  if (!indexable() || request.nextUrl.pathname === '/search')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: [
    '/((?!api(?:/|$)|admin(?:/|$)|owner(?:/|$)|_next(?:/|$)|fonts(?:/|$)|images(?:/|$)|icons(?:/|$)|robots\\.txt$|favicon\\.ico$|sitemap\\.xml$|manifest\\.webmanifest$).*)',
  ],
};
