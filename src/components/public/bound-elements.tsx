'use client';

import Image from 'next/image';
import Link, { useLinkStatus } from 'next/link';
import { Children, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  mediaById,
  safeHref,
  type PublicRecord,
  type PublicSite,
} from '@/public-data';
import {
  useDesignBinding,
  useRecordDesignBinding,
  usePublicDesignRuntime,
} from './design-context';

export function BoundEmpty({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  const runtime = usePublicDesignRuntime();
  const ids =
    runtime.binding(`${page}.empty`)?.behavior['collection.emptyState'] ??
    runtime.binding(`${page}.grid`)?.behavior['collection.emptyState'];
  return Array.isArray(ids) && runtime.renderNodes
    ? runtime.renderNodes(
        ids.filter((id): id is string => typeof id === 'string'),
      )
    : children;
}
import { Arrow } from './site-chrome';

export function BoundAction({
  href,
  children,
  primary = false,
  small = false,
  node,
  id,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
  node?: string;
  id?: string;
}) {
  const binding = useDesignBinding(node || '');
  const variant = binding?.behavior['action.variant'];
  const safe = safeHref(href);
  if (!safe || binding?.attributes.hidden) return null;
  const external = /^(https?:|mailto:|tel:)/.test(safe);
  const feedbackValue =
    binding?.behavior[
      primary ? 'motion.primaryFeedback' : 'motion.inversionFeedback'
    ];
  const feedback =
    feedbackValue &&
    typeof feedbackValue === 'object' &&
    !Array.isArray(feedbackValue)
      ? feedbackValue
      : {};
  const duration =
    feedback.duration &&
    typeof feedback.duration === 'object' &&
    !Array.isArray(feedback.duration)
      ? feedback.duration
      : {};
  const curve =
    feedback.easing &&
    typeof feedback.easing === 'object' &&
    !Array.isArray(feedback.easing)
      ? feedback.easing
      : undefined;
  const style = {
    ...(feedback.kind
      ? {
          transitionDuration:
            binding?.behavior['motion.kind'] === 'none' ||
            feedback.kind === 'none'
              ? '0ms'
              : `${duration.value || 0}${duration.unit || 'ms'}`,
          transitionTimingFunction:
            typeof feedback.easing === 'string'
              ? feedback.easing
              : curve
                ? `cubic-bezier(${curve.x1},${curve.y1},${curve.x2},${curve.y2})`
                : undefined,
        }
      : {}),
    '--feedback-opacity':
      typeof feedback.opacity === 'number' ? feedback.opacity : 0.8,
  } as CSSProperties;
  const props = {
    ...binding?.attributes,
    ...(id !== undefined ? { id } : {}),
    style,
    className: `button ${variant === 'fill' || (!variant && primary) ? 'primary' : variant === 'text' ? 'text-action' : 'secondary'} ${small ? 'small' : ''}`,
    'data-design-node': node,
    'data-feedback-kind':
      typeof feedback.kind === 'string' ? feedback.kind : undefined,
  };
  return external ? (
    <a href={safe} {...props}>
      {children}
      <Arrow external />
    </a>
  ) : (
    <Link href={safe} {...props}>
      <LinkContents node={node}>{children}</LinkContents>
    </Link>
  );
}
function LinkContents({
  node,
  children,
}: {
  node?: string;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();
  const binding = useDesignBinding(node || '');
  const value = binding?.behavior['action.loadingPresentation'];
  const config =
    value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const indicator =
    pending && config.kind !== 'none' ? (
      <span
        role="status"
        className={config.kind === 'spinner' ? 'loading-spinner' : ''}
      >
        {config.kind === 'spinner' ? (
          <span className="sr-only">Loading</span>
        ) : config.kind === 'icon' ? (
          '…'
        ) : (
          'Loading…'
        )}
      </span>
    ) : null;
  return (
    <>
      <span className="action-label" data-design-loading={pending || undefined}>
        {config.position === 'before' && indicator}
        {!(pending && config.position === 'replace') && children}
        {config.position !== 'before' && indicator}
      </span>
      <Arrow />
    </>
  );
}
export function BoundCard({
  node,
  id,
  children,
}: {
  node: string;
  id: string;
  children: ReactNode;
}) {
  const binding = useRecordDesignBinding(node, 'projects', id);
  const config = binding?.behavior || {};
  const position = config['card.mediaPosition'];
  const placement =
    position && typeof position === 'object' && !Array.isArray(position)
      ? position.placement
      : undefined;
  return (
    <article
      {...binding?.attributes}
      className="project-card"
      data-design-node={node}
      data-design-content-collection="projects"
      data-design-content-id={id}
      data-interactive-area={String(
        config['card.interactiveArea'] || 'separate-actions',
      )}
      data-media-position={
        typeof placement === 'string' ? placement : undefined
      }
    >
      {children}
    </article>
  );
}
export function BoundCollection({
  node,
  records,
  children,
  className,
  attributes,
  empty,
}: {
  node: string;
  records: PublicRecord[];
  children: ReactNode;
  className?: string;
  attributes?: Record<string, unknown>;
  empty?: ReactNode;
}) {
  const binding = useDesignBinding(node);
  const order = binding?.behavior['collection.displayOrder'];
  const limit = binding?.behavior['collection.limit'];
  const elements = Children.toArray(children);
  let entries = records.map((record, index) => ({
    record,
    element: elements[index],
  }));
  if (order === 'title')
    entries.sort((a, b) => a.record.title.localeCompare(b.record.title));
  if (order === 'date-ascending' || order === 'date-descending')
    entries.sort(
      (a, b) =>
        String(
          a.record.editorialDate || a.record.publishedAt || '',
        ).localeCompare(
          String(b.record.editorialDate || b.record.publishedAt || ''),
        ) * (order === 'date-ascending' ? 1 : -1),
    );
  if (typeof limit === 'number') entries = entries.slice(0, limit);
  else if (/^(home|case-study|article)\./.test(node))
    entries = entries.slice(0, 3);
  return (
    <div
      {...binding?.attributes}
      {...attributes}
      className={className}
      data-design-node={node}
    >
      {entries.length ? entries.map((item) => item.element) : empty}
    </div>
  );
}
export function BoundMedia({
  site,
  assetId,
  node,
  placeholder,
  id,
  bindingOwner = true,
}: {
  site: PublicSite;
  assetId: string | null;
  node: string;
  placeholder: string;
  id?: string;
  bindingOwner?: boolean;
}) {
  const binding = useDesignBinding(node);
  const config = binding?.behavior || {};
  const override = config['media.asset'];
  const chosen =
    override && typeof override === 'object' && !Array.isArray(override)
      ? override.assetId
      : assetId;
  const asset = mediaById(site, chosen);
  const dialog = useRef<HTMLDialogElement>(null);
  const viewer = config['gallery.viewer'];
  const dialogMode =
    viewer &&
    typeof viewer === 'object' &&
    !Array.isArray(viewer) &&
    viewer.mode === 'dialog';
  if (binding?.attributes.hidden) return null;
  if (
    !asset ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)
  )
    return (
      <div
        {...(bindingOwner ? binding?.attributes : undefined)}
        id={
          bindingOwner
            ? (id ??
              (typeof binding?.attributes.id === 'string'
                ? binding.attributes.id
                : undefined))
            : undefined
        }
        className="media-frame media-placeholder"
        data-design-node={bindingOwner ? node : undefined}
      >
        <span>{placeholder}</span>
      </div>
    );
  const caption = config['media.caption'];
  const credit = config['media.credit'];
  const captionConfig =
    caption && typeof caption === 'object' && !Array.isArray(caption)
      ? caption
      : {};
  const creditConfig =
    credit && typeof credit === 'object' && !Array.isArray(credit)
      ? credit
      : {};
  const image = (
    <Image
      data-design-part="image"
      unoptimized
      src={asset.url}
      alt={asset.alt}
      width={typeof asset.width === 'number' ? asset.width : 1000}
      height={typeof asset.height === 'number' ? asset.height : 600}
    />
  );
  return (
    <figure
      {...(bindingOwner ? binding?.attributes : undefined)}
      id={
        bindingOwner
          ? (id ??
            (typeof binding?.attributes.id === 'string'
              ? binding.attributes.id
              : undefined))
          : undefined
      }
      className="bound-media"
      data-design-node={bindingOwner ? node : undefined}
    >
      {asset.caption && captionConfig.visible !== false && (
        <figcaption
          data-design-part="caption"
          data-position={String(captionConfig.position || 'after')}
          className="record-meta"
        >
          {asset.caption}
        </figcaption>
      )}
      <div className="media-frame" data-design-part="media">
        {dialogMode ? (
          <button
            className="media-open"
            onClick={() => dialog.current?.showModal()}
            aria-label={`Expand image: ${asset.alt}`}
          >
            {image}
          </button>
        ) : (
          image
        )}
      </div>
      {asset.credit && creditConfig.visible !== false && (
        <span
          data-design-part="credit"
          data-position={String(creditConfig.position || 'after')}
          className="record-meta"
        >
          {asset.credit}
        </span>
      )}
      {dialogMode && (
        <dialog
          ref={dialog}
          data-design-part="viewer"
          className="media-dialog"
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
        >
          <button
            autoFocus
            className="button secondary"
            onClick={() => dialog.current?.close()}
          >
            Close image
          </button>
          {image}
        </dialog>
      )}
    </figure>
  );
}
