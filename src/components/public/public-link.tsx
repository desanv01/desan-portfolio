'use client';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { usePreviewNavigation } from '../owner/preview-navigation';
import {
  previewDestination,
  previewHref,
} from '../owner/preview-navigation-url';

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href: string;
};
/** Native preview links preserve modified-click/context-menu behavior and never mount Next prefetch. */
export default function PublicLink(props: LinkProps) {
  const context = usePreviewNavigation();
  if (!context) return <NextLink {...props} />;
  const anchor = { ...props };
  for (const key of [
    'as',
    'prefetch',
    'replace',
    'scroll',
    'onNavigate',
    'transitionTypes',
    'legacyBehavior',
    'passHref',
    'shallow',
    'locale',
  ])
    delete (anchor as Record<string, unknown>)[key];
  return (
    <a
      {...anchor}
      href={
        props.download !== undefined && props.download !== false
          ? props.href
          : previewHref(props.href, context)
      }
    />
  );
}
/** Semantic content anchors keep their public behavior without adding prefetch. */
export function PublicAnchor(props: ComponentProps<'a'>) {
  const context = usePreviewNavigation();
  return (
    <a
      {...props}
      href={
        typeof props.href === 'string' &&
        (props.download === undefined || props.download === false)
          ? previewHref(props.href, context)
          : props.href
      }
    />
  );
}
export function PublicGetForm(props: ComponentProps<'form'>) {
  const context = usePreviewNavigation();
  const destination =
    context &&
    (props.method || 'get').toLowerCase() === 'get' &&
    (typeof props.action === 'string' || props.action === undefined)
      ? previewDestination(props.action || context.pathname, context)
      : undefined;
  if (!destination || !context) return <form {...props} />;
  return (
    <form {...props} action={destination}>
      {props.children}
      <input type="hidden" name="receipt" value={context.receipt} />
    </form>
  );
}
