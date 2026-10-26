'use client';
import { useEffect, useState } from 'react';
import { ownerApi, ownerPages, type OwnerRecord } from './client';
type MergePlan = {
  sourceId: string | number;
  targetId: string | number;
  expectedRevisions: Record<string, string>;
  edgeFingerprint: string;
  changes: {
    collection: string;
    id: string | number;
    changedFields?: { label: string; before: string; after: string }[];
  }[];
};
export function SkillMerge({
  source,
  disabled,
  onMerged,
}: {
  source: OwnerRecord;
  disabled: boolean;
  onMerged: () => Promise<void>;
}) {
  const [skills, setSkills] = useState<OwnerRecord[]>([]),
    [target, setTarget] = useState(''),
    [plan, setPlan] = useState<MergePlan | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    ownerPages<OwnerRecord>('/api/owner/records/skills?limit=100')
      .then((rows) => {
        if (active)
          setSkills(rows.filter((row) => String(row.id) !== String(source.id)));
      })
      .catch(() => {
        if (active)
          setError('Skills could not load. Retry by reopening this record.');
      });
    return () => {
      active = false;
    };
  }, [source.id]);
  return (
    <section className="owner-panel">
      <h2>Merge duplicate skills</h2>
      <p>
        Move this skill’s associations into a canonical skill, retain its names
        as aliases and hide this source draft. The live publication stays
        unchanged.
      </p>
      <label className="owner-field">
        <span className="owner-label">Canonical skill</span>
        <select
          disabled={busy || disabled}
          value={target}
          onChange={(event) => {
            setTarget(event.target.value);
            setPlan(null);
            setError('');
          }}
        >
          <option value="">Choose canonical skill</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {String(skill.data.canonicalName || skill.data.title)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || disabled || !target}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            setPlan(
              await ownerApi<MergePlan>('/api/owner/skills/merge', {
                method: 'POST',
                body: JSON.stringify({
                  sourceId: source.id,
                  targetId: target,
                  apply: false,
                }),
              }),
            );
          } catch (failure) {
            setError((failure as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Review merge
      </button>
      {disabled && <p>Save or discard edits before reviewing a merge.</p>}
      {plan && (
        <div>
          <h3>Proposed draft changes</h3>
          <ul>
            {plan.changes.map((change) => (
              <li key={`${change.collection}:${change.id}`}>
                {change.collection} #{change.id}
                {change.changedFields?.map((field) => (
                  <details key={field.label}>
                    <summary>{field.label}</summary>
                    <p>Before: {field.before}</p>
                    <p>After: {field.after}</p>
                  </details>
                ))}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="owner-primary"
            disabled={busy || disabled}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await ownerApi('/api/owner/skills/merge', {
                  method: 'POST',
                  body: JSON.stringify({
                    ...plan,
                    sourceId: source.id,
                    targetId: target,
                    apply: true,
                  }),
                });
                setPlan(null);
                await onMerged();
              } catch (failure) {
                setError((failure as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Apply reviewed merge
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
