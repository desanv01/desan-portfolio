'use client';

import { useEffect, useId, useState } from 'react';
import {
  ownerApi,
  type OwnerField,
  type OwnerRecord,
  type OwnerRecordPage,
} from './client';
import { RichEditor } from './rich-editor';

export function fieldLabel(field: OwnerField): string {
  const labels: Record<string, string> = {
    sourceKey: 'Source reference',
    visible: 'Eligible for publication',
    sortOrder: 'Display order',
    featuredOrder: 'Featured display order',
    privateNotes: 'Private editorial notes',
    targetRoleKey: 'Exact role key',
    showGrade: 'Show grade publicly',
    consentReceipt: 'Private permission record',
    publicEligible: 'Rights allow public use',
    body: 'Article / description blocks',
  };
  return (
    labels[field.name] ||
    (field.label !== field.name
      ? field.label
      : field.name
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^./, (x) => x.toUpperCase()))
  );
}
export function editableData(
  data: Record<string, unknown>,
  fields: OwnerField[],
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((f) => !f.readOnly && Object.hasOwn(data, f.name))
      .map((field) => [
        field.name,
        field.fields && data[field.name]
          ? field.type === 'array'
            ? (data[field.name] as Record<string, unknown>[]).map((row) => ({
                ...editableData(row, field.fields!),
                ...(row.id ? { id: row.id } : {}),
              }))
            : editableData(
                data[field.name] as Record<string, unknown>,
                field.fields,
              )
          : data[field.name],
      ]),
  );
}

function Relationships({
  field,
  value,
  change,
  id,
}: {
  field: OwnerField;
  value: unknown;
  change: (value: unknown) => void;
  id: string;
}) {
  const collections = Array.isArray(field.relationTo)
    ? field.relationTo
    : [field.relationTo || 'media'];
  const key = collections.join(',');
  const [options, setOptions] = useState<
    { collection: string; record: OwnerRecord }[]
  >([]);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let stopped = false;
    (async () => {
      const output: { collection: string; record: OwnerRecord }[] = [];
      for (const collection of key.split(',')) {
        let page = 1;
        let totalPages = 1;
        do {
          const result = await ownerApi<OwnerRecordPage>(
            `/api/owner/records/${collection}?page=${page}&limit=100`,
          );
          output.push(...result.docs.map((record) => ({ collection, record })));
          totalPages = result.totalPages;
          page++;
        } while (page <= totalPages);
      }
      if (!stopped) {
        setOptions(output);
        setError('');
      }
    })()
      .catch(() => {
        if (!stopped)
          setError(
            'Related records could not load. Existing selection is retained.',
          );
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, [key, refresh]);
  const polymorphic = Array.isArray(field.relationTo);
  const encode = (item: unknown): string => {
    if (item === null || item === undefined) return '';
    if (polymorphic && typeof item === 'object') {
      const x = item as { relationTo: string; value: unknown };
      return `${x.relationTo}:${typeof x.value === 'object' && x.value ? (x.value as { id: unknown }).id : x.value}`;
    }
    return String(
      typeof item === 'object' ? (item as { id: unknown }).id : item,
    );
  };
  const decode = (item: string): unknown =>
    !item
      ? null
      : polymorphic
        ? {
            relationTo: item.split(':')[0],
            value: item.slice(item.indexOf(':') + 1),
          }
        : item;
  const selected = field.hasMany
    ? (Array.isArray(value) ? value : []).map(encode)
    : encode(value);
  const keys = new Set(
    options.map((option) =>
      polymorphic
        ? `${option.collection}:${option.record.id}`
        : String(option.record.id),
    ),
  );
  const missing = (Array.isArray(selected) ? selected : [selected]).filter(
    (item) => item && !keys.has(item),
  );
  return (
    <>
      <select
        id={id}
        multiple={field.hasMany}
        size={
          field.hasMany ? Math.min(7, Math.max(3, options.length)) : undefined
        }
        value={selected}
        onChange={(event) =>
          change(
            field.hasMany
              ? Array.from(event.target.selectedOptions).map((option) =>
                  decode(option.value),
                )
              : decode(event.target.value),
          )
        }
        required={field.required}
      >
        {!field.hasMany && <option value="">Not selected</option>}
        {missing.map((item) => (
          <option key={item} value={item}>
            Existing selection {item} — unavailable
          </option>
        ))}
        {options.map(({ collection, record }) => (
          <option
            key={`${collection}:${record.id}`}
            value={
              polymorphic ? `${collection}:${record.id}` : String(record.id)
            }
          >
            {String(
              record.data.title ||
                record.data.alt ||
                record.data.canonicalName ||
                record.id,
            )}
            {polymorphic ? ` · ${collection}` : ''}
          </option>
        ))}
      </select>
      {field.hasMany && (
        <small>
          Choose multiple with Ctrl/⌘. Related records remain private until
          selected for publication.
        </small>
      )}
      {error && <small role="alert">{error}</small>}
      {collections.includes('media') && (
        <div className="owner-actions">
          <a
            className="owner-button"
            href="/owner/media"
            target="_blank"
            rel="noopener noreferrer"
          >
            Choose or upload media (new tab)
          </a>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setRefresh((value) => value + 1);
            }}
          >
            Refresh media choices
          </button>
          <small role="status">
            {loading
              ? 'Loading media choices…'
              : `${options.length} choices loaded. Your record edits and current selection are retained.`}
          </small>
        </div>
      )}
    </>
  );
}

function RoleSelector({
  id,
  target,
  value,
  change,
}: {
  id: string;
  target: unknown;
  value: unknown;
  change: (value: unknown) => void;
}) {
  const relation = target as
    { relationTo?: string; value?: unknown } | undefined;
  const targetValue = relation?.value;
  const targetId =
    typeof targetValue === 'object' && targetValue
      ? (targetValue as { id?: unknown }).id
      : targetValue;
  const key =
    relation?.relationTo === 'experiences' && targetId ? String(targetId) : '';
  const [roles, setRoles] = useState<{ roleKey: string; role: string }[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!key) return;
    ownerApi<OwnerRecord>(`/api/owner/records/experiences/${key}`)
      .then((record) => {
        if (active) {
          setRoles(Array.isArray(record.data.roles) ? record.data.roles : []);
          setError('');
        }
      })
      .catch(() => {
        if (active)
          setError('Roles could not load. Existing selection is retained.');
      });
    return () => {
      active = false;
    };
  }, [key]);
  const available = key ? roles : [];
  return (
    <>
      <select
        id={id}
        value={String(value || '')}
        onChange={(event) => change(event.target.value || null)}
      >
        <option value="">Whole record (no specific role)</option>
        {value && !available.some((role) => role.roleKey === value) ? (
          <option value={String(value)}>
            Existing role {String(value)} — choose a matching role
          </option>
        ) : null}
        {available.map((role) => (
          <option key={role.roleKey} value={role.roleKey}>
            {role.role || role.roleKey}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </>
  );
}

export function RecordFields({
  fields,
  data,
  onChange,
  path = 'record',
}: {
  fields: OwnerField[];
  data: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  path?: string;
}) {
  const prefix = useId();
  return (
    <div className="owner-fields">
      {fields.map((field) => {
        const id = `${prefix}-${path}-${field.name}`;
        const value = data[field.name];
        const label = fieldLabel(field);
        const change = (next: unknown) =>
          onChange({ ...data, [field.name]: next });
        if (field.readOnly) return null;
        if (field.type === 'richText')
          return (
            <div className="owner-field-wide" key={field.name}>
              <RichEditor label={label} value={value} onChange={change} />
            </div>
          );
        if (field.type === 'array' || field.type === 'group')
          return (
            <fieldset key={field.name} className="owner-panel owner-field-wide">
              <legend>{label}</legend>
              {field.type === 'group' ? (
                <RecordFields
                  fields={field.fields || []}
                  data={
                    value && typeof value === 'object'
                      ? (value as Record<string, unknown>)
                      : {}
                  }
                  onChange={change}
                  path={`${path}.${field.name}`}
                />
              ) : (
                <>
                  {(Array.isArray(value) ? value : []).map((row, index) => (
                    <div className="owner-array" key={row.id || index}>
                      <div className="owner-array-head">
                        <strong>
                          {label} {index + 1}
                        </strong>
                        <div className="owner-actions">
                          <button
                            type="button"
                            disabled={!index}
                            aria-label={`Move ${label} ${index + 1} up`}
                            onClick={() => {
                              const next = [...(value as unknown[])];
                              [next[index - 1], next[index]] = [
                                next[index],
                                next[index - 1],
                              ];
                              change(next);
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={index === (value as unknown[]).length - 1}
                            aria-label={`Move ${label} ${index + 1} down`}
                            onClick={() => {
                              const next = [...(value as unknown[])];
                              [next[index + 1], next[index]] = [
                                next[index],
                                next[index + 1],
                              ];
                              change(next);
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              change(
                                (value as unknown[]).filter(
                                  (_, i) => i !== index,
                                ),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <RecordFields
                        fields={field.fields || []}
                        data={row}
                        onChange={(next) =>
                          change(
                            (value as unknown[]).map((item, i) =>
                              i === index ? next : item,
                            ),
                          )
                        }
                        path={`${path}.${field.name}.${index}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      change([
                        ...(Array.isArray(value) ? value : []),
                        ...(field.name === 'roles'
                          ? [
                              {
                                roleKey: `role-${crypto.randomUUID().slice(0, 8)}`,
                              },
                            ]
                          : [{}]),
                      ])
                    }
                  >
                    + Add {label.toLowerCase()}
                  </button>
                </>
              )}
            </fieldset>
          );
        if (field.type === 'json')
          return (
            <div className="owner-field owner-field-wide" key={field.name}>
              <span className="owner-label">{label}</span>
              <p>Use Design Studio to edit presentation controls.</p>
            </div>
          );
        return (
          <div
            data-field-path={`${path}.${field.name}`}
            className={`owner-field ${['textarea', 'relationship', 'upload'].includes(field.type) ? 'owner-field-wide' : ''}`}
            key={field.name}
          >
            {field.type === 'checkbox' ? (
              <label htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => change(e.target.checked)}
                />
                {label}
              </label>
            ) : (
              <>
                <label className="owner-label" htmlFor={id}>
                  {label}
                  {field.required ? ' *' : ''}
                </label>
                {field.name === 'targetRoleKey' ? (
                  <RoleSelector
                    key={JSON.stringify(data.target)}
                    id={id}
                    target={data.target}
                    value={value}
                    change={change}
                  />
                ) : field.type === 'relationship' || field.type === 'upload' ? (
                  <Relationships
                    field={field}
                    value={value}
                    change={change}
                    id={id}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={id}
                    value={String(value || '')}
                    required={field.required}
                    onChange={(e) => change(e.target.value || null)}
                  >
                    <option value="">Not selected</option>
                    {field.options?.map((option) => {
                      const item =
                        typeof option === 'string'
                          ? { label: option, value: option }
                          : option;
                      return (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={id}
                    value={String(value || '')}
                    required={field.required}
                    onChange={(e) => change(e.target.value)}
                  />
                ) : (
                  <input
                    id={id}
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'email'
                          ? 'email'
                          : 'text'
                    }
                    step={field.type === 'number' ? 'any' : undefined}
                    value={
                      typeof value === 'number' ? value : String(value || '')
                    }
                    required={field.required}
                    onChange={(e) =>
                      change(
                        field.type === 'number'
                          ? e.target.value === ''
                            ? null
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </>
            )}
            {field.name === 'visible' && (
              <small>
                Saving this setting does not publish. Choose the saved version
                in Publishing.
              </small>
            )}
            {['start', 'end'].includes(field.name) && (
              <small>Use the known YYYY or YYYY-MM only.</small>
            )}
            {field.name === 'targetRoleKey' && (
              <small>
                Select a target experience first to choose one of its roles.
              </small>
            )}
          </div>
        );
      })}
    </div>
  );
}
