'use client';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { previewHref, type PreviewRoute } from './preview-navigation-url';
export const PreviewNavigationContext = createContext<PreviewRoute | null>(
  null,
);
/** Server-rendered links inherit the exact receipt before hydration or prefetch. */
export function PreviewNavigation({
  receipt,
  pathname,
  origin,
  children,
}: {
  receipt: string;
  pathname: string;
  origin: string;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ receipt, pathname, origin }),
    [receipt, pathname, origin],
  );
  return (
    <PreviewNavigationContext.Provider value={value}>
      {children}
    </PreviewNavigationContext.Provider>
  );
}
export const usePreviewNavigation = () => useContext(PreviewNavigationContext);
export function usePreviewHref() {
  const context = usePreviewNavigation();
  return (href: string) => previewHref(href, context);
}
