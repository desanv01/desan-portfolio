'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { associationDefaults } from './association-context';
import { useEffect, useState } from 'react';
import {
  ownerApi,
  ownerPages,
  OwnerApiError,
  downloadJson,
  type OwnerCollection,
  type OwnerRecord,
} from './client';
import { editableData, RecordFields } from './record-fields';
import { OwnerHeading } from './owner-shell';
import { SkillMerge } from './skill-merge';

export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest('a');
      if (
        !link ||
        link.target === '_blank' ||
        link.href === window.location.href ||
        link.getAttribute('href')?.startsWith('#')
      )
        return;
      if (
        !window.confirm(
          'Leave this draft? Unsaved edits will be lost. Export or save first to keep them.',
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigate, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', navigate, true);
    };
  }, [dirty]);
}

export function RecordEditor({
  collection,
  id,
}: {
  collection: OwnerCollection;
  id: string;
}) {
  const context = useSearchParams().get('context');
  const [record, setRecord] = useState<OwnerRecord | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [baseline, setBaseline] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);
  const [versions, setVersions] = useState<
    { id: number; createdAt: string; data: Record<string, unknown> }[]
  >([]);
  const [compare, setCompare] = useState<Record<string, unknown> | null>(null);
  const dirty = baseline !== '' && JSON.stringify(draft) !== baseline;
  useUnsavedGuard(dirty);
  function accept(next: OwnerRecord) {
    setRecord(next);
    const data = editableData(next.data, collection.fields);
    setDraft(data);
    setBaseline(JSON.stringify(data));
    setConflict(false);
  }
  useEffect(() => {
    let stopped = false;
    (async () => {
      setLoading(true);
      if (id === 'new') {
        const initial = {
          title: '',
          slug: `draft-${crypto.randomUUID().slice(0, 8)}`,
          sourceKey: `owner-${crypto.randomUUID()}`,
          visible: false,
          sortOrder: 0,
          ...associationDefaults(collection.slug, context),
        };
        if (!stopped) {
          setDraft(initial);
          setBaseline(JSON.stringify(initial));
        }
      } else {
        const next = await ownerApi<OwnerRecord>(
          `/api/owner/records/${collection.slug}/${id}`,
        );
        if (!stopped) accept(next);
        const history = await ownerPages<(typeof versions)[number]>(
          `/api/owner/records/${collection.slug}/${id}/versions`,
        );
        if (!stopped) setVersions(history);
      }
      if (!stopped) setLoading(false);
    })().catch((failure) => {
      if (!stopped) {
        setError(failure.message);
        setLoading(false);
      }
    });
    return () => {
      stopped = true;
    }; /* Initial loaded record owns the editing checkpoint. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.slug, id, context]);
  async function save() {
    const submitted = draft;
    setBusy(true);
    setError('');
    setFieldErrors([]);
    setUnauthorized(false);
    setStatus('');
    try {
      const next = await ownerApi<OwnerRecord>(
        `/api/owner/records/${collection.slug}${record ? `/${record.id}` : ''}`,
        {
          method: record ? 'PATCH' : 'POST',
          body: JSON.stringify({
            data: editableData(submitted, collection.fields),
            ...(record ? { expectedRevision: record.revision } : {}),
          }),
        },
      );
      const saved = editableData(next.data, collection.fields);
      setRecord(next);
      setBaseline(JSON.stringify(saved));
      setDraft((current) =>
        JSON.stringify(current) === JSON.stringify(submitted) ? saved : current,
      );
      setConflict(false);
      setStatus('Draft saved. Live publication is unchanged.');
      if (!record)
        window.history.replaceState(
          null,
          '',
          `/owner/content/${collection.slug}/${next.id}`,
        );
      const history = await ownerPages<(typeof versions)[number]>(
        `/api/owner/records/${collection.slug}/${next.id}/versions`,
      );
      setVersions(history);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Save failed. Edits retained.',
      );
      setConflict(failure instanceof OwnerApiError && failure.status === 409);
      setFieldErrors(failure instanceof OwnerApiError ? failure.fields : []);
      setUnauthorized(
        failure instanceof OwnerApiError && [401, 403].includes(failure.status),
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Loading private draft…</p>;
  return (
    <>
      <OwnerHeading
        eyebrow="Owner workspace / draft"
        title={
          record
            ? String(draft.title || collection.label)
            : `New ${collection.label}`
        }
        description="Edit privately, save a version, then review it in Publishing."
        actions={
          <Link
            className="owner-button"
            href={`/owner/content/${collection.slug}`}
          >
            ← All records
          </Link>
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="owner-editor-grid">
          <div>
            <section className="owner-panel">
              <h2>Record details</h2>
              {collection.slug === 'site-settings' && (
                <p>
                  Arrange, add and hide page sections in{' '}
                  <Link href="/owner/design">Design Studio</Link>. Section order
                  is saved with the selected design version.
                </p>
              )}
              <RecordFields
                fields={collection.fields.filter(
                  (field) =>
                    collection.slug !== 'site-settings' ||
                    field.name !== 'sectionOrder',
                )}
                data={draft}
                onChange={setDraft}
              />
            </section>
          </div>
          <aside>
            {collection.slug === 'skills' && record && (
              <SkillMerge
                source={record}
                disabled={dirty || busy}
                onMerged={async () => {
                  accept(
                    await ownerApi<OwnerRecord>(
                      `/api/owner/records/skills/${record.id}`,
                    ),
                  );
                  setVersions(
                    await ownerPages<(typeof versions)[number]>(
                      `/api/owner/records/skills/${record.id}/versions`,
                    ),
                  );
                  setStatus(
                    'Skill merged into the canonical draft. Review publication separately.',
                  );
                }}
              />
            )}
            <section className="owner-panel">
              <h2>Draft & live</h2>
              <p className="owner-status">
                {dirty
                  ? 'Unsaved changes'
                  : record
                    ? 'Saved draft'
                    : 'New draft'}
              </p>
              <p className="owner-muted">
                Public pages use an exact selected version. Editing this draft
                never changes that selection.
              </p>
              <Link className="owner-button" href="/owner/publishing">
                Review publication →
              </Link>
            </section>
            {[
              'experiences',
              'education',
              'projects',
              'skills',
              'professional-sections',
            ].includes(collection.slug) &&
              record && (
                <section className="owner-panel">
                  <h2>Associations</h2>
                  <p>
                    Manage the same skill and project relationships from either
                    endpoint. Select the exact record and role, and preserve
                    source context.
                  </p>
                  <Link
                    className="owner-button"
                    href={`/owner/content/associations?context=${encodeURIComponent(collection.slug + ':' + (record?.id || ''))}`}
                  >
                    Skill associations →
                  </Link>
                  <p>
                    <Link
                      href={`/owner/content/context-links?context=${encodeURIComponent(collection.slug + ':' + record.id)}`}
                    >
                      Project context links →
                    </Link>
                  </p>
                </section>
              )}
            <section className="owner-panel">
              <h2>Saved versions</h2>
              <div className="owner-history">
                {versions.length ? (
                  versions.map((version) => (
                    <div key={version.id} className="owner-row">
                      <span>
                        <strong>Version {version.id}</strong>
                        <small className="owner-row-meta">
                          {new Date(version.createdAt).toLocaleString()}
                        </small>
                      </span>
                      <div className="owner-actions">
                        <button
                          type="button"
                          onClick={() => setCompare(version.data)}
                        >
                          Compare
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (
                              !record ||
                              !window.confirm(
                                'Restore this saved version as a new draft? Live stays unchanged.',
                              )
                            )
                              return;
                            setBusy(true);
                            try {
                              const next = await ownerApi<OwnerRecord>(
                                `/api/owner/records/${collection.slug}/${record.id}/restore`,
                                {
                                  method: 'POST',
                                  body: JSON.stringify({
                                    expectedRevision: record.revision,
                                    versionId: version.id,
                                  }),
                                },
                              );
                              accept(next);
                              setVersions(
                                await ownerPages<(typeof versions)[number]>(
                                  `/api/owner/records/${collection.slug}/${next.id}/versions`,
                                ),
                              );
                              setStatus('Version restored as a draft.');
                            } catch (failure) {
                              setError((failure as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="owner-muted">Saved versions appear here.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
        {compare && (
          <section className="owner-panel">
            <h2>Saved version comparison</h2>
            <p>Compare before restoring; your current edits remain intact.</p>
            <div className="owner-grid">
              <div>
                <h3>Current draft</h3>
                <pre className="owner-json-preview">
                  {JSON.stringify(draft, null, 2)}
                </pre>
              </div>
              <div>
                <h3>Selected saved version</h3>
                <pre className="owner-json-preview">
                  {JSON.stringify(
                    editableData(compare, collection.fields),
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
            <button type="button" onClick={() => setCompare(null)}>
              Close comparison
            </button>
          </section>
        )}
        <section className="owner-panel">
          <h2>Recover a local draft</h2>
          <p>
            Load a previously exported draft for this collection into this
            editor. Review the fields, then save when ready.
          </p>
          <label className="owner-field">
            <span className="owner-label">Local draft export</span>
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 3 * 1024 * 1024)
                    throw new Error('Draft file exceeds 3 MiB.');
                  const restored = JSON.parse(await file.text());
                  if (
                    restored.collection !== collection.slug ||
                    !restored.data ||
                    typeof restored.data !== 'object' ||
                    Array.isArray(restored.data)
                  )
                    throw new Error(
                      'Choose a draft export for this collection.',
                    );
                  if (
                    !window.confirm(
                      'Replace the editor fields with this local draft? Current unsaved edits will be replaced.',
                    )
                  )
                    return;
                  setDraft(editableData(restored.data, collection.fields));
                  setStatus(
                    'Local draft loaded for review. Nothing has been saved or published.',
                  );
                } catch (failure) {
                  setError((failure as Error).message);
                }
                event.target.value = '';
              }}
            />
          </label>
        </section>
        {error && (
          <div className="owner-notice" data-tone="error" role="alert">
            {error}{' '}
            {unauthorized && (
              <Link href="/owner/login" target="_blank">
                Sign in again
              </Link>
            )}
            {fieldErrors.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() =>
                  document
                    .querySelector<HTMLElement>(
                      `[data-field-path="${CSS.escape('record.' + path)}"] input, [data-field-path="${CSS.escape('record.' + path)}"] select`,
                    )
                    ?.focus()
                }
              >
                Review {path.split('.').at(-1)}
              </button>
            ))}
            {conflict && record && (
              <p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const current = await ownerApi<OwnerRecord>(
                        `/api/owner/records/${collection.slug}/${record.id}`,
                      );
                      setCompare(current.data);
                    } catch (failure) {
                      setError((failure as Error).message);
                    }
                  }}
                >
                  Compare latest
                </button>{' '}
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Discard unsaved local changes and load the latest draft?',
                      )
                    )
                      try {
                        accept(
                          await ownerApi<OwnerRecord>(
                            `/api/owner/records/${collection.slug}/${record.id}`,
                          ),
                        );
                        setVersions(
                          await ownerPages<(typeof versions)[number]>(
                            `/api/owner/records/${collection.slug}/${record.id}/versions`,
                          ),
                        );
                      } catch (failure) {
                        setError((failure as Error).message);
                      }
                  }}
                >
                  Reload latest
                </button>
              </p>
            )}
          </div>
        )}
        {status && (
          <p className="owner-notice" data-tone="success" role="status">
            {status}
          </p>
        )}
        <div className="owner-savebar">
          <span className="owner-status">
            {busy
              ? 'Saving…'
              : dirty
                ? '● Unsaved changes'
                : '○ Draft checkpoint'}
          </span>
          <div className="owner-actions">
            <button
              type="button"
              onClick={() =>
                downloadJson(`desan-${collection.slug}-draft.json`, {
                  collection: collection.slug,
                  data: draft,
                  expectedRevision: record?.revision,
                })
              }
            >
              Export local draft
            </button>
            <button className="owner-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
