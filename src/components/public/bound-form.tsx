'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type CSSProperties,
  useId,
  type InputHTMLAttributes,
} from 'react';
import { useDesignBinding } from './design-context';
import { safeHref } from '@/public-data';
import { usePreviewHref } from '../owner/preview-navigation';
import type { Json } from '@/design/schema';

const object = (v: Json | undefined) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, Json>)
    : {};
export function BoundFilterBar({
  node,
  children,
  label = 'Filters',
  options: explicitOptions,
}: {
  node: string;
  children: ReactNode;
  label?: string;
  options?: { href: string; label: string; selected?: boolean }[];
}) {
  const navigateHref = usePreviewHref();
  const binding = useDesignBinding(node);
  const presentation = binding?.behavior['filter.presentation'];
  if (binding?.attributes.hidden) return null;
  const options = explicitOptions
    ? explicitOptions.filter((option) => {
        const safe = safeHref(option.href);
        return safe && safe.startsWith('/');
      })
    : Children.toArray(children).flatMap((child, index) => {
        if (!isValidElement(child)) return [];
        const props = child.props as {
          href?: unknown;
          children?: ReactNode;
          'aria-current'?: unknown;
        };
        const href = safeHref(props.href);
        return href && href.startsWith('/')
          ? [
              {
                href,
                label:
                  typeof props.children === 'string'
                    ? props.children
                    : `Filter ${index + 1}`,
                selected: Boolean(
                  props['aria-current'] && props['aria-current'] !== 'false',
                ),
              },
            ]
          : [];
      });
  if (presentation === 'select' && options.length)
    return (
      <label data-design-node={node}>
        <span className="field-label">{label}</span>
        <select
          aria-label={label}
          value={options.find((x) => x.selected)?.href || options[0].href}
          onChange={(event) => {
            const href = options.find(
              (x) => x.href === event.target.value,
            )?.href;
            if (href) window.location.assign(navigateHref(href));
          }}
        >
          {options.map((option) => (
            <option key={option.href} value={option.href}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  const content = (
    <nav
      className="filter-bar"
      aria-label={label}
      data-design-node={node}
      style={
        presentation === 'sidebar'
          ? { flexDirection: 'column', alignItems: 'flex-start' }
          : undefined
      }
    >
      {children}
    </nav>
  );
  if (presentation === 'disclosure' || presentation === 'drawer')
    return (
      <details
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.currentTarget.open = false;
            event.currentTarget.querySelector('summary')?.focus();
          }
        }}
      >
        <summary>{label}</summary>
        <div
          style={
            presentation === 'drawer'
              ? {
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 60,
                  background: 'var(--surface)',
                  padding: 24,
                  maxHeight: '65vh',
                  overflow: 'auto',
                }
              : undefined
          }
        >
          {content}
        </div>
      </details>
    );
  return content;
}
export function BoundField({
  node,
  label,
  help,
  error,
  children,
  input,
}: {
  node: string;
  label: string;
  help?: string;
  error?: string;
  children?: ReactNode;
  input?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const binding = useDesignBinding(node);
  const config = binding?.behavior || {};
  const arrangement = object(config['field.arrangement']);
  const placement = config['field.helpErrorPlacement'];
  const unique = useId();
  const id = `field-${node.replaceAll('.', '-')}-${unique.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const message = error || help;
  const controls = input ? (
    <input
      {...input}
      id={id}
      data-design-part="field"
      aria-invalid={error ? true : undefined}
      aria-describedby={message ? `${id}-help` : undefined}
    />
  ) : (
    Children.map(children, (child) =>
      isValidElement(child)
        ? cloneElement(child as ReactElement<Record<string, unknown>>, {
            id,
            'data-design-node': undefined,
            'data-design-part': 'field',
            'aria-invalid': error ? true : undefined,
            'aria-describedby': message ? `${id}-help` : undefined,
          })
        : child,
    )
  );
  const note = message ? (
    <span
      id={`${id}-help`}
      data-design-part={error ? 'error' : 'help'}
      role={error ? 'alert' : undefined}
    >
      {placement === 'icon' ? <span aria-hidden="true">! </span> : null}
      {message}
    </span>
  ) : null;
  const style: CSSProperties = {
    display: arrangement.layout === 'columns' ? 'grid' : 'flex',
    flexDirection: arrangement.layout === 'inline' ? 'row' : 'column',
    ...(arrangement.layout === 'columns'
      ? { gridTemplateColumns: 'auto minmax(0, 1fr)' }
      : {}),
  };
  if (binding?.attributes.hidden) return null;
  return (
    <div
      data-design-node={node}
      data-design-error={error ? 'true' : undefined}
      style={style}
    >
      <label
        htmlFor={id}
        className="field-label"
        style={arrangement.label === 'after' ? { order: 1 } : undefined}
      >
        {label}
      </label>
      {placement === 'before' && note}
      {controls}
      {placement !== 'before' && note}
    </div>
  );
}
