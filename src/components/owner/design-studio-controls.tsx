'use client';
import { useState, useId } from 'react';
import type { DesignDocument } from '../../design/model';
import { type Json, plain } from '../../design/schema';
import {
  initialValue,
  matchesControl,
  controlLabel,
  type Control,
} from '../../owner-design/control-schema';

export type ValueProps = {
  control: Control;
  value: Json;
  onChange: (value: Json) => void;
  label: string;
  document: DesignDocument;
  resourceNames?: Record<string, string>;
  onInvalid: (path: string, invalid: boolean) => void;
};
function Numeric({
  value,
  onChange,
  label,
  control,
  onInvalid,
}: ValueProps & { control: Extract<Control, { kind: 'number' }> }) {
  const raw = String(value);
  const id = useId();
  const number = Number(raw);
  const invalid =
    raw.trim() === '' ||
    !Number.isFinite(number) ||
    number < control.min ||
    number > control.max ||
    (control.integer && !Number.isInteger(number));
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={raw}
        aria-invalid={invalid}
        onChange={(e) => {
          const text = e.target.value,
            n = Number(text),
            bad =
              text.trim() === '' ||
              !Number.isFinite(n) ||
              n < control.min ||
              n > control.max ||
              (control.integer && !Number.isInteger(n));
          onInvalid(label, bad);
          onChange(bad ? text : n);
        }}
      />
      {invalid && (
        <small role="alert">
          Enter {control.integer ? 'an integer' : 'a number'} between{' '}
          {control.min} and {control.max}.
        </small>
      )}
    </div>
  );
}
export function VisualValueEditor(p: ValueProps) {
  const { control: c, value, onChange, label, document: d, onInvalid } = p;
  const id = useId();
  if (c.kind === 'number') return <Numeric {...p} control={c} />;
  if (c.kind === 'union') {
    const selected = Math.max(
      0,
      c.options.findIndex((x) => matchesControl(x, value)),
    );
    return (
      <fieldset>
        <legend>{label}</legend>
        <label htmlFor={id}>Representation</label>
        <select
          id={id}
          value={selected}
          onChange={(e) =>
            onChange(initialValue(c.options[Number(e.target.value)]))
          }
        >
          {c.options.map((x, i) => (
            <option key={i} value={i}>
              {controlLabel(x)}
            </option>
          ))}
        </select>
        <VisualValueEditor
          {...p}
          label={`${label} value`}
          control={c.options[selected]}
        />
      </fieldset>
    );
  }
  if (c.kind === 'boolean')
    return (
      <label className="ds-check">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (c.kind === 'choice')
    return (
      <label>
        {label}
        <select
          value={c.options.findIndex((x) => x === value)}
          onChange={(e) => onChange(c.options[Number(e.target.value)])}
        >
          {c.options.map((x, i) => (
            <option key={i} value={i}>
              {String(x)}
            </option>
          ))}
        </select>
      </label>
    );
  if (c.kind === 'color') {
    const rgba = plain(value);
    return (
      <fieldset>
        <legend>{label}</legend>
        <label>
          Color format
          <select
            value={rgba ? 'rgba' : 'hex'}
            onChange={(e) =>
              onChange(
                e.target.value === 'rgba'
                  ? { r: 255, g: 255, b: 255, a: 1 }
                  : '#ffffff',
              )
            }
          >
            <option value="hex">Hex / transparent / currentColor</option>
            <option value="rgba">RGBA channels</option>
          </select>
        </label>
        {rgba ? (
          <VisualValueEditor
            {...p}
            control={{
              kind: 'object',
              required: {
                r: { kind: 'number', min: 0, max: 255, integer: false },
                g: { kind: 'number', min: 0, max: 255, integer: false },
                b: { kind: 'number', min: 0, max: 255, integer: false },
                a: { kind: 'number', min: 0, max: 1, integer: false },
              },
              optional: {},
            }}
          />
        ) : (
          <div className="ds-color">
            <input
              aria-label={`${label} picker`}
              type="color"
              value={
                typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
                  ? value
                  : '#ffffff'
              }
              onChange={(e) => onChange(e.target.value)}
            />
            <label>
              Exact color
              <input
                value={String(value)}
                onChange={(e) => {
                  onChange(e.target.value);
                  onInvalid(
                    label,
                    !/^(?:#[\da-f]{3}|#[\da-f]{4}|#[\da-f]{6}|#[\da-f]{8}|transparent|currentColor)$/i.test(
                      e.target.value,
                    ),
                  );
                }}
              />
            </label>
          </div>
        )}
      </fieldset>
    );
  }
  if (c.kind === 'text' || c.kind === 'id') {
    const refs = label.endsWith('.fontId')
      ? d.fonts.map((x) => ({ id: x.id, label: `${x.family} · ${x.version}` }))
      : label.endsWith('.assetId')
        ? d.assets.map((x) => ({
            id: x.id,
            label: `${p.resourceNames?.[x.id] || `${x.kind} ${x.id}`} · ${x.version}`,
          }))
        : label.endsWith('.targetId') || label.endsWith('.nodeId')
          ? d.nodes.map((x) => ({ id: x.id, label: `${x.kind} · ${x.id}` }))
          : [];
    if (refs.length || label.endsWith('.fontId') || label.endsWith('.assetId'))
      return (
        <label>
          {label}
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          >
            {!refs.some((x) => x.id === value) && (
              <option value={String(value)}>Unresolved: {String(value)}</option>
            )}
            {refs.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      );
    return (
      <label>
        {label}
        <input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }
  if (c.kind === 'object') {
    const object = plain(value) ? (value as Record<string, Json>) : {};
    return (
      <fieldset>
        <legend>{label}</legend>
        {Object.entries(c.required).map(([key, control]) => (
          <VisualValueEditor
            key={key}
            {...p}
            control={control}
            value={object[key] ?? initialValue(control)}
            label={`${label}.${key}`}
            onChange={(v) => onChange({ ...object, [key]: v })}
          />
        ))}
        {Object.entries(c.optional).map(([key, control]) => (
          <div key={key}>
            <label className="ds-check">
              <input
                type="checkbox"
                checked={Object.hasOwn(object, key)}
                onChange={(e) => {
                  const next = { ...object };
                  if (e.target.checked) next[key] = initialValue(control);
                  else delete next[key];
                  onChange(next);
                }}
              />
              Set {key}
            </label>
            {Object.hasOwn(object, key) && (
              <VisualValueEditor
                {...p}
                control={control}
                value={object[key]}
                label={`${label}.${key}`}
                onChange={(v) => onChange({ ...object, [key]: v })}
              />
            )}
          </div>
        ))}
      </fieldset>
    );
  }
  if (c.kind === 'array') {
    const array = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend>
          {label} · {array.length} items
        </legend>
        {array.map((v, i) => (
          <div className="ds-list-item" key={`${i}-${array.length}`}>
            <VisualValueEditor
              {...p}
              control={c.item}
              value={v}
              label={`${label}[${i + 1}]`}
              onChange={(x) => onChange(array.map((v, j) => (i === j ? x : v)))}
            />
            <div className="ds-actions">
              <button
                type="button"
                disabled={!i}
                onClick={() => {
                  const n = [...array];
                  [n[i - 1], n[i]] = [n[i], n[i - 1]];
                  onChange(n);
                }}
              >
                Up
              </button>
              <button
                type="button"
                disabled={i === array.length - 1}
                onClick={() => {
                  const n = [...array];
                  [n[i + 1], n[i]] = [n[i], n[i + 1]];
                  onChange(n);
                }}
              >
                Down
              </button>
              <button
                type="button"
                disabled={array.length <= c.min}
                onClick={() => onChange(array.filter((_, j) => j !== i))}
              >
                Remove item {i + 1}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={array.length >= c.max}
          onClick={() => onChange([...array, initialValue(c.item)])}
        >
          Add item
        </button>
      </fieldset>
    );
  }
  const object = plain(value) ? (value as Record<string, Json>) : {};
  return (
    <fieldset>
      <legend>{label}</legend>
      {Object.entries(object).map(([key, v]) => (
        <div key={key} className="ds-list-item">
          <VisualValueEditor
            {...p}
            control={c.item}
            value={v}
            label={`${label}.${key}`}
            onChange={(x) => onChange({ ...object, [key]: x })}
          />
          <button
            type="button"
            onClick={() => {
              const n = { ...object };
              delete n[key];
              onChange(n);
            }}
          >
            Remove {key}
          </button>
        </div>
      ))}
      <MapAdd
        disabled={Object.keys(object).length >= c.max}
        label={label}
        onAdd={(key) => {
          if (Object.hasOwn(object, key)) return false;
          onChange({ ...object, [key]: initialValue(c.item) });
          return true;
        }}
      />
    </fieldset>
  );
}
function MapAdd({
  label,
  onAdd,
  disabled,
}: {
  label: string;
  onAdd: (key: string) => boolean;
  disabled: boolean;
}) {
  const [key, setKey] = useState(''),
    [error, setError] = useState('');
  return (
    <div>
      <label>
        {label} new key
        <input value={key} onChange={(e) => setKey(e.target.value)} />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (
            !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(key) ||
            ['__proto__', 'constructor', 'prototype'].includes(key) ||
            !onAdd(key)
          ) {
            setError(
              'Enter a unique supported key. OpenType axis and feature keys have four characters.',
            );
            return;
          }
          setKey('');
          setError('');
        }}
      >
        Add keyed value
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
