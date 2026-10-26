'use client';

import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import Link from './public-link';
import {
  compileDesignStyles,
  createCopperDesign,
  resolveDesignBinding,
  type RuntimeBinding,
} from '@/design/runtime';
import type { DesignNode } from '@/design/model';
import {
  recordById,
  recordPath,
  records,
  safeHref,
  text,
  type PublicCollection,
  type PublicSite,
} from '@/public-data';
import { PublicDesignContext } from './design-context';
import {
  DEFAULT_NAV,
  SiteFooter,
  SiteHeader,
  PagePosition,
  useSiteAppearance,
  type PublicNavItem,
} from './site-chrome';
import { JournalRows, ProjectGrid } from './primitives';
import { RichText } from './rich-text';
import { DesignEffects } from './design-effects';
import { DesignAppearance, DesignDialog, DesignIcon } from './generic-controls';
import { BoundAction, BoundMedia } from './bound-elements';
import { useDesignBinding, usePublicDesignRuntime } from './design-context';
import {
  useDesignStudioPreview,
  useIsOwnerDesignPreview,
} from '../owner/design-studio-preview';

const pages: Record<string, string> = {
  home: '/',
  work: '/work',
  'case-study': '/work',
  profile: '/profile',
  journal: '/journal',
  article: '/journal',
  contact: '/contact',
  resume: '/resume',
  search: '/search',
  'not-found': '/',
};
function subscribeViewport(listener: () => void) {
  window.addEventListener('resize', listener);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', listener);
  return () => {
    window.removeEventListener('resize', listener);
    preference.removeEventListener('change', listener);
  };
}
const viewportSnapshot = () =>
  `${window.innerWidth}|${matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0}`;

export function DesignFrame({
  site,
  pageId,
  slots,
  slotAttributes = {},
  initialMode = 'dark',
  explicitMode = null,
  initialTheme,
  navigation = DEFAULT_NAV,
  brand = 'Desan Vasu',
}: {
  site: PublicSite;
  pageId: string;
  slots: Record<string, ReactNode>;
  slotAttributes?: Record<string, Record<string, string | number>>;
  initialMode?: 'light' | 'dark';
  explicitMode?: 'light' | 'dark' | null;
  initialTheme?: string;
  navigation?: PublicNavItem[];
  brand?: string;
}) {
  const baseline = useMemo(() => createCopperDesign(), []);
  const preview = useDesignStudioPreview();
  const ownerPreview = useIsOwnerDesignPreview();
  const design =
    preview?.document ||
    (site.status === 'ready' ? site.publication.design : baseline);
  const allowedThemes = design.themes.filter(
    (theme) =>
      !theme.archived &&
      (design.visitorThemeIds.includes(theme.id) ||
        theme.id === design.defaultThemeId),
  );
  const appearance = useSiteAppearance(
    initialMode,
    initialTheme || design.defaultThemeId,
    design.defaultMode,
    explicitMode,
    allowedThemes.map((theme) => theme.id),
  );
  const mode = preview?.mode || appearance.mode;
  const themeId =
    preview?.themeId ||
    (allowedThemes.some((theme) => theme.id === appearance.themeId)
      ? appearance.themeId
      : design.defaultThemeId);
  const viewport = useSyncExternalStore(
    subscribeViewport,
    viewportSnapshot,
    () => '1440|0',
  );
  const [width, systemReduced] = viewport.split('|').map(Number);
  const reduced = preview ? Number(preview.reducedMotion) : systemReduced;
  const options = useMemo(
    () => ({
      pageId: design.pages.some((page) => page.id === pageId)
        ? pageId
        : undefined,
      themeId,
      mode,
      resources: site.status === 'ready' ? site.publication.media : [],
      scopeId: `public-${pageId}`,
      ownerPreview,
      previewStates: preview
        ? { nodeId: preview.nodeId, states: preview.states }
        : undefined,
    }),
    [design, pageId, themeId, mode, site, ownerPreview, preview],
  );
  const compiled = useMemo(
    () => compileDesignStyles(design, options),
    [design, options],
  );
  const bindings = useMemo(() => {
    const cache = new Map<string, RuntimeBinding | undefined>();
    const binding = (id: string) => {
      if (cache.has(id)) return cache.get(id);
      let value: RuntimeBinding | undefined;
      try {
        value = resolveDesignBinding(design, {
          ...options,
          nodeId: id,
          width,
          reducedMotion: !!reduced,
          states:
            preview && (!preview.nodeId || preview.nodeId === id)
              ? preview.states
              : [],
        });
      } catch {
        value = undefined;
      }
      cache.set(id, value);
      return value;
    };
    const anchors = Object.fromEntries(
      design.nodes.map((node) => [
        node.id,
        String(
          binding(node.id)?.behavior['section.anchor'] ||
            slotAttributes[node.id]?.id ||
            node.id,
        ),
      ]),
    );
    return {
      breakpoints: design.breakpoints,
      nodes: compiled.nodes,
      viewportWidth: width,
      reducedMotion: !!reduced,
      appearance: { mode, themeId },
      anchors,
      binding,
    };
  }, [
    design,
    options,
    width,
    reduced,
    compiled.nodes,
    slotAttributes,
    mode,
    themeId,
    preview,
  ]);
  const nodes = new Map(design.nodes.map((node) => [node.id, node]));
  const page = design.pages.find((item) => item.id === pageId);
  const rootIds = page
    ? compiled.rootIds
    : baseline.pages.find((item) => item.id === pageId)?.rootIds || [];
  const knownRoots = new Map(baseline.nodes.map((node) => [node.id, node]));

  function renderNode(id: string, trail = new Set<string>()): ReactNode {
    if (trail.has(id) || trail.size > 32) return null;
    const node = nodes.get(id) || knownRoots.get(id);
    if (!node) return null;
    const binding = bindings.binding(id);
    if (binding?.attributes.hidden) return null;
    const nextTrail = new Set([...trail, id]);
    const config = binding?.behavior || {};
    const emptyIds = config['collection.emptyState'];
    const emptyCollection =
      node.kind === 'collection' &&
      node.contentRef?.collection !== 'media' &&
      !records(site, node.contentRef?.collection as PublicCollection).length;
    const childIds =
      emptyCollection && Array.isArray(emptyIds)
        ? emptyIds.filter((value): value is string => typeof value === 'string')
        : node.children;
    const children = childIds.map((child) => renderNode(child, nextTrail));
    const numbering = config['section.numbering'];
    const number =
      numbering && typeof numbering === 'object' && !Array.isArray(numbering)
        ? numbering
        : {};
    const dividerValue = config['section.divider'];
    const divider =
      dividerValue &&
      typeof dividerValue === 'object' &&
      !Array.isArray(dividerValue)
        ? dividerValue
        : {};
    const before = (
      <>
        {(divider.placement === 'before' || divider.placement === 'both') && (
          <hr data-design-part="divider" />
        )}
        {number.mode && number.mode !== 'hidden' && (
          <span className="section-number eyebrow">
            {number.mode === 'manual'
              ? String(number.label || '')
              : String(Math.max(0, rootIds.indexOf(id)) + 1).padStart(2, '0')}
          </span>
        )}
      </>
    );
    const after =
      divider.placement === 'after' || divider.placement === 'both' ? (
        <hr data-design-part="divider" />
      ) : null;
    const attrs = {
      ...slotAttributes[id],
      id: bindings.anchors[id],
      'data-design-node': id,
      'data-container':
        typeof config['container.behavior'] === 'string'
          ? config['container.behavior']
          : undefined,
      'data-density':
        typeof config.density === 'string' ? config.density : undefined,
      ...(node.contentRef
        ? {
            'data-design-content-collection': node.contentRef.collection,
            'data-design-content-id': node.contentRef.id,
          }
        : {}),
      ...binding?.attributes,
    };
    const slot = slots[id];
    if (slot === null && !node.children.length) return null;
    if (slot !== undefined)
      return (
        <section key={id} {...attrs}>
          {before}
          {node.children.length ? children : slot}
          {after}
        </section>
      );
    return (
      <GenericNode
        key={id}
        node={node}
        attrs={attrs}
        site={site}
        pageId={pageId}
        before={before}
        after={after}
      >
        {children}
      </GenericNode>
    );
  }
  const settings = records(site, 'site-settings')[0];
  const synthetic = records(site, 'profile').some(
    (record) => record.slug === 'synthetic-demo-engineer',
  );
  const shell = compiled.shellRoots;
  const hasShell = (kind: keyof typeof shell, id: string) =>
    shell[kind].includes(id) && !bindings.binding(id)?.attributes.hidden;
  const chrome = (id: string): ReactNode => {
    if (bindings.binding(id)?.attributes.hidden) return null;
    if (nodes.get(id)?.children.length) return renderNode(id);
    if (id === 'header')
      return (
        <SiteHeader
          key={id}
          navigation={navigation}
          initialMode={initialMode}
          explicitMode={explicitMode}
          defaultMode={design.defaultMode}
          initialTheme={themeId}
          themes={allowedThemes.map(({ id: key, name }) => ({ id: key, name }))}
        />
      );
    if (id === 'footer') return <SiteFooter key={id} brand={brand} />;
    if (id === 'progress' || id === 'section-nav') return null;
    return renderNode(id);
  };
  return (
    <PublicDesignContext
      value={{
        ...bindings,
        renderNodes: (ids) => ids.map((id) => renderNode(id)),
      }}
    >
      <div
        className="public-surface"
        {...compiled.rootAttributes}
        data-public-revision={
          site.status === 'ready' ? site.publication.revision : site.status
        }
      >
        <style>{compiled.css}</style>
        <DesignEffects />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {shell.header.map(chrome)}
        {shell.navigation.map(chrome)}
        {(hasShell('navigation', 'progress') ||
          hasShell('navigation', 'section-nav')) && (
          <PagePosition
            showProgress={hasShell('navigation', 'progress')}
            showSections={hasShell('navigation', 'section-nav')}
          />
        )}
        {synthetic && (
          <p className="fixture-notice">
            Local demonstration · synthetic content, not personal claims
          </p>
        )}
        <main id="main-content" tabIndex={-1}>
          {rootIds.map((id) => renderNode(id))}
        </main>
        {shell.footer.map(chrome)}
        {text(settings?.footer) && (
          <p className="footer-note content">{text(settings?.footer)}</p>
        )}
      </div>
    </PublicDesignContext>
  );
}

export function GenericNode({
  node,
  attrs,
  children,
  site,
  pageId,
  before,
  after,
}: {
  node: DesignNode;
  attrs: Record<string, unknown>;
  children: ReactNode;
  site: PublicSite;
  pageId: string;
  before?: ReactNode;
  after?: ReactNode;
}) {
  const binding = useDesignBinding(node.id);
  const runtime = usePublicDesignRuntime();
  const reference = node.contentRef;
  const record =
    reference && reference.collection !== 'media'
      ? recordById(site, reference.collection as PublicCollection, reference.id)
      : undefined;
  const heading = record?.title || '';
  const copy = record?.summary || heading;
  const anchorId = typeof attrs.id === 'string' ? attrs.id : undefined;
  const target =
    node.target && pages[node.target.pageId]
      ? `${pages[node.target.pageId]}${node.target.nodeId ? `#${encodeURIComponent(runtime.anchors?.[node.target.nodeId] || node.target.nodeId)}` : ''}`
      : record && reference
        ? recordPath(reference.collection as PublicCollection, record)
        : null;
  switch (node.kind) {
    case 'heading':
      return (
        <h2 {...attrs}>
          {heading}
          {children}
        </h2>
      );
    case 'text':
      return (
        <p {...attrs}>
          {copy}
          {children}
        </p>
      );
    case 'metadata':
      return (
        <div {...attrs} className="record-meta">
          {copy}
          {children}
        </div>
      );
    case 'rich-text':
      return (
        <div {...attrs}>
          {record?.body ? <RichText value={record.body} /> : copy}
          {children}
        </div>
      );
    case 'link':
    case 'button':
      return target && safeHref(target) ? (
        <BoundAction node={node.id} href={target} id={anchorId}>
          {heading || 'Explore'}
          {children}
        </BoundAction>
      ) : null;
    case 'media':
      return (
        <BoundMedia
          site={site}
          assetId={
            reference?.collection === 'media'
              ? reference.id
              : Array.isArray(record?.media)
                ? String(record.media[0])
                : null
          }
          node={node.id}
          id={anchorId}
          placeholder="Media awaiting selection"
        />
      );
    case 'gallery':
      return (
        <div {...attrs} className="design-gallery">
          {Array.isArray(record?.media)
            ? record.media.map((id) => (
                <BoundMedia
                  key={String(id)}
                  site={site}
                  assetId={String(id)}
                  node={node.id}
                  bindingOwner={false}
                  placeholder="Media awaiting selection"
                />
              ))
            : children}
        </div>
      );
    case 'collection': {
      const collection = reference?.collection;
      return collection === 'projects' ? (
        <ProjectGrid
          site={site}
          items={records(site, 'projects')}
          page={pageId}
          node={node.id}
          attributes={attrs}
          empty={children}
        />
      ) : collection === 'posts' ? (
        <JournalRows
          items={records(site, 'posts')}
          page={pageId}
          node={node.id}
          attributes={attrs}
          empty={children}
        />
      ) : (
        <div {...attrs}>{children}</div>
      );
    }
    case 'divider':
      return <hr {...attrs} />;
    case 'spacer':
      return <div {...attrs} aria-hidden="true" />;
    case 'disclosure':
      return (
        <details
          {...attrs}
          open={
            binding?.attributes['data-design-default-expanded'] === 'true' ||
            undefined
          }
        >
          <summary>{heading || 'More information'}</summary>
          {copy}
          {children}
        </details>
      );
    case 'dialog':
      return (
        <DesignDialog
          node={node.id}
          id={anchorId}
          title={heading || 'More information'}
        >
          {children || copy}
        </DesignDialog>
      );
    case 'icon':
      return (
        <DesignIcon node={node.id} id={anchorId} site={site} label={heading} />
      );
    case 'appearance':
      return <DesignAppearance node={node.id} id={anchorId} />;
    case 'progress':
      return (
        <PagePosition
          showSections={false}
          progressNodeId={node.id}
          progressAnchorId={anchorId}
        />
      );
    case 'section-navigation':
      return (
        <PagePosition
          showProgress={false}
          sectionNodeId={node.id}
          sectionAnchorId={anchorId}
        />
      );
    case 'code':
      return (
        <pre {...attrs}>
          <code>{copy}</code>
          {children}
        </pre>
      );
    case 'section':
      return (
        <section
          {...attrs}
          className="section content"
          data-section={heading || undefined}
          tabIndex={-1}
        >
          {before}
          {children}
          {after}
        </section>
      );
    case 'navigation':
      return (
        <nav {...attrs} aria-label={heading || 'Related navigation'}>
          {children}
        </nav>
      );
    case 'header':
      return <header {...attrs}>{children}</header>;
    case 'footer':
      return <footer {...attrs}>{children}</footer>;
    case 'table':
      return (
        <div {...attrs}>
          {record && (
            <table>
              <caption>{heading}</caption>
              <tbody>
                {[
                  ['Title', heading],
                  ['Summary', copy],
                ].map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {children}
        </div>
      );
    case 'timeline':
      return (
        <ol {...attrs} className="design-timeline">
          {Array.isArray(children) ? (
            children.map((child, index) => (
              <li key={node.children[index]}>{child}</li>
            ))
          ) : (
            <li>{children}</li>
          )}
        </ol>
      );
    case 'message':
      return (
        <div {...attrs} role="status" className="empty-state">
          {copy}
          {children}
        </div>
      );
    case 'card':
    case 'record':
    case 'skill':
      return (
        <article {...attrs}>
          {heading && <h3>{heading}</h3>}
          {copy && <p>{copy}</p>}
          {children}
        </article>
      );
    case 'tag':
      return target ? (
        <Link {...attrs} href={target} className="tag">
          {heading}
          {children}
        </Link>
      ) : (
        <span {...attrs} className="tag">
          {copy}
          {children}
        </span>
      );
    case 'pagination':
      return (
        <nav {...attrs} aria-label="Pagination">
          {children || (target ? <Link href={target}>Continue →</Link> : null)}
        </nav>
      );
    case 'field':
      return (
        <label {...attrs}>
          {heading || 'Search'}
          <input type="search" name="q" />
        </label>
      );
    default:
      return (
        <div {...attrs} className={`design-${node.kind}`}>
          {children || copy}
        </div>
      );
  }
}
