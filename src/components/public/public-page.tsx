import { cookies } from 'next/headers';
import { isValidElement, type ReactNode } from 'react';
import { list, records, safeHref, text, type PublicSite } from '@/public-data';
import { DesignFrame } from './design-frame';
import { DEFAULT_NAV } from './navigation';
import { HashFocus } from './hash-focus';
import {
  structuredData,
  serializeStructuredData,
} from '@/public-data/discovery';
import type { PublicRecord } from '@/public-data';

export async function PublicPage({
  site,
  pageId,
  slots,
  record,
}: {
  site: PublicSite;
  pageId: string;
  slots: Record<string, ReactNode>;
  record?: PublicRecord;
}) {
  const preferences = await cookies();
  const design = site.status === 'ready' ? site.publication.design : undefined;
  const storedMode = preferences.get('desan-mode')?.value;
  const mode =
    storedMode === 'light' || storedMode === 'dark'
      ? storedMode
      : design?.defaultMode === 'light'
        ? 'light'
        : 'dark';
  const storedTheme = preferences.get('desan-theme')?.value;
  const themeId = design?.themes.some(
    (theme) =>
      theme.id === storedTheme &&
      !theme.archived &&
      design.visitorThemeIds.includes(theme.id),
  )
    ? storedTheme
    : design?.defaultThemeId || 'copper';
  const profile = records(site, 'profile')[0];
  const settings = records(site, 'site-settings')[0];
  const nav = list(settings?.navigation).flatMap((item) => {
    const href = safeHref(item.path);
    const label = text(item.label);
    return href?.startsWith('/') && !href.startsWith('/admin') && label
      ? [{ href, label }]
      : [];
  });
  const slotAttributes: Record<string, Record<string, string | number>> = {};
  const content = Object.fromEntries(
    Object.entries(slots).map(([id, slot]) => {
      if (!isValidElement(slot)) return [id, slot];
      const props = slot.props as Record<string, unknown>;
      slotAttributes[id] = Object.fromEntries(
        Object.entries(props).filter(
          ([key, value]) =>
            (key === 'id' ||
              key === 'className' ||
              key === 'tabIndex' ||
              key.startsWith('data-')) &&
            (typeof value === 'string' || typeof value === 'number'),
        ),
      ) as Record<string, string | number>;
      return [id, props.children as ReactNode];
    }),
  );
  return (
    <>
      {structuredData(site, pageId, record) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(
              structuredData(site, pageId, record)!,
            ),
          }}
        />
      )}
      <HashFocus />
      <DesignFrame
        site={site}
        pageId={pageId}
        slots={content}
        slotAttributes={slotAttributes}
        initialMode={mode}
        explicitMode={
          storedMode === 'light' || storedMode === 'dark' ? storedMode : null
        }
        initialTheme={themeId}
        navigation={nav.length ? nav : DEFAULT_NAV}
        brand={text(profile?.displayName, 'Desan Vasu')}
      />
    </>
  );
}
