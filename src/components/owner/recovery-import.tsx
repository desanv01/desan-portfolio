'use client';
import { useRef, useState } from 'react';
import { ownerApi } from './client';
import { draftRecoveryBundle } from './recovery-bundle';
type Plan = {
  applied: boolean;
  changes: {
    collection: string;
    id: string | number;
    title: string;
    expectedRevision: string;
    changedFields?: {
      path: string;
      label: string;
      before: string;
      after: string;
      truncated: boolean;
    }[];
  }[];
  expectedRevisions: Record<string, string>;
  warnings: string[];
};
export function RecoveryImport() {
  const generation = useRef(0);
  const reviewedBundle = useRef<unknown>(null);
  const [bundle, setBundle] = useState<unknown>(null),
    [plan, setPlan] = useState<Plan | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="owner-panel">
      <h2>Recover saved drafts</h2>
      <p className="owner-muted">
        Import an export from this installation. Review the proposed draft
        changes before applying. Live publication, schedules, credentials and
        media bytes stay unchanged. The editor extracts current drafts from the
        full export; keep the original file for its history and operator
        recovery.
      </p>
      <label className="owner-field">
        <span className="owner-label">Private recovery bundle</span>
        <input
          type="file"
          disabled={busy}
          accept="application/json,.json"
          onChange={async (event) => {
            const current = ++generation.current;
            reviewedBundle.current = null;
            setPlan(null);
            setNotice('');
            setError('');
            setBundle(null);
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) {
              setError(
                'Choose a recovery file up to 50 MiB. Larger archives require operator recovery.',
              );
              return;
            }
            try {
              const parsed = draftRecoveryBundle(JSON.parse(await file.text()));
              if (
                new Blob([JSON.stringify({ bundle: parsed, apply: false })])
                  .size >
                3 * 1024 * 1024
              )
                throw new Error(
                  'Current draft data exceeds the 3 MiB editing limit. Keep the complete archive; use an operator-reviewed subset of collections for recovery.',
                );
              if (current === generation.current) setBundle(parsed);
            } catch (failure) {
              if (current === generation.current)
                setError(
                  failure instanceof Error
                    ? failure.message
                    : 'This file is not valid JSON.',
                );
            }
          }}
        />
      </label>
      <button
        disabled={busy || !bundle}
        onClick={async () => {
          setBusy(true);
          setError('');
          const current = generation.current;
          const candidate = structuredClone(bundle);
          try {
            const nextPlan = await ownerApi<Plan>('/api/owner/import', {
              method: 'POST',
              body: JSON.stringify({ bundle: candidate, apply: false }),
            });
            if (current === generation.current) {
              reviewedBundle.current = candidate;
              setPlan(nextPlan);
            }
          } catch (failure) {
            setError((failure as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Validate & review
      </button>
      {plan && (
        <div className="owner-notice">
          <h3>Proposed draft changes</h3>
          <ul>
            {plan.changes.map((change) => (
              <li key={`${change.collection}:${change.id}`}>
                {change.title} · {change.collection}
                {change.changedFields?.map((field) => (
                  <details key={field.path}>
                    <summary>
                      {field.label}
                      {field.truncated ? ' (abbreviated preview)' : ''}
                    </summary>
                    <p>Before</p>
                    <pre className="owner-json-preview">{field.before}</pre>
                    <p>After</p>
                    <pre className="owner-json-preview">{field.after}</pre>
                  </details>
                ))}
              </li>
            ))}
          </ul>
          {plan.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          <button
            className="owner-primary"
            disabled={busy || !plan.changes.length}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await ownerApi('/api/owner/import', {
                  method: 'POST',
                  body: JSON.stringify({
                    bundle: reviewedBundle.current,
                    apply: true,
                    expectedRevisions: plan.expectedRevisions,
                  }),
                });
                setNotice(
                  'Reviewed records restored as new drafts. Live publication is unchanged.',
                );
                setPlan(null);
                setBundle(null);
                reviewedBundle.current = null;
              } catch (failure) {
                setError((failure as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Apply reviewed draft recovery
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="owner-notice" data-tone="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="owner-notice" data-tone="success">
          {notice}
        </p>
      )}
    </section>
  );
}
