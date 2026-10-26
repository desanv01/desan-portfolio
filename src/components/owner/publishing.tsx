'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ownerApi,
  ownerPages,
  downloadJson,
  type OwnerRecord,
  type OwnerRecordPage,
  type OwnerWorkspaceData,
} from './client';
import type { PublicationInput } from '@/cms/publication';
import type { Schedule } from '@/owner/contracts';
import { OwnerHeading } from './owner-shell';
import { RecoveryImport } from './recovery-import';

type Selected = {
  collection: string;
  versionId: number;
  recordId?: string | number;
  title?: string;
};
type Published = {
  id: string | number;
  revision: string;
  publishedAt?: string;
  designVersionId: number;
  selections: Selected[];
};
type Choice = { collection: string; record: OwnerRecord };

function VersionPicker({
  collection,
  record,
  value,
  onChange,
}: {
  collection: string;
  record: OwnerRecord;
  value: number;
  onChange: (id: number) => void;
}) {
  const [versions, setVersions] = useState<{ id: number; createdAt: string }[]>(
    [],
  );
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      const output: { id: number; createdAt: string }[] = [];
      let page = 1;
      let total = 1;
      do {
        const data = await ownerApi<{
          docs: typeof output;
          totalPages: number;
        }>(
          `/api/owner/records/${collection}/${record.id}/versions?page=${page}`,
        );
        output.push(...data.docs);
        total = data.totalPages;
        page++;
      } while (page <= total);
      if (active) setVersions(output);
    })().catch(() => {
      if (active) setError('History unavailable; current selection retained.');
    });
    return () => {
      active = false;
    };
  }, [collection, record.id]);
  return (
    <>
      <select
        aria-label={`Saved version of ${String(record.data.title || record.id)}`}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {value && !versions.some((v) => v.id === value) && (
          <option value={value}>Selected version {value}</option>
        )}
        {versions.map((v) => (
          <option value={v.id} key={v.id}>
            Version {v.id} · {new Date(v.createdAt).toLocaleString()}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </>
  );
}

export function Publishing({
  workspace,
  onRefresh,
}: {
  workspace: OwnerWorkspaceData;
  onRefresh: () => Promise<void>;
}) {
  const [choices, setChoices] = useState<Choice[]>([]),
    [selected, setSelected] = useState<Selected[]>(
      (workspace.publication?.selections || []) as Selected[],
    ),
    [designVersion, setDesignVersion] = useState(
      workspace.publication?.designVersionId || 0,
    ),
    [designRecordId, setDesignRecordId] = useState(
      String(workspace.publication?.designRecordId || ''),
    ),
    [expected, setExpected] = useState(workspace.publication?.revision || null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState(''),
    [previewed, setPreviewed] = useState(''),
    [when, setWhen] = useState(''),
    [jobs, setJobs] = useState<Schedule[]>([]),
    [history, setHistory] = useState<Published[]>([]),
    [scheduler, setScheduler] = useState<{
      running: boolean;
      lastSeenAt?: string;
    } | null>(null),
    [refresh, setRefresh] = useState(0),
    [query, setQuery] = useState('');
  const input: PublicationInput = {
    expectedRevision: expected,
    designVersionId: designVersion,
    selections: selected.map(({ collection, versionId }) => ({
      collection,
      versionId,
    })),
  };
  const fingerprint = JSON.stringify(input);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRefresh((value) => value + 1),
      15000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      const output: Choice[] = [];
      for (const collection of workspace.collections.filter(
        (item) => item.slug !== 'media',
      )) {
        let page = 1,
          total = 1;
        do {
          const data = await ownerApi<OwnerRecordPage>(
            `/api/owner/records/${collection.slug}?page=${page}&limit=100`,
          );
          output.push(
            ...data.docs.map((record) => ({
              collection: collection.slug,
              record,
            })),
          );
          total = data.totalPages;
          page++;
        } while (page <= total);
      }
      if (active) setChoices(output);
    })().catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => {
      active = false;
    };
  }, [workspace.collections]);
  useEffect(() => {
    let active = true;
    Promise.all([
      ownerApi<{ scheduler?: typeof scheduler }>('/api/owner/schedules'),
      ownerPages<Published>('/api/owner/publications'),
      ownerPages<Schedule>('/api/owner/schedules'),
    ])
      .then(([s, h, jobs]) => {
        if (active) {
          setJobs(jobs);
          setScheduler(s.scheduler || null);
          setHistory(h);
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  async function action(run: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await run();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function afterPublish(message: string) {
    const current = await ownerApi<OwnerWorkspaceData>('/api/owner/workspace');
    setExpected(current.publication?.revision || null);
    setSelected((current.publication?.selections || []) as Selected[]);
    setDesignVersion(current.publication?.designVersionId || designVersion);
    setDesignRecordId(
      String(current.publication?.designRecordId || designRecordId),
    );
    setReceipt('');
    setPreviewed('');
    setNotice(message);
    setRefresh((x) => x + 1);
    await onRefresh();
  }
  const designs = choices.filter((c) => c.collection === 'design-themes');
  const selectedFor = (choice: Choice) =>
    selected.find(
      (item) =>
        item.collection === choice.collection &&
        (String(item.recordId) === String(choice.record.id) ||
          item.versionId === choice.record.versionId),
    );
  const select = (choice: Choice, versionId: number | null) =>
    setSelected((items) => [
      ...items.filter(
        (item) =>
          !(
            item.collection === choice.collection &&
            (String(item.recordId) === String(choice.record.id) ||
              item.versionId === choice.record.versionId)
          ),
      ),
      ...(versionId
        ? [
            {
              collection: choice.collection,
              versionId,
              recordId: choice.record.id,
              title: String(choice.record.data.title || 'Untitled'),
            },
          ]
        : []),
    ]);
  return (
    <>
      <OwnerHeading
        eyebrow="Review & release"
        title="Publishing"
        description="Choose exact saved content and design versions. Preview privately, publish now or schedule a reviewed selection."
      />
      <div className="owner-notice">
        Live revision: <code>{expected || 'Nothing published'}</code>.{' '}
        {selected.length} content versions selected.
      </div>
      <div className="owner-editor-grid">
        <div>
          <section className="owner-panel">
            <h2>Design version</h2>
            {designs.map((choice) => (
              <div className="owner-row" key={choice.record.id}>
                <label>
                  <input
                    type="radio"
                    name="selected-design"
                    checked={designRecordId === String(choice.record.id)}
                    onChange={() => {
                      setDesignRecordId(String(choice.record.id));
                      setDesignVersion(choice.record.versionId || 0);
                    }}
                  />{' '}
                  <strong>
                    {String(choice.record.data.title || 'Design')}
                  </strong>
                </label>
                {designRecordId === String(choice.record.id) && (
                  <div className="owner-field">
                    <VersionPicker
                      collection="design-themes"
                      record={choice.record}
                      value={designVersion}
                      onChange={setDesignVersion}
                    />
                  </div>
                )}
              </div>
            ))}
            {!designs.length && (
              <p>
                Save a design in <Link href="/owner/design">Design Studio</Link>{' '}
                before publishing.
              </p>
            )}
          </section>
          <section className="owner-panel">
            <h2>Content selection</h2>
            <label className="owner-field">
              <span className="owner-label">Find a record</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {choices
              .filter(
                (c) =>
                  c.collection !== 'design-themes' &&
                  `${c.collection} ${c.record.data.title}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((choice) => {
                const current = selectedFor(choice);
                return (
                  <details
                    className="owner-rich-block"
                    key={`${choice.collection}:${choice.record.id}`}
                  >
                    <summary>
                      <span className="owner-badge">
                        {current ? 'Selected' : 'Not selected'}
                      </span>{' '}
                      {String(choice.record.data.title || choice.record.id)}{' '}
                      <small className="owner-muted">
                        · {choice.collection}
                      </small>
                    </summary>
                    <div className="owner-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={!!current}
                          onChange={(e) =>
                            select(
                              choice,
                              e.target.checked ? choice.record.versionId : null,
                            )
                          }
                        />{' '}
                        Include this record
                      </label>
                      <Link
                        href={`/owner/content/${choice.collection}/${choice.record.id}`}
                        target="_blank"
                      >
                        Edit draft ↗
                      </Link>
                    </div>
                    {current && (
                      <label className="owner-field">
                        <span className="owner-label">
                          Selected saved version
                        </span>
                        <VersionPicker
                          collection={choice.collection}
                          record={choice.record}
                          value={current.versionId}
                          onChange={(value) => select(choice, value)}
                        />
                      </label>
                    )}
                    <p className="owner-muted">
                      Latest draft:{' '}
                      {choice.record.data.visible ? 'eligible' : 'hidden'}.
                      Selection validation checks visibility, relationships and
                      media rights.
                    </p>
                  </details>
                );
              })}
          </section>
        </div>
        <aside>
          <section className="owner-panel">
            <h2>Review selection</h2>
            <p>
              Design version {designVersion || 'not selected'} +{' '}
              {selected.length} content records.
            </p>
            <ol>
              {selected.map((item) => (
                <li key={`${item.collection}:${item.versionId}`}>
                  {item.title || item.collection}{' '}
                  <small>v{item.versionId}</small>
                </li>
              ))}
            </ol>
            <button
              disabled={busy || !designVersion}
              onClick={() =>
                action(async () => {
                  const preview = await ownerApi<{ id: string }>(
                    '/api/owner/previews',
                    { method: 'POST', body: JSON.stringify({ input }) },
                  );
                  setReceipt(preview.id);
                  setPreviewed(fingerprint);
                  setNotice('Private preview ready. Review before publishing.');
                })
              }
            >
              Create private preview
            </button>
            {receipt && (
              <p>
                <a
                  className="owner-button"
                  href={`/owner/preview?receipt=${encodeURIComponent(receipt)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open private preview ↗
                </a>
              </p>
            )}
            <p className="owner-muted">
              {previewed === fingerprint
                ? 'This exact selection is previewed.'
                : 'Any selection change requires a new preview.'}
            </p>
            <button
              className="owner-primary"
              disabled={busy || !receipt || previewed !== fingerprint}
              onClick={() =>
                action(async () => {
                  if (
                    !window.confirm(
                      `Publish design v${designVersion} with ${selected.length} selected content versions? This changes the live local site.`,
                    )
                  )
                    return;
                  await ownerApi('/api/publication', {
                    method: 'POST',
                    body: JSON.stringify(input),
                  });
                  await afterPublish(
                    'Selected content and design published together.',
                  );
                })
              }
            >
              Publish selection
            </button>
          </section>
          <section className="owner-panel">
            <h2>Schedule</h2>
            <label className="owner-field">
              <span className="owner-label">Your local date and time</span>
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
              <small>{Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
            </label>
            <button
              disabled={busy || !when || !receipt || previewed !== fingerprint}
              onClick={() =>
                action(async () => {
                  await ownerApi('/api/owner/schedules', {
                    method: 'POST',
                    body: JSON.stringify({
                      input,
                      runAt: new Date(when).toISOString(),
                    }),
                  });
                  setNotice(
                    'Exact selection scheduled. Later draft edits are not included.',
                  );
                  setRefresh((x) => x + 1);
                })
              }
            >
              Schedule selection
            </button>
            <p className="owner-muted">
              {scheduler?.running
                ? 'Local scheduler is running.'
                : 'Local scheduler is stopped or has not checked in. Queued jobs remain saved and will run when it resumes.'}
            </p>
            {scheduler?.lastSeenAt && (
              <small>
                Last seen {new Date(scheduler.lastSeenAt).toLocaleString()}
              </small>
            )}
          </section>
        </aside>
      </div>
      {error && (
        <p className="owner-notice" data-tone="error" role="alert">
          {error} Your selection is retained.{' '}
          <button
            onClick={() =>
              action(async () => {
                const latest = await ownerApi<OwnerWorkspaceData>(
                  '/api/owner/workspace',
                );
                setExpected(latest.publication?.revision || null);
                setPreviewed('');
                setReceipt('');
                setNotice(
                  'Current live revision refreshed. Review your retained selection again.',
                );
              })
            }
          >
            Refresh live revision
          </button>
        </p>
      )}
      {notice && (
        <p className="owner-notice" data-tone="success" role="status">
          {notice}
        </p>
      )}
      <section className="owner-panel">
        <h2>Scheduled releases</h2>
        <button
          disabled={busy}
          onClick={() =>
            action(async () => {
              await ownerApi('/api/owner/schedules/run', {
                method: 'POST',
                body: '{}',
              });
              setRefresh((x) => x + 1);
              await onRefresh();
              setNotice('Due schedules checked. See each job outcome.');
            })
          }
        >
          Check due schedules now
        </button>
        {jobs.map((job) => (
          <div className="owner-row" key={job.id}>
            <div>
              <strong>{new Date(job.runAt).toLocaleString()}</strong>
              <span className="owner-row-meta">
                {job.status} · attempt {job.attempts} ·{' '}
                {job.input.selections.length} records
              </span>
              {job.error && <p role="status">{job.error}</p>}
            </div>
            <div className="owner-actions">
              {['pending', 'failed', 'conflict'].includes(job.status) && (
                <button
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await ownerApi(`/api/owner/schedules/${job.id}/cancel`, {
                        method: 'POST',
                        body: JSON.stringify({
                          expectedRevision: job.revision,
                        }),
                      });
                      setRefresh((x) => x + 1);
                    })
                  }
                >
                  Cancel
                </button>
              )}
              {['failed', 'conflict', 'cancelled'].includes(job.status) && (
                <button
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await ownerApi(`/api/owner/schedules/${job.id}/retry`, {
                        method: 'POST',
                        body: JSON.stringify({
                          expectedRevision: job.revision,
                        }),
                      });
                      setRefresh((x) => x + 1);
                    })
                  }
                >
                  Retry saved selection
                </button>
              )}
            </div>
          </div>
        ))}
        {!jobs.length && <p className="owner-muted">No schedules yet.</p>}
      </section>
      <section className="owner-panel">
        <h2>Publication history</h2>
        {history.map((snapshot) => (
          <div key={snapshot.id} className="owner-row">
            <div>
              <code>{snapshot.revision}</code>
              <span className="owner-row-meta">
                {snapshot.publishedAt
                  ? new Date(snapshot.publishedAt).toLocaleString()
                  : ''}
              </span>
            </div>
            <button
              disabled={busy || snapshot.revision === expected}
              onClick={() =>
                action(async () => {
                  if (
                    !window.confirm(
                      'Restore this exact saved publication? Its content and design replace the live selection together.',
                    )
                  )
                    return;
                  await ownerApi('/api/publication', {
                    method: 'POST',
                    body: JSON.stringify({
                      ...input,
                      action: 'restore',
                      restoreSnapshotId: Number(snapshot.id),
                    }),
                  });
                  await afterPublish('Saved publication restored.');
                })
              }
            >
              Restore publication
            </button>
          </div>
        ))}
        <div className="owner-actions">
          <button
            onClick={() =>
              action(async () =>
                downloadJson(
                  'desan-owner-recovery.json',
                  await ownerApi('/api/owner/export'),
                ),
              )
            }
          >
            Export private recovery bundle
          </button>
          <button
            className="owner-danger"
            disabled={busy || !expected}
            onClick={() =>
              action(async () => {
                if (
                  !window.confirm(
                    'Withdraw the entire live publication? Public content and its media will become unavailable. Saved drafts remain.',
                  )
                )
                  return;
                await ownerApi('/api/publication', {
                  method: 'POST',
                  body: JSON.stringify({ ...input, action: 'revoke' }),
                });
                await afterPublish(
                  'Live publication withdrawn. Drafts remain private.',
                );
              })
            }
          >
            Withdraw live publication
          </button>
        </div>
      </section>
      <RecoveryImport />
    </>
  );
}
