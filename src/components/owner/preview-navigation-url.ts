export type PreviewRoute = {
  receipt: string;
  pathname: string;
  origin: string;
};
const prefix = '/owner/preview';
export function isPreviewPage(pathname: string): boolean {
  return /^\/(?:$|(?:work|journal)(?:\/[^/]+)?\/?$|(?:profile|contact|resume|search|not-found)\/?$)/.test(
    pathname,
  );
}
/** Return a private navigation destination only for supported same-origin pages. */
export function previewDestination(
  href: string,
  context: PreviewRoute,
): string | undefined {
  if (!href || href.startsWith('#') || /[\u0000-\u0020\\]/.test(href)) return;
  if (!/^[a-f0-9-]{36}$/.test(context.receipt)) return;
  let url: URL;
  let origin: URL;
  try {
    origin = new URL(context.origin);
    url = new URL(href, new URL(context.pathname, origin));
  } catch {
    return;
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.origin !== origin.origin
  )
    return;
  let pathname = url.pathname;
  if (pathname === prefix || pathname.startsWith(prefix + '/'))
    pathname = pathname.slice(prefix.length) || '/';
  if (!isPreviewPage(pathname)) return;
  url.pathname = prefix + (pathname === '/' ? '' : pathname);
  url.searchParams.set('receipt', context.receipt);
  return url.pathname + url.search + url.hash;
}
export const previewHref = (href: string, context: PreviewRoute | null) =>
  context ? (previewDestination(href, context) ?? href) : href;
