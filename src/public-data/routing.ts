import { recordBySlug, resolveRedirect, type PublicSite } from './index';

const indexes = new Set([
  '/',
  '/work',
  '/profile',
  '/journal',
  '/contact',
  '/resume',
  '/search',
]);
const reserved =
  /^\/(?:api|admin|owner|_next|fonts|images|icons|\.well-known)(?:\/|$)/;
const assets = new Set([
  '/robots.txt',
  '/favicon.ico',
  '/sitemap.xml',
  '/feed.xml',
  '/social-image',
  '/manifest.webmanifest',
]);
export type PublicRouteDecision =
  | { kind: 'next' }
  | { kind: 'redirect'; pathname: string }
  | { kind: 'missing' }
  | { kind: 'unavailable' };

/** Indexes, CMS/API and static resources must never cause a publication DB read. */
export function needsPublicRouteCheck(
  pathname: string,
  method = 'GET',
): boolean {
  if (
    !['GET', 'HEAD'].includes(method) ||
    indexes.has(pathname) ||
    reserved.test(pathname)
  )
    return false;
  if (pathname === '/not-found') return true;
  return !assets.has(pathname);
}

export function classifyPublicRoute(
  pathname: string,
  site: PublicSite,
  method = 'GET',
): PublicRouteDecision {
  if (!needsPublicRouteCheck(pathname, method)) return { kind: 'next' };
  if (pathname === '/not-found') return { kind: 'missing' };
  if (pathname === '/projects') return { kind: 'redirect', pathname: '/work' };
  if (pathname === '/posts') return { kind: 'redirect', pathname: '/journal' };
  if (site.status === 'unavailable') return { kind: 'unavailable' };
  const redirect = resolveRedirect(site, pathname);
  if (redirect) return { kind: 'redirect', pathname: redirect };
  const detail = pathname.match(
    /^\/(work|journal)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/,
  );
  if (
    detail &&
    recordBySlug(site, detail[1] === 'work' ? 'projects' : 'posts', detail[2])
  )
    return { kind: 'next' };
  return { kind: 'missing' };
}
