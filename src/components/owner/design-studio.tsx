'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NODE_KINDS,
  STATES,
  assertValidDesign,
  exportDesign,
  type DesignDocument,
  type State,
  type Font,
  type NodeKind,
} from '../../design/model';
import { literalProperties, type Json } from '../../design/schema';
import { resolveDesignBinding } from '../../design/runtime';
import { PROPERTY_CONTROLS } from '../../owner-design/property-controls';
import { contrastWarnings } from '../../owner-design/diagnostics';
import { initialValue } from '../../owner-design/control-schema';
import {
  openEditor,
  commit,
  undo,
  redo,
  acknowledgeSave,
  saveFailure,
  isDirty,
  clone,
  inspectValues,
  normalizeEditorContext,
  valuesAt,
  setProperty,
  resetScope,
  addNode,
  moveNode,
  duplicateNode,
  removeNode,
  detachNodeRole,
  editTheme,
  editBreakpoint,
  uniqueId,
  validateImport,
  exportRecovery,
  exportThemes,
  type Selection,
  type Context,
  type Destination,
} from '../../owner-design/editor';
import {
  saveDesign,
  readDesign,
  readVersions,
  restoreDesign,
  readMedia,
  uploadMedia,
  ownerFetch,
  OwnerDesignError,
  type VersionRecord,
  type MediaRecord,
} from '../../owner-design/client';
import { VisualValueEditor } from './design-studio-controls';
import './design-studio.css';

export type StudioRoute = { pageId: string; label: string; path: string };
export type DesignStudioProps = {
  initial: {
    document: DesignDocument;
    revision: string;
    recordId: string;
    liveRevision?: string;
    versionId?: number | null;
  };
  previewRoutes: StudioRoute[];
};
const GROUPS = {
  Colors: [
    'background',
    'surface',
    'text.color',
    'text.mutedColor',
    'accent',
    'link',
    'border.color',
    'outline.color',
    'status',
  ],
  Typography: ['font', 'text'],
  Layout: [
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'margin',
    'padding',
    'gap',
    'density',
    'layout',
    'visibility',
    'position',
    'overflow',
    'transform',
    'aspectRatio',
    'container',
    'section',
  ],
  Components: [
    'collection',
    'shell',
    'action',
    'card',
    'field',
    'filter',
    'tag',
    'icon',
    'media',
    'gallery',
    'pagination',
    'appearance',
    'skill',
    'record',
    'resume',
  ],
  Motion: ['motion', 'progress', 'sectionNav'],
  Advanced: ['opacity', 'border', 'shadow', 'outline', 'advanced'],
} as const;
const noInvalid = () => {};
function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function DesignStudio({ initial, previewRoutes }: DesignStudioProps) {
  const [editor, setEditor] = useState(() =>
    openEditor(initial.document, initial.revision, initial.recordId),
  );
  const [requestedSelection, setSelection] = useState<Selection>({
    kind: 'theme',
    id: initial.document.defaultThemeId,
    mode: 'dark',
  });
  const [pageId, setPageId] = useState(
    previewRoutes[0]?.pageId || initial.document.pages[0]?.id || 'home',
  );
  const [requestedThemeId, setThemeId] = useState(
      initial.document.defaultThemeId,
    ),
    [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [requestedBreakpoint, setBreakpoint] = useState(''),
    [states, setStates] = useState<State[]>([]),
    [width, setWidth] = useState(1440),
    [height, setHeight] = useState(900),
    [zoom, setZoom] = useState(0.6),
    [reduced, setReduced] = useState(false);
  const [group, setGroup] = useState<keyof typeof GROUPS>('Colors'),
    [search, setSearch] = useState(''),
    [property, setPropertyName] = useState('background.color');
  const [buffers, setBuffers] = useState<Record<string, Json>>({}),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [panel, setPanel] = useState<
    'compose' | 'themes' | 'fonts' | 'resources' | 'history' | 'transfer'
  >('themes');
  const [versions, setVersions] = useState<VersionRecord[]>([]),
    [media, setMedia] = useState<MediaRecord[]>([]),
    [importText, setImportText] = useState('');
  const [receipt, setReceipt] = useState(''),
    [previewStatus, setPreviewStatus] = useState(
      'Private preview not connected',
    ),
    [busy, setBusy] = useState(false);
  const [nodeKind, setNodeKind] = useState<NodeKind>('section'),
    [destination, setDestination] = useState('page:' + pageId),
    [themeName, setThemeName] = useState('');
  const [fontName, setFontName] = useState(''),
    [license, setLicense] = useState(''),
    [credit, setCredit] = useState(''),
    [file, setFile] = useState<File | null>(null);
  const [bpId, setBpId] = useState('tablet'),
    [bpWidth, setBpWidth] = useState('768');
  const [templateName, setTemplateName] = useState('');
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [mobilePanel, setMobilePanel] = useState<
    'library' | 'preview' | 'inspector'
  >('inspector');
  const frame = useRef<HTMLIFrameElement>(null),
    saving = useRef(false);
  const previewScroll = useRef<HTMLDivElement>(null);
  const [fitPreview, setFitPreview] = useState(true);
  useEffect(() => {
    if (!fitPreview || !previewScroll.current) return;
    const observer = new window.ResizeObserver((entries) => {
      const available = entries[0]?.contentRect.width;
      if (available > 0)
        setZoom(Math.max(0.1, Math.min(1, (available - 24) / width)));
    });
    observer.observe(previewScroll.current);
    return () => observer.disconnect();
  }, [fitPreview, width]);
  const d = editor.document;
  const { selection, themeId, breakpoint } = normalizeEditorContext(d, {
    selection: requestedSelection,
    themeId: requestedThemeId,
    breakpoint: requestedBreakpoint,
  });
  const context: Context = {
    selection,
    breakpoint: breakpoint || undefined,
    states,
  };
  const bufferKey = JSON.stringify([
    selection,
    breakpoint,
    [...states].sort(),
    property,
  ]);
  let own: Json | undefined;
  try {
    own = valuesAt(d, context)[property];
  } catch {}
  const effective = useMemo(() => {
    try {
      return resolveDesignBinding(d, {
        pageId,
        nodeId:
          selection.kind === 'node' || selection.kind === 'shared'
            ? selection.id
            : undefined,
        themeId,
        mode,
        width,
        states,
        reducedMotion: reduced,
      });
    } catch {
      return undefined;
    }
  }, [d, pageId, selection, themeId, mode, width, states, reduced]);
  const inspected = inspectValues(d, context, { pageId, themeId, mode, width });
  const editing = Object.hasOwn(buffers, bufferKey),
    draft = editing
      ? buffers[bufferKey]
      : ((own &&
        typeof own === 'object' &&
        !Array.isArray(own) &&
        '$token' in own
          ? inspected.values[property]
          : own) ??
        inspected.values[property] ??
        initialValue(PROPERTY_CONTROLS[property]));
  const issues: { message: string; path: string }[] = [];
  if (editing) literalProperties[property](draft, property, issues as never[]);
  const dirty = isDirty(editor),
    pending = Object.keys(buffers).length;
  const route =
    previewRoutes.find((r) => r.pageId === pageId) || previewRoutes[0];
  const previewUrl =
    receipt &&
    route &&
    route.path.startsWith('/') &&
    !route.path.startsWith('//')
      ? `/owner/preview${route.path === '/' ? '' : route.path}?receipt=${encodeURIComponent(receipt)}`
      : '';
  function apply(
    label: string,
    change: (doc: DesignDocument) => DesignDocument,
  ) {
    try {
      const next = commit(editor, change(editor.document), label);
      setEditor(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Change rejected');
    }
  }
  function mutate(label: string, change: (doc: DesignDocument) => void) {
    apply(label, (doc) => {
      const n = clone(doc);
      change(n);
      return assertValidDesign(n);
    });
  }
  function clearBuffer() {
    setBuffers((b) => {
      const n = { ...b };
      delete n[bufferKey];
      return n;
    });
  }
  async function save() {
    if (saving.current || pending) return;
    saving.current = true;
    const submitted = clone(editor.document);
    setEditor((s) => ({
      ...s,
      status: 'saving',
      message: 'Saving design draft…',
    }));
    try {
      const result = await saveDesign(
        editor.recordId,
        editor.revision,
        submitted,
      );
      setEditor((s) =>
        acknowledgeSave(s, submitted, result.revision, String(result.id)),
      );
      setNotice('Draft saved. Public design is unchanged.');
    } catch (e) {
      setEditor((s) =>
        saveFailure(
          s,
          e instanceof OwnerDesignError ? e.status : 0,
          e instanceof Error ? e.message : 'Save failed',
        ),
      );
    } finally {
      saving.current = false;
    }
  }
  async function privatePreview() {
    setBusy(true);
    setError('');
    try {
      const workspace = await ownerFetch<{
        publication: {
          revision: string;
          designVersionId: number;
          selections: { collection: string; versionId: number }[];
        } | null;
      }>('/api/owner/workspace');
      const saved = editor.recordId ? await readDesign(editor.recordId) : null;
      const versionId =
        saved?.versionId ||
        initial.versionId ||
        workspace.publication?.designVersionId;
      if (!versionId)
        throw Error(
          'Save a design draft first, or choose an exact design/content pair in Publishing.',
        );
      const input = {
        expectedRevision: workspace.publication?.revision ?? null,
        designVersionId: Number(versionId),
        selections: (workspace.publication?.selections ?? []).map((s) => ({
          collection: s.collection,
          versionId: Number(s.versionId),
        })),
      };
      const result = await ownerFetch<{ id: string }>('/api/owner/previews', {
        method: 'POST',
        body: JSON.stringify({ input }),
      });
      setReceipt(result.id);
      setPreviewStatus(
        'Loading authenticated route · selected content is pinned',
      );
      if (dirty)
        setNotice(
          'Preview uses your local design with pinned saved resources. Save and refresh the receipt after attaching new fonts or media.',
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Private preview failed');
    } finally {
      setBusy(false);
    }
  }
  function sendPreview() {
    if (!frame.current?.contentWindow || !receipt) return;
    frame.current.contentWindow.postMessage(
      {
        type: 'owner-design-preview',
        document: d,
        themeId,
        mode,
        states,
        nodeId: selection.kind === 'node' ? selection.id : undefined,
        reducedMotion: reduced,
      },
      window.location.origin,
    );
  }
  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => {
      frame.current?.contentWindow?.postMessage(
        {
          type: 'owner-design-preview',
          document: d,
          themeId,
          mode,
          states,
          nodeId: selection.kind === 'node' ? selection.id : undefined,
          reducedMotion: reduced,
        },
        window.location.origin,
      );
    }, 100);
    return () => clearTimeout(timer);
  }, [d, receipt, themeId, mode, states, selection, reduced]);
  useEffect(() => {
    function receive(e: MessageEvent) {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      if (e.data?.type === 'owner-design-preview-ready') sendPreview();
      if (
        e.data?.type === 'owner-design-preview-diagnostics' &&
        Array.isArray(e.data.warnings)
      )
        setPreviewWarnings(
          e.data.warnings
            .filter((x: unknown) => typeof x === 'string' && x.length < 400)
            .slice(0, 20),
        );
      if (e.data?.type === 'owner-design-preview-applied')
        setPreviewStatus(
          'Private route · last valid local design · pinned content',
        );
      if (
        e.data?.type === 'owner-design-preview-select' &&
        typeof e.data.nodeId === 'string' &&
        d.nodes.some((n) => n.id === e.data.nodeId)
      )
        setSelection({ kind: 'node', id: e.data.nodeId });
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  });
  useEffect(() => {
    if (!dirty && !pending) return;
    function leave(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty, pending]);
  async function catalog() {
    try {
      const result = await readMedia();
      setMedia(result.docs);
    } catch (e) {
      setError(String(e));
    }
  }
  const destinations: { value: string; label: string }[] = [
    ...d.pages.map((p) => ({ value: 'page:' + p.id, label: 'Page: ' + p.id })),
    ...d.templates.map((p) => ({
      value: 'template:' + p.id,
      label: 'Template: ' + p.id,
    })),
    ...d.nodes
      .filter((n) =>
        [
          'section',
          'container',
          'stack',
          'row',
          'grid',
          'split',
          'card',
          'header',
          'footer',
          'navigation',
          'disclosure',
          'dialog',
        ].includes(n.kind),
      )
      .map((n) => ({ value: 'node:' + n.id, label: 'Inside: ' + n.id })),
    ...(['header', 'footer', 'navigation'] as const).map((id) => ({
      value: 'shell:' + id,
      label: 'Shared shell: ' + id,
    })),
  ];
  const dest = (): Destination => {
    const [kind, id] = destination.split(':');
    return { kind, id } as Destination;
  };
  const properties = Object.keys(PROPERTY_CONTROLS).filter((k) =>
    search
      ? k.toLowerCase().includes(search.toLowerCase())
      : GROUPS[group].some(
          (prefix) => k === prefix || k.startsWith(prefix + '.'),
        ),
  );
  const selectedNode =
    selection.kind === 'node'
      ? d.nodes.find((n) => n.id === selection.id)
      : undefined;
  function tree(ids: string[], depth = 0): React.ReactNode {
    return ids.map((id) => {
      const n = d.nodes.find((n) => n.id === id);
      if (!n || depth > 32) return null;
      return (
        <li key={id}>
          <button
            type="button"
            className={
              selection.kind === 'node' && selection.id === id
                ? 'ds-selected'
                : ''
            }
            onClick={() => setSelection({ kind: 'node', id })}
          >
            <span>{n.kind}</span>
            <strong>{id}</strong>
            {n.scope.values.visibility === false && <small>Hidden</small>}
          </button>
          {n.children.length > 0 && <ul>{tree(n.children, depth + 1)}</ul>}
        </li>
      );
    });
  }
  return (
    <section className="design-studio" aria-label="Visual Design Studio">
      <header className="ds-top">
        <div>
          <p className="ds-eyebrow">PUBLIC APPEARANCE / PRIVATE WORKSPACE</p>
          <h1>Design Studio</h1>
          <p>Compose, refine, and preview your public site.</p>
        </div>
        <div className="ds-actions">
          <button
            type="button"
            disabled={!editor.past.length || busy || !!pending}
            onClick={() => setEditor(undo)}
          >
            Undo{editor.past.at(-1) ? ` · ${editor.past.at(-1)?.label}` : ''}
          </button>
          <button
            type="button"
            disabled={!editor.future.length || busy || !!pending}
            onClick={() => setEditor(redo)}
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() =>
              download(exportRecovery(d, buffers), `${d.id}-recovery.json`)
            }
          >
            Export recovery
          </button>
          <button
            className="ds-primary"
            type="button"
            disabled={
              editor.status === 'saving' ||
              busy ||
              !!pending ||
              editor.status === 'conflict' ||
              editor.status === 'expired'
            }
            onClick={save}
          >
            {editor.status === 'saving' ? 'Saving…' : 'Save draft →'}
          </button>
        </div>
      </header>
      <div className="ds-status" role="status">
        <span className={dirty || pending ? 'ds-dirty' : 'ds-saved'}>
          {dirty || pending ? 'Unsaved changes' : 'Saved checkpoint'}
        </span>
        <span>
          {editor.message ||
            `Loaded revision ${editor.revision || 'new draft'}`}{' '}
          {pending
            ? ` · ${pending} unapplied property buffers · preview shows last valid design · apply or discard buffers before structural or history changes`
            : ''}
        </span>
        <span>Live: {initial.liveRevision || 'not published'}</span>
      </div>
      {pending > 0 && (
        <details className="ds-buffer-list">
          <summary>Review unapplied field buffers ({pending})</summary>
          {Object.keys(buffers).map((key) => {
            const [selected, bp, active, prop] = JSON.parse(key) as [
              Selection,
              string,
              State[],
              string,
            ];
            return (
              <button
                type="button"
                key={key}
                onClick={() => {
                  setSelection(selected);
                  setBreakpoint(bp);
                  setStates(active);
                  setPropertyName(prop);
                }}
              >
                {selected.kind}
                {'id' in selected ? ` / ${selected.id}` : ''} · {bp || 'base'} ·{' '}
                {active.join('+') || 'rest'} · {prop}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() =>
              download(
                exportRecovery(d, buffers),
                `${d.id}-editing-recovery.json`,
              )
            }
          >
            Export recovery with unapplied buffers
          </button>
        </details>
      )}
      {(error || notice) && (
        <div
          className={error ? 'ds-error' : 'ds-notice'}
          role={error ? 'alert' : 'status'}
        >
          {error || notice}
          <button
            type="button"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {['conflict', 'expired', 'error'].includes(editor.status) && (
        <div className="ds-error" role="alert">
          <strong>
            {editor.status === 'conflict'
              ? 'Newer server revision exists.'
              : editor.status === 'expired'
                ? 'Owner session needs renewal.'
                : 'Draft could not be saved.'}
          </strong>
          <p>{editor.message} Local changes and field buffers are retained.</p>
          <div className="ds-actions">
            <button
              type="button"
              onClick={() =>
                download(exportRecovery(d, buffers), `${d.id}-unsaved.json`)
              }
            >
              Export local recovery
            </button>
            <a href="/admin/login" target="_blank" rel="noreferrer">
              Renew owner session
            </a>
            <button
              type="button"
              onClick={() =>
                setEditor((s) => ({
                  ...s,
                  status: 'idle',
                  message: 'Retry enabled; revision checks still apply.',
                }))
              }
            >
              Enable retry after resolving session
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const latest = await readDesign(editor.recordId);
                  setVersions((v) => [
                    { id: 'server-latest', createdAt: '', data: latest.data },
                    ...v.filter((x) => x.id !== 'server-latest'),
                  ]);
                  setPanel('history');
                  setNotice(
                    `Server revision ${latest.revision} loaded for comparison. Your local draft remains.`,
                  );
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Compare latest server draft
            </button>
            <button
              type="button"
              disabled={busy || !!pending}
              onClick={async () => {
                setBusy(true);
                try {
                  const copy = clone(d);
                  copy.id = uniqueId(d, 'recovered-design');
                  const r = await saveDesign('', '', copy);
                  setEditor((s) => ({
                    ...acknowledgeSave(s, copy, r.revision, String(r.id)),
                    document: copy,
                  }));
                  setNotice(
                    'Local recovery saved as a separate design draft. Original server draft is retained.',
                  );
                } catch (e) {
                  setError(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save local as a separate design draft
            </button>
          </div>
        </div>
      )}
      <nav className="ds-mobile-tabs" aria-label="Mobile Studio panel">
        {(['library', 'preview', 'inspector'] as const).map((p) => (
          <button
            type="button"
            key={p}
            aria-pressed={mobilePanel === p}
            onClick={() => setMobilePanel(p)}
          >
            {p === 'inspector'
              ? 'Controls'
              : p === 'library'
                ? 'Themes / layout'
                : 'Preview'}
          </button>
        ))}
      </nav>
      <div className="ds-workspace" data-mobile-panel={mobilePanel}>
        <aside className="ds-library" aria-label="Design library">
          <fieldset className="ds-library-body" disabled={!!pending}>
            <nav className="ds-tabs" aria-label="Studio library">
              {(
                [
                  'themes',
                  'compose',
                  'fonts',
                  'resources',
                  'history',
                  'transfer',
                ] as const
              ).map((p) => (
                <button
                  type="button"
                  key={p}
                  aria-pressed={panel === p}
                  onClick={() => setPanel(p)}
                >
                  {p}
                </button>
              ))}
            </nav>
            {panel === 'themes' && (
              <>
                <h2>Named themes</h2>
                <p>Light and dark palettes share a stable theme identity.</p>
                <div className="ds-theme-list">
                  {d.themes.map((t) => (
                    <button
                      type="button"
                      className={themeId === t.id ? 'ds-selected' : ''}
                      key={t.id}
                      onClick={() => {
                        if (!t.archived) setThemeId(t.id);
                        setSelection({ kind: 'theme', id: t.id, mode });
                      }}
                    >
                      <span
                        className="ds-swatch"
                        style={{
                          background:
                            typeof t.modes[mode].values['accent.color'] ===
                            'string'
                              ? String(t.modes[mode].values['accent.color'])
                              : '#d8a16b',
                        }}
                      />
                      <strong>{t.name}</strong>
                      <small>
                        {t.id === d.defaultThemeId
                          ? 'Default'
                          : t.archived
                            ? 'Archived'
                            : d.visitorThemeIds.includes(t.id)
                              ? 'Visitor choice'
                              : 'Owner only'}
                      </small>
                    </button>
                  ))}
                </div>
                <label>
                  Theme name
                  <input
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                  />
                </label>
                <div className="ds-actions">
                  <button
                    type="button"
                    onClick={() =>
                      apply('Create named theme', (doc) =>
                        editTheme(doc, themeId, 'create', themeName),
                      )
                    }
                  >
                    New theme
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apply('Duplicate theme', (doc) =>
                        editTheme(doc, themeId, 'duplicate', themeName),
                      )
                    }
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apply('Rename theme', (doc) =>
                        editTheme(
                          doc,
                          selection.kind === 'theme' ? selection.id : themeId,
                          'rename',
                          themeName,
                        ),
                      )
                    }
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apply('Set default theme', (doc) =>
                        editTheme(doc, themeId, 'default'),
                      )
                    }
                  >
                    Set default
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apply('Change visitor choices', (doc) =>
                        editTheme(doc, themeId, 'visitor'),
                      )
                    }
                  >
                    Toggle visitor choice
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apply('Archive / unarchive theme', (doc) =>
                        editTheme(
                          doc,
                          selection.kind === 'theme' ? selection.id : themeId,
                          'archive',
                        ),
                      )
                    }
                  >
                    Archive / unarchive
                  </button>
                </div>
                <label>
                  Owner default appearance
                  <select
                    value={d.defaultMode}
                    onChange={(e) =>
                      mutate('Set default appearance', (n) => {
                        n.defaultMode = e.target
                          .value as DesignDocument['defaultMode'];
                      })
                    }
                  >
                    <option>system</option>
                    <option>light</option>
                    <option>dark</option>
                  </select>
                </label>
                <h3>Design tokens</h3>
                <p>
                  Properties can reference named tokens. Literal overrides stay
                  literal.
                </p>
                <TokenManager document={d} mutate={mutate} />
              </>
            )}
            {panel === 'compose' && (
              <>
                <h2>Page composition</h2>
                <label>
                  Page
                  <select
                    value={pageId}
                    onChange={(e) => {
                      setPageId(e.target.value);
                      setDestination('page:' + e.target.value);
                    }}
                  >
                    {d.pages.map((p) => (
                      <option key={p.id}>{p.id}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'page', id: pageId })}
                >
                  Edit page properties
                </button>
                <ul className="ds-tree">
                  {tree(d.pages.find((p) => p.id === pageId)?.rootIds || [])}
                </ul>
                <h3>Shared shell</h3>
                {Object.entries(d.sharedShell).map(([slot, ids]) => (
                  <details key={slot} open>
                    <summary>{slot}</summary>
                    <ul className="ds-tree">{tree(ids)}</ul>
                  </details>
                ))}
                <h3>Templates / shared roles</h3>
                <label>
                  New template identifier
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    mutate('Create template', (doc) => {
                      doc.templates.push({
                        id: templateName,
                        scope: { values: {} },
                        rootIds: [],
                      });
                    })
                  }
                >
                  Create template
                </button>
                <label>
                  Page template
                  <select
                    value={
                      d.pages.find((p) => p.id === pageId)?.templateId || ''
                    }
                    onChange={(e) =>
                      mutate('Assign page template', (doc) => {
                        const p = doc.pages.find((p) => p.id === pageId)!;
                        if (e.target.value) p.templateId = e.target.value;
                        else delete p.templateId;
                      })
                    }
                  >
                    <option value="">No template</option>
                    {d.templates.map((t) => (
                      <option key={t.id}>{t.id}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Reusable scope
                  <select
                    value={
                      selection.kind === 'shared' ||
                      selection.kind === 'template'
                        ? `${selection.kind}:${selection.id}`
                        : ''
                    }
                    onChange={(e) => {
                      const [kind, id] = e.target.value.split(':');
                      if (id) setSelection({ kind, id } as Selection);
                    }}
                  >
                    <option value="">Choose shared role or template</option>
                    {d.templates.map((x) => (
                      <option key={'t' + x.id} value={'template:' + x.id}>
                        Template · {x.id}
                      </option>
                    ))}
                    {d.sharedComponents.map((x) => (
                      <option key={x.id} value={'shared:' + x.id}>
                        {x.kind} · {x.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Destination
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {destinations.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  New block
                  <select
                    value={nodeKind}
                    onChange={(e) => setNodeKind(e.target.value as NodeKind)}
                  >
                    {NODE_KINDS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    apply(`Add ${nodeKind}`, (doc) =>
                      addNode(doc, dest(), nodeKind),
                    )
                  }
                >
                  Add block
                </button>
                {selectedNode && (
                  <NodeActions
                    key={selectedNode.id}
                    document={d}
                    nodeId={selectedNode.id}
                    destination={dest()}
                    apply={apply}
                    mutate={mutate}
                    onRemoved={() => setSelection({ kind: 'page', id: pageId })}
                  />
                )}
                <h3>Responsive breakpoints</h3>
                {d.breakpoints.map((bp) => (
                  <div key={bp.id} className="ds-breakpoint">
                    <span>
                      {bp.id} · {bp.minWidth}px
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBpId(bp.id);
                        setBpWidth(String(bp.minWidth));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        apply(`Remove ${bp.id} and its overrides`, (doc) =>
                          editBreakpoint(doc, bp.id, undefined),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <label>
                  Breakpoint identifier
                  <input
                    value={bpId}
                    onChange={(e) => setBpId(e.target.value)}
                  />
                </label>
                <label>
                  Minimum width, px
                  <input
                    value={bpWidth}
                    inputMode="numeric"
                    onChange={(e) => setBpWidth(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    apply('Add / update breakpoint', (doc) =>
                      editBreakpoint(doc, bpId, Number(bpWidth)),
                    )
                  }
                >
                  Save breakpoint
                </button>
              </>
            )}
            {(panel === 'fonts' || panel === 'resources') && (
              <>
                <h2>
                  {panel === 'fonts' ? 'Font library' : 'Media resources'}
                </h2>
                <button type="button" onClick={catalog}>
                  Refresh authenticated catalog
                </button>
                <p>
                  Resources stay pinned to an exact version and checksum.
                  Uploads require licence and attribution.
                </p>
                <label>
                  Family / resource name
                  <input
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                  />
                </label>
                <label>
                  Licence
                  <input
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                  />
                </label>
                <label>
                  Attribution
                  <input
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                  />
                </label>
                <label>
                  File
                  <input
                    type="file"
                    accept={
                      panel === 'fonts'
                        ? '.woff2'
                        : 'image/png,image/jpeg,image/webp'
                    }
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="button"
                  disabled={!file || !license || !credit || busy}
                  onClick={async () => {
                    if (!file) return;
                    setBusy(true);
                    try {
                      await uploadMedia(file, {
                        alt: fontName,
                        license,
                        credit,
                        publicEligible: true,
                      });
                      await catalog();
                      setNotice(
                        'Upload validated by server. Select the catalog item and attach metadata below.',
                      );
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Upload and validate
                </button>
                <ResourceManager
                  document={d}
                  media={media}
                  kind={panel}
                  family={fontName}
                  mutate={mutate}
                />
              </>
            )}
            {panel === 'history' && (
              <>
                <h2>Saved revisions</h2>
                <p>
                  Restore creates a draft. Publishing remains a separate review.
                </p>
                <button
                  type="button"
                  disabled={!editor.recordId}
                  onClick={async () => {
                    try {
                      setVersions((await readVersions(editor.recordId)).docs);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Load revision history
                </button>
                {versions.map((v) => (
                  <VersionCard
                    key={v.id}
                    version={v}
                    local={d}
                    onLoad={() => {
                      if (v.id === 'server-latest') {
                        setError(
                          'Export or duplicate local recovery, then explicitly reload the server checkpoint.',
                        );
                        return;
                      }
                      setBusy(true);
                      restoreDesign(editor.recordId, editor.revision, v.id)
                        .then((r) => {
                          setEditor((s) => ({
                            ...openEditor(
                              r.data.data,
                              r.revision,
                              String(r.id),
                            ),
                            past: [
                              ...s.past,
                              {
                                document: s.document,
                                label: 'Restore saved revision',
                              },
                            ],
                          }));
                          setBuffers({});
                          setNotice(
                            'Selected historical version restored into a draft.',
                          );
                        })
                        .catch((e) =>
                          setEditor((s) =>
                            saveFailure(
                              s,
                              e instanceof OwnerDesignError ? e.status : 0,
                              String(e),
                            ),
                          ),
                        )
                        .finally(() => setBusy(false));
                    }}
                  />
                ))}
                <button
                  type="button"
                  disabled={!editor.recordId || busy}
                  onClick={async () => {
                    try {
                      download(
                        exportRecovery(d, buffers),
                        `${d.id}-before-reload.json`,
                      );
                      const r = await readDesign(editor.recordId);
                      setEditor(
                        openEditor(r.data.data, r.revision, String(r.id)),
                      );
                      setBuffers({});
                      setNotice(
                        'Local recovery exported before loading server checkpoint.',
                      );
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Export local recovery and reload server
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditor((s) =>
                      openEditor(s.saved, s.revision, s.recordId),
                    );
                    setBuffers({});
                  }}
                >
                  Discard local changes to saved checkpoint
                </button>
              </>
            )}
            {panel === 'transfer' && (
              <>
                <h2>Import / export</h2>
                <p>
                  Design packages contain structure and pinned resource
                  references. They exclude private content and credentials.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    download(exportDesign(d), `${d.id}-design.json`)
                  }
                >
                  Export full design
                </button>
                <button
                  type="button"
                  onClick={() => {
                    download(exportThemes(d), `${d.id}-themes.json`);
                  }}
                >
                  Export themes and tokens
                </button>
                <label>
                  Import package file
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 2_000_000) {
                          setError('Import exceeds 2 MB limit');
                          return;
                        }
                        setImportText(await f.text());
                      }
                    }}
                  />
                </label>
                <label>
                  Package input
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                </label>
                <ImportReview
                  text={importText}
                  current={d}
                  onImport={(candidate, recoveredBuffers) => {
                    apply(
                      'Import validated design checkpoint',
                      () => candidate,
                    );
                    setBuffers(recoveredBuffers || {});
                    setThemeId(candidate.defaultThemeId);
                    setSelection({ kind: 'site' });
                  }}
                />
              </>
            )}
          </fieldset>
        </aside>
        <main className="ds-canvas" aria-label="Private route preview">
          <div className="ds-canvas-toolbar">
            <label>
              Preview route
              <select
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              >
                {previewRoutes.map((r) => (
                  <option key={r.pageId} value={r.pageId}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="ds-actions">
              {[
                { name: 'Desktop', w: 1440, h: 900 },
                { name: 'Tablet', w: 768, h: 1024 },
                { name: 'Mobile', w: 390, h: 844 },
              ].map((device) => (
                <button
                  type="button"
                  key={device.name}
                  aria-pressed={width === device.w}
                  onClick={() => {
                    setWidth(device.w);
                    setHeight(device.h);
                    setZoom(device.w < 500 ? 1 : device.w < 1000 ? 0.75 : 0.6);
                  }}
                >
                  {device.name}
                </button>
              ))}
            </div>
          </div>
          <div className="ds-device-settings">
            <label>
              Width
              <input
                type="number"
                min={240}
                max={7680}
                value={width}
                onChange={(e) =>
                  setWidth(
                    Math.max(240, Math.min(7680, Number(e.target.value))),
                  )
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={240}
                max={4320}
                value={height}
                onChange={(e) =>
                  setHeight(
                    Math.max(240, Math.min(4320, Number(e.target.value))),
                  )
                }
              />
            </label>
            <label>
              Zoom
              <select
                value={zoom}
                onChange={(e) => {
                  setFitPreview(false);
                  setZoom(Number(e.target.value));
                }}
              >
                {![0.25, 0.5, 0.6, 0.75, 1].includes(zoom) && (
                  <option value={zoom}>{Math.round(zoom * 100)}% fit</option>
                )}
                {[0.25, 0.5, 0.6, 0.75, 1].map((z) => (
                  <option key={z} value={z}>
                    {z * 100}%
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preview mode
              <select
                value={mode}
                onChange={(e) => {
                  const next = e.target.value as 'light' | 'dark';
                  setMode(next);
                  if (selection.kind === 'theme')
                    setSelection({ ...selection, mode: next });
                }}
              >
                <option>dark</option>
                <option>light</option>
              </select>
            </label>
            <button
              type="button"
              aria-pressed={fitPreview}
              onClick={() => setFitPreview((v) => !v)}
            >
              Fit preview
            </button>
            <label className="ds-check">
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
              Reduced motion
            </label>
          </div>
          <div className="ds-preview-label">
            <span>
              Draft: {d.id} · {themeId}
            </span>
            <span>{previewStatus}</span>
          </div>
          <div className="ds-preview-scroll" ref={previewScroll}>
            {previewUrl ? (
              <div
                style={{
                  width: width * zoom,
                  height: height * zoom,
                  margin: '0 auto',
                }}
              >
                <iframe
                  ref={frame}
                  title={`Private ${route?.label} preview`}
                  src={previewUrl}
                  onLoad={sendPreview}
                  style={{
                    width,
                    height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    border: 0,
                  }}
                />
              </div>
            ) : (
              <div className="ds-preview-empty">
                <span className="ds-eyebrow">OWNER-AUTHORIZED PREVIEW</span>
                <h2>See your design on the actual route.</h2>
                <p>
                  Connect a private preview with an exact saved content
                  selection. Local valid design edits then update this frame.
                </p>
                <button
                  className="ds-primary"
                  type="button"
                  disabled={busy}
                  onClick={privatePreview}
                >
                  {busy ? 'Connecting…' : 'Connect private preview →'}
                </button>
                <Link href="/owner/publishing">
                  Review design and content selections
                </Link>
              </div>
            )}
          </div>
          <div className="ds-canvas-foot">
            <p>
              {previewUrl
                ? 'Preview edits stay private. Public routes use the active publication.'
                : 'A preview receipt pins content. Unsaved design edits remain local.'}
            </p>
            {previewUrl && (
              <button type="button" disabled={busy} onClick={privatePreview}>
                Refresh content selection
              </button>
            )}
          </div>
          {previewWarnings.length > 0 && (
            <details open>
              <summary>
                Preview layout / font warnings ({previewWarnings.length})
              </summary>
              {previewWarnings.map((warning, i) => (
                <p className="ds-error" key={i}>
                  {warning}
                </p>
              ))}
            </details>
          )}
        </main>
        <aside className="ds-inspector" aria-label="Visual property inspector">
          <div className="ds-inspector-title">
            <p className="ds-eyebrow">INSPECTOR</p>
            <h2>
              {selection.kind === 'site'
                ? 'Site defaults'
                : selection.kind === 'theme'
                  ? d.themes.find((t) => t.id === selection.id)?.name
                  : selection.id}
            </h2>
            <p>{selection.kind} scope</p>
          </div>
          <label>
            Editing scope
            <select
              value={JSON.stringify(selection)}
              onChange={(e) =>
                setSelection(JSON.parse(e.target.value) as Selection)
              }
            >
              <option value={JSON.stringify({ kind: 'site' })}>
                Site defaults
              </option>
              {d.themes.flatMap((t) =>
                (['base', 'light', 'dark'] as const).map((m) => (
                  <option
                    key={t.id + m}
                    value={JSON.stringify({ kind: 'theme', id: t.id, mode: m })}
                  >
                    {t.name} / {m}
                  </option>
                )),
              )}
              {d.pages.map((p) => (
                <option
                  key={p.id}
                  value={JSON.stringify({ kind: 'page', id: p.id })}
                >
                  Page / {p.id}
                </option>
              ))}
              {d.templates.map((p) => (
                <option
                  key={p.id}
                  value={JSON.stringify({ kind: 'template', id: p.id })}
                >
                  Template / {p.id}
                </option>
              ))}
              {d.sharedComponents.map((p) => (
                <option
                  key={p.id}
                  value={JSON.stringify({ kind: 'shared', id: p.id })}
                >
                  Shared / {p.id}
                </option>
              ))}
              {d.nodes.map((p) => (
                <option
                  key={p.id}
                  value={JSON.stringify({ kind: 'node', id: p.id })}
                >
                  Node / {p.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Breakpoint override
            <select
              value={breakpoint}
              onChange={(e) => setBreakpoint(e.target.value)}
            >
              <option value="">Base / all widths</option>
              {d.breakpoints.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.id} · {bp.minWidth}px+
                </option>
              ))}
            </select>
          </label>
          <details>
            <summary>State overrides · {states.join(' + ') || 'rest'}</summary>
            <fieldset className="ds-state-picker">
              <legend>State override and preview</legend>
              {STATES.map((s) => (
                <label className="ds-check" key={s}>
                  <input
                    type="checkbox"
                    checked={states.includes(s)}
                    onChange={(e) =>
                      setStates(
                        e.target.checked
                          ? [...states, s]
                          : states.filter((x) => x !== s),
                      )
                    }
                  />
                  {s}
                </label>
              ))}
            </fieldset>
          </details>
          <nav className="ds-tabs" aria-label="Property groups">
            {Object.keys(GROUPS).map((g) => (
              <button
                type="button"
                key={g}
                aria-pressed={g === group}
                onClick={() => setGroup(g as keyof typeof GROUPS)}
              >
                {g}
              </button>
            ))}
          </nav>
          <label>
            Find any supported property
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Color, width, motion…"
            />
          </label>
          <label>
            Property
            <select
              value={property}
              onChange={(e) => setPropertyName(e.target.value)}
            >
              {!properties.includes(property) && (
                <option value={property}>{property}</option>
              )}
              {properties.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <p className="ds-source">
            {own !== undefined
              ? 'Overridden here'
              : `Inherited · ${inspected.sources[property] || 'runtime default'}`}
          </p>
          {editing ? (
            <>
              <VisualValueEditor
                key={bufferKey}
                control={PROPERTY_CONTROLS[property]}
                value={draft}
                label={property}
                document={d}
                resourceNames={Object.fromEntries(
                  media.map((m) => [
                    String(m.id),
                    String(m.data.alt || m.data.filename || m.id),
                  ]),
                )}
                onInvalid={noInvalid}
                onChange={(v) => setBuffers((b) => ({ ...b, [bufferKey]: v }))}
              />
              {issues.length > 0 && (
                <ul className="ds-error" role="alert">
                  {issues.map((x, i) => (
                    <li key={i}>
                      {x.path}: {x.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className="ds-actions">
                <button
                  className="ds-primary"
                  type="button"
                  disabled={!!issues.length}
                  onClick={() => {
                    try {
                      const next = setProperty(d, context, property, draft);
                      setEditor((s) => commit(s, next, `Set ${property}`));
                      clearBuffer();
                      setError('');
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Apply property
                </button>
                <button type="button" onClick={clearBuffer}>
                  Discard field buffer
                </button>
              </div>
            </>
          ) : (
            <>
              <PropertySummary value={own ?? inspected.values[property]} />
              <button
                className="ds-primary"
                type="button"
                onClick={() =>
                  setBuffers((b) => ({ ...b, [bufferKey]: clone(draft) }))
                }
              >
                {own !== undefined ? 'Edit value' : 'Override inherited value'}
              </button>
            </>
          )}
          <label>
            Reference a compatible token
            <select
              value=""
              onChange={(e) => {
                if (e.target.value)
                  apply(`Link ${property} token`, (doc) =>
                    setProperty(doc, context, property, {
                      $token: e.target.value,
                    }),
                  );
              }}
            >
              <option value="">Choose named token</option>
              {Object.entries({
                ...d.tokens,
                ...d.themes.find((t) => t.id === themeId)?.tokens,
              })
                .filter(([, v]) => v.property === property)
                .map(([id]) => (
                  <option key={id}>{id}</option>
                ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              apply(`Use inherited ${property}`, (doc) =>
                setProperty(doc, context, property, undefined),
              );
              clearBuffer();
            }}
          >
            Use inherited · remove this override
          </button>
          <details>
            <summary>Reset scope</summary>
            <p>
              Removes{' '}
              {
                Object.keys(
                  (() => {
                    try {
                      return valuesAt(d, context);
                    } catch {
                      return {};
                    }
                  })(),
                ).length
              }{' '}
              local properties from this exact scope, breakpoint and state
              combination. Children remain. Undo is available.
            </p>
            <button
              type="button"
              onClick={() =>
                apply('Reset selected scope values', (doc) =>
                  resetScope(doc, context),
                )
              }
            >
              Reset these scope values
            </button>
          </details>
          <details>
            <summary>Validation and readability</summary>
            <p>
              Syntax, references, hierarchy and resource integrity are checked
              on every applied change. Review text contrast, overflow, missing
              glyphs and keyboard behavior in the real preview before
              publishing.
            </p>
            {effective?.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            {contrastWarnings(inspected.values).map((w, i) => (
              <p className="ds-error" key={'contrast' + i}>
                {w}
              </p>
            ))}
          </details>
          <p className="ds-meta">
            {Object.keys(PROPERTY_CONTROLS).length} supported properties · every
            property has typed controls.
          </p>
        </aside>
      </div>
    </section>
  );
}

function PropertySummary({ value }: { value: Json | undefined }) {
  if (value === undefined)
    return <p className="ds-value">Runtime default / unset</p>;
  if (typeof value !== 'object' || value === null)
    return <p className="ds-value">{String(value)}</p>;
  return (
    <dl className="ds-value">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
type Mutate = (label: string, change: (d: DesignDocument) => void) => void;
type Apply = (
  label: string,
  change: (d: DesignDocument) => DesignDocument,
) => void;
function NodeActions({
  document: d,
  nodeId,
  destination,
  apply,
  mutate,
  onRemoved,
}: {
  document: DesignDocument;
  nodeId: string;
  destination: Destination;
  apply: Apply;
  mutate: Mutate;
  onRemoved: () => void;
}) {
  const n = d.nodes.find((x) => x.id === nodeId)!;
  const [index, setIndex] = useState('0'),
    [collection, setCollection] = useState(
      n.contentRef?.collection || 'projects',
    ),
    [record, setRecord] = useState(n.contentRef?.id || ''),
    [page, setPage] = useState(n.target?.pageId || d.pages[0]?.id || ''),
    [target, setTarget] = useState(n.target?.nodeId || '');
  return (
    <div className="ds-node-actions">
      <h3>Selected: {nodeId}</h3>
      <div className="ds-actions">
        <button
          type="button"
          onClick={() =>
            apply('Toggle block visibility', (doc) =>
              setProperty(
                doc,
                { selection: { kind: 'node', id: nodeId }, states: [] },
                'visibility',
                n.scope.values.visibility === false,
              ),
            )
          }
        >
          {n.scope.values.visibility === false ? 'Show' : 'Hide'}
        </button>
        <button
          type="button"
          onClick={() =>
            apply('Duplicate block', (doc) =>
              duplicateNode(doc, nodeId, destination),
            )
          }
        >
          Duplicate into destination
        </button>
      </div>
      <label>
        Move to index (0 is first)
        <input
          value={index}
          inputMode="numeric"
          onChange={(e) => setIndex(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() =>
          apply('Move block', (doc) => {
            if (!Number.isInteger(Number(index)))
              throw Error('Enter an integer position');
            return moveNode(doc, nodeId, destination, Number(index));
          })
        }
      >
        Move to destination
      </button>
      <details>
        <summary>Remove block and descendants</summary>
        <p>
          References are checked. Invalid deletions are blocked. Content records
          are retained.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              const next = removeNode(d, nodeId);
              apply('Remove block', () => next);
              onRemoved();
            } catch (e) {
              apply('Remove block', () => {
                throw e;
              });
            }
          }}
        >
          Confirm removal
        </button>
      </details>
      <label>
        Shared component role
        <select
          value={n.componentId || ''}
          onChange={(e) =>
            mutate('Set shared role', (doc) => {
              const node = doc.nodes.find((x) => x.id === nodeId)!;
              if (e.target.value) node.componentId = e.target.value;
              else delete node.componentId;
            })
          }
        >
          <option value="">Detached instance</option>
          {d.sharedComponents
            .filter((c) => c.kind === n.kind)
            .map((c) => (
              <option key={c.id}>{c.id}</option>
            ))}
        </select>
      </label>
      {n.componentId && (
        <button
          type="button"
          onClick={() =>
            apply('Detach shared role with copied overrides', (doc) =>
              detachNodeRole(doc, nodeId),
            )
          }
        >
          Detach role and retain copied presentation
        </button>
      )}
      <h4>Content binding</h4>
      <label>
        Collection
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          {[
            'profile',
            'projects',
            'posts',
            'experiences',
            'education',
            'skills',
            'professional-sections',
            'media',
          ].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Record ID
        <input value={record} onChange={(e) => setRecord(e.target.value)} />
      </label>
      <button
        type="button"
        onClick={() =>
          mutate('Bind content record', (doc) => {
            doc.nodes.find((x) => x.id === nodeId)!.contentRef = {
              collection,
              id: record,
            };
          })
        }
      >
        Bind record
      </button>
      <button
        type="button"
        onClick={() =>
          mutate('Clear content binding', (doc) => {
            delete doc.nodes.find((x) => x.id === nodeId)!.contentRef;
          })
        }
      >
        Clear binding
      </button>
      <h4>Internal action target</h4>
      <label>
        Target page
        <select value={page} onChange={(e) => setPage(e.target.value)}>
          {d.pages.map((p) => (
            <option key={p.id}>{p.id}</option>
          ))}
        </select>
      </label>
      <label>
        Target node (optional)
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Page start</option>
          {d.nodes.map((x) => (
            <option key={x.id}>{x.id}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() =>
          mutate('Set internal target', (doc) => {
            doc.nodes.find((x) => x.id === nodeId)!.target = {
              pageId: page,
              ...(target ? { nodeId: target } : {}),
            };
          })
        }
      >
        Set target
      </button>
    </div>
  );
}
function TokenManager({
  document: d,
  mutate,
}: {
  document: DesignDocument;
  mutate: Mutate;
}) {
  const [id, setId] = useState(''),
    [property, setProperty] = useState('accent.color'),
    [value, setValue] = useState<Json>('#d8a16b');
  const [tokenTheme, setTokenTheme] = useState('');
  const tokens = tokenTheme
    ? d.themes.find((t) => t.id === tokenTheme)?.tokens || {}
    : d.tokens;
  function tokenMap(doc: DesignDocument) {
    if (!tokenTheme) return doc.tokens;
    const theme = doc.themes.find((t) => t.id === tokenTheme);
    if (!theme) throw Error('Unknown token theme');
    return (theme.tokens ??= {});
  }
  return (
    <details>
      <summary>Manage named tokens ({Object.keys(tokens).length})</summary>
      <label>
        Token scope
        <select
          value={tokenTheme}
          onChange={(e) => setTokenTheme(e.target.value)}
        >
          <option value="">Site tokens</option>
          {d.themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {Object.entries(tokens).map(([key, t]) => (
        <div className="ds-list-item" key={key}>
          <button
            type="button"
            onClick={() => {
              setId(key);
              setProperty(t.property);
              setValue(t.value);
            }}
          >
            {key} · {t.property}
          </button>
          <button
            type="button"
            onClick={() =>
              mutate('Remove token', (doc) => {
                delete tokenMap(doc)[key];
              })
            }
          >
            Remove token
          </button>
        </div>
      ))}
      <label>
        Token name
        <input value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <label>
        Token property
        <select
          value={property}
          onChange={(e) => {
            setProperty(e.target.value);
            setValue(initialValue(PROPERTY_CONTROLS[e.target.value]));
          }}
        >
          {Object.keys(PROPERTY_CONTROLS).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <VisualValueEditor
        key={property + id}
        label="Token value"
        document={d}
        control={PROPERTY_CONTROLS[property]}
        value={value}
        onChange={setValue}
        onInvalid={noInvalid}
      />
      <button
        type="button"
        onClick={() =>
          mutate('Save named token', (doc) => {
            tokenMap(doc)[id] = { property, value };
          })
        }
      >
        Save token
      </button>
    </details>
  );
}
function ImportReview({
  text,
  current,
  onImport,
}: {
  text: string;
  current: DesignDocument;
  onImport: (d: DesignDocument, buffers?: Record<string, Json>) => void;
}) {
  const result = useMemo(() => validateImport(text, current), [text, current]);
  if (!text) return null;
  return (
    <div>
      {result.document ? (
        <>
          <p>
            Compatible package · {result.document.themes.length} themes ·{' '}
            {result.document.nodes.length} nodes ·{' '}
            {result.document.fonts.length} fonts.
          </p>
          <p>
            {
              result.document.nodes.filter((n) =>
                current.nodes.some((x) => x.id === n.id),
              ).length
            }{' '}
            colliding node IDs. Replace the local design at this checkpoint, or
            keep a separate copy with a new document identity. Live remains
            unchanged.
          </p>
          <button
            type="button"
            onClick={() => onImport(result.document!, result.buffers)}
          >
            {result.kind === 'themes'
              ? 'Apply imported palettes, tokens, fonts and breakpoints; keep composition'
              : 'Replace local design with imported checkpoint'}
          </button>
          <button
            type="button"
            onClick={() => {
              const d = clone(result.document!);
              d.id = uniqueId(current, 'imported-design');
              onImport(d, result.buffers);
            }}
          >
            Keep imported design as separate identity
          </button>
        </>
      ) : (
        <ul role="alert" className="ds-error">
          {result.errors.map((e, i) => (
            <li key={i}>
              {e.path}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function VersionCard({
  version: v,
  local,
  onLoad,
}: {
  version: VersionRecord;
  local: DesignDocument;
  onLoad: () => void;
}) {
  const candidate = v.data?.data;
  return (
    <details>
      <summary>
        {v.id} · {v.createdAt || 'server checkpoint'}
      </summary>
      <p>
        {candidate
          ? `${candidate.nodes?.length || 0} nodes / ${candidate.themes?.length || 0} themes · ${JSON.stringify(candidate) === JSON.stringify(local) ? 'matches local' : 'differs from local'}`
          : 'Version data unavailable'}
      </p>
      <button
        type="button"
        onClick={() =>
          candidate &&
          download(exportDesign(candidate), `${v.id}-comparison.json`)
        }
      >
        Export for comparison
      </button>
      <p>
        Restoring replaces current local editing state and creates a server
        draft. Export local recovery first if needed.
      </p>
      <button type="button" onClick={onLoad}>
        Restore this exact version into draft
      </button>
    </details>
  );
}
function ResourceManager({
  document: d,
  media,
  kind,
  family,
  mutate,
}: {
  document: DesignDocument;
  media: MediaRecord[];
  kind: 'fonts' | 'resources';
  family: string;
  mutate: Mutate;
}) {
  const [selected, setSelected] = useState(''),
    [style, setStyle] = useState<Font['style']>('normal'),
    [min, setMin] = useState('400'),
    [max, setMax] = useState('400'),
    [axes, setAxes] = useState<Json>([]),
    [fallbacks, setFallbacks] = useState<Json>(['sans-serif']);
  const entries = media.filter((m) =>
    kind === 'fonts' ? m.data.kind === 'font' : m.data.kind !== 'font',
  );
  return (
    <div>
      <label>
        Catalog asset
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose exact catalog entry</option>
          {entries.map((m) => (
            <option key={m.id} value={m.id}>
              {String(m.data.alt || m.data.filename || m.id)} ·{' '}
              {String(m.data.resourceVersion || 'unversioned')}
            </option>
          ))}
        </select>
      </label>
      {kind === 'fonts' && (
        <>
          <label>
            Face style
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as Font['style'])}
            >
              <option>normal</option>
              <option>italic</option>
              <option>oblique</option>
            </select>
          </label>
          <label>
            Weight minimum
            <input value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
          <label>
            Weight maximum
            <input value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
          <VisualValueEditor
            label="Variable axes"
            document={d}
            control={{
              kind: 'array',
              min: 0,
              max: 64,
              item: {
                kind: 'object',
                required: {
                  tag: { kind: 'id' },
                  min: { kind: 'number', min: -1e7, max: 1e7, integer: false },
                  max: { kind: 'number', min: -1e7, max: 1e7, integer: false },
                },
                optional: {},
              },
            }}
            value={axes}
            onChange={setAxes}
            onInvalid={noInvalid}
          />
          <VisualValueEditor
            label="Fallback families"
            document={d}
            control={{
              kind: 'array',
              min: 0,
              max: 16,
              item: {
                kind: 'union',
                options: [
                  {
                    kind: 'choice',
                    options: [
                      'serif',
                      'sans-serif',
                      'monospace',
                      'system-ui',
                      'cursive',
                      'fantasy',
                    ],
                  },
                  {
                    kind: 'object',
                    required: { fontId: { kind: 'id' } },
                    optional: {},
                  },
                ],
              },
            }}
            value={fallbacks}
            onChange={setFallbacks}
            onInvalid={noInvalid}
          />
        </>
      )}
      <button
        type="button"
        disabled={!selected}
        onClick={() =>
          mutate('Attach immutable resource', (doc) => {
            const media = entries.find((x) => String(x.id) === selected)!;
            const m = media.data;
            const base = {
              id: String(media.id),
              version: String(m.resourceVersion),
              sha256: String(m.sha256),
              rights: {
                license: String(m.license || ''),
                attribution: String(m.credit || ''),
                redistributable: m.publicEligible === true,
              },
            };
            if (kind === 'fonts') {
              const font: Font = {
                ...base,
                family: family || String(m.alt || ''),
                style,
                weight: { min: Number(min), max: Number(max) },
                axes: axes as Font['axes'],
                fallbacks: fallbacks as Font['fallbacks'],
              };
              doc.fonts = doc.fonts.filter((f) => f.id !== font.id);
              doc.fonts.push(font);
            } else {
              const resource = {
                ...base,
                kind: String(
                  m.kind,
                ) as DesignDocument['assets'][number]['kind'],
              };
              doc.assets = doc.assets.filter((a) => a.id !== resource.id);
              doc.assets.push(resource);
            }
          })
        }
      >
        Attach / update exact resource
      </button>
      {(kind === 'fonts' ? d.fonts : d.assets).map((r) => (
        <div key={r.id} className="ds-list-item">
          <strong>
            {'family' in r
              ? r.family
              : String(
                  media.find((m) => String(m.id) === r.id)?.data.alt || r.kind,
                )}{' '}
            · {r.id}
          </strong>
          <p>
            {r.version} · {r.sha256.slice(0, 12)}…
          </p>
          <p>
            {r.rights.license} · {r.rights.attribution}
          </p>
          <button
            type="button"
            onClick={() =>
              mutate('Remove resource if unreferenced', (doc) => {
                if (kind === 'fonts')
                  doc.fonts = doc.fonts.filter((x) => x.id !== r.id);
                else doc.assets = doc.assets.filter((x) => x.id !== r.id);
              })
            }
          >
            Remove if unreferenced
          </button>
        </div>
      ))}
    </div>
  );
}
