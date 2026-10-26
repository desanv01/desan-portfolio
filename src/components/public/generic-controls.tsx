'use client';
import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { useDesignBinding, usePublicDesignRuntime } from './design-context';
import { setSiteAppearance } from './site-chrome';
import { mediaById, type PublicSite } from '@/public-data';

export function DesignDialog({
  node,
  title,
  children,
  id,
}: {
  node: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div data-design-node={node} id={id}>
      <button
        className="button secondary"
        onClick={() => dialog.current?.showModal()}
      >
        {title}
      </button>
      <dialog
        ref={dialog}
        className="media-dialog"
        aria-label={title}
        onClick={(event) => {
          if (event.currentTarget === event.target) dialog.current?.close();
        }}
      >
        <button
          className="button secondary"
          autoFocus
          onClick={() => dialog.current?.close()}
        >
          Close
        </button>
        {children}
      </dialog>
    </div>
  );
}
export function DesignIcon({
  node,
  site,
  label,
  id,
}: {
  node: string;
  site: PublicSite;
  label: string;
  id?: string;
}) {
  const config = useDesignBinding(node)?.behavior || {};
  const value = config['icon.source'];
  const source =
    value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const asset = mediaById(site, source.assetId);
  const labelled = config['icon.accessibleRole'] === 'labelled';
  const icons: Record<string, string> = {
    arrow: '→',
    external: '↗',
    close: '×',
    plus: '+',
    minus: '−',
    search: '⌕',
    menu: '☰',
    sun: '☼',
    moon: '☾',
    check: '✓',
    download: '↓',
  };
  return (
    <span
      data-design-node={node}
      id={id}
      role={labelled ? 'img' : undefined}
      aria-label={
        labelled ? label || String(source.iconId || 'Icon') : undefined
      }
      aria-hidden={!labelled || undefined}
    >
      {asset && asset.mimeType.startsWith('image/') ? (
        <Image
          data-design-part="icon"
          src={asset.url}
          width={24}
          height={24}
          alt=""
          unoptimized
        />
      ) : (
        <span data-design-part="icon">
          {icons[String(source.iconId)] || '◇'}
        </span>
      )}
    </span>
  );
}
export function DesignAppearance({ node, id }: { node: string; id?: string }) {
  const runtime = usePublicDesignRuntime();
  const appearance = runtime.appearance || { mode: 'dark', themeId: 'copper' };
  return (
    <button
      data-design-node={node}
      className="button secondary"
      onClick={() =>
        setSiteAppearance(
          appearance.mode === 'dark' ? 'light' : 'dark',
          appearance.themeId,
          { themeExplicit: false },
        )
      }
      aria-label={`Switch to ${appearance.mode === 'dark' ? 'light' : 'dark'} appearance`}
      {...runtime.binding(node)?.attributes}
      id={
        id ?? (String(runtime.binding(node)?.attributes.id ?? '') || undefined)
      }
    >
      Change appearance
    </button>
  );
}
