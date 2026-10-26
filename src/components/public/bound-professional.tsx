'use client';

import { Children, type ReactNode, type CSSProperties } from 'react';
import type { PublicRecord, PublicCollection } from '@/public-data';
import {
  PublicDesignContext,
  useDesignBinding,
  usePublicDesignRuntime,
  useRecordDesignBinding,
} from './design-context';
import type { Json } from '@/design/schema';
import { dimension } from '@/design/runtime-serialize';

const object = (v: Json | undefined) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, Json>)
    : {};
export function summaryPreview(value: string, maximum: number): string {
  const segments = [
    ...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value),
  ].map((x) => x.segment);
  return segments.length > maximum
    ? `${segments.slice(0, Math.max(0, maximum)).join('')}${maximum > 0 ? '…' : ''}`
    : value;
}
export function BoundRecord({
  collection,
  id,
  page = 'profile',
  children,
}: {
  collection: PublicCollection;
  id: string | number;
  page?: string;
  children: ReactNode;
}) {
  const binding = useRecordDesignBinding(`${page}.record`, collection, id);
  const runtime = usePublicDesignRuntime();
  const mode = binding?.behavior['record.narrowLayout'];
  const narrowThreshold =
    runtime.breakpoints?.find((point) => point.id === 'tablet')?.minWidth ??
    runtime.breakpoints?.[0]?.minWidth ??
    768;
  const narrow = (runtime.viewportWidth ?? 1440) < narrowThreshold;
  const style: CSSProperties | undefined =
    !narrow || !mode
      ? undefined
      : mode === 'metadata-wrap'
        ? { display: 'flex', flexWrap: 'wrap' }
        : mode === 'media-sequence'
          ? { display: 'flex', flexDirection: 'column' }
          : { gridTemplateColumns: '1fr' };
  if (binding?.attributes.hidden) return null;
  return (
    <PublicDesignContext
      value={{
        ...runtime,
        binding: (role) =>
          role === `${page}.record` ? binding : runtime.binding(role),
      }}
    >
      <article
        className="record-row"
        id={`${collection}-${id}`}
        tabIndex={-1}
        data-design-node={`${page}.record`}
        data-design-content-collection={collection}
        data-design-content-id={String(id)}
        data-record-layout={typeof mode === 'string' ? mode : undefined}
        style={style}
      >
        {children}
      </article>
    </PublicDesignContext>
  );
}
export function BoundRecordDetails({
  node = 'profile.record',
  title,
  children,
}: {
  node?: string;
  title: string;
  children: ReactNode;
}) {
  const expansion = object(
    useDesignBinding(node)?.behavior['record.expansion'],
  );
  return (
    <details
      className="record-disclosure"
      open={
        typeof expansion.expanded === 'boolean' ? expansion.expanded : undefined
      }
    >
      <summary>{title}</summary>
      {children}
    </details>
  );
}
export function BoundRecordSummary({
  node = 'profile.record',
  text,
  label = 'Read full summary',
}: {
  node?: string;
  text: string;
  label?: string;
}) {
  const expansion = object(
    useDesignBinding(node)?.behavior['record.expansion'],
  );
  const limit = expansion.summaryLength;
  if (typeof limit !== 'number') return <p>{text}</p>;
  const preview = summaryPreview(text, limit);
  if (preview === text) return <p>{text}</p>;
  return (
    <>
      {preview && <p>{preview}</p>}
      <BoundRecordDetails node={node} title={label}>
        <p>{text}</p>
      </BoundRecordDetails>
    </>
  );
}
export function BoundRelationGroups({
  groups,
  skill = false,
}: {
  groups: { id: string; children: ReactNode }[];
  skill?: boolean;
}) {
  const config =
    useDesignBinding('profile.skill')?.behavior['skill.contextGrouping'];
  const keys: Record<string, string> = {
    experience: 'experiences',
    education: 'education',
    project: 'projects',
    credential: 'professional-sections',
  };
  const ordered =
    skill && Array.isArray(config)
      ? [...new Set(config)].flatMap((id) =>
          typeof id === 'string'
            ? groups.filter((group) => group.id === keys[id])
            : [],
        )
      : groups;
  return (
    <>
      {ordered.map((group) => (
        <div key={group.id}>{group.children}</div>
      ))}
    </>
  );
}
export function BoundSkillGrid({
  items,
  children,
  node = 'profile.grid',
}: {
  items: PublicRecord[];
  children: ReactNode;
  node?: string;
}) {
  const grid = useDesignBinding(node);
  const skills = useDesignBinding('profile.skill');
  const presentation =
    skills?.behavior['skill.presentation'] ??
    grid?.behavior['skill.presentation'];
  const entries = Children.toArray(children);
  if (grid?.attributes.hidden) return null;
  if (presentation === 'grouped') {
    const groups = [
      ...new Set(
        items.map((item) =>
          typeof item.category === 'string' && item.category
            ? item.category
            : 'Other',
        ),
      ),
    ];
    return (
      <div data-design-node={node}>
        {groups.map((group) => (
          <section key={group}>
            <h3>{group}</h3>
            <div className="skill-grid">
              {items.flatMap((item, i) =>
                (typeof item.category === 'string' && item.category
                  ? item.category
                  : 'Other') === group
                  ? [entries[i]]
                  : [],
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div
      className="skill-grid"
      data-design-node={node}
      data-skill-presentation={
        typeof presentation === 'string' ? presentation : undefined
      }
      style={
        presentation === 'rows'
          ? { gridTemplateColumns: '1fr' }
          : presentation === 'chips'
            ? { display: 'flex', flexWrap: 'wrap', gap: 12 }
            : undefined
      }
    >
      {children}
    </div>
  );
}
export function BoundSkillCard({
  id,
  title,
  node = 'profile.skill',
  children,
}: {
  id: string;
  title: string;
  node?: string;
  children: ReactNode;
}) {
  const binding = useRecordDesignBinding(node, 'skills', id);
  const runtime = usePublicDesignRuntime();
  const behavior = binding?.behavior || {};
  if (binding?.attributes.hidden) return null;
  const panel =
    behavior['skill.detailEntry'] === 'panel' ||
    behavior['skill.presentation'] === 'chips';
  const attrs = {
    className: 'skill-card',
    id: `skill-${id}`,
    tabIndex: -1,
    'data-design-node': node,
    'data-design-content-collection': 'skills',
    'data-design-content-id': id,
  };
  return (
    <PublicDesignContext
      value={{
        ...runtime,
        binding: (role) => (role === node ? binding : runtime.binding(role)),
      }}
    >
      <article {...attrs}>
        {panel ? (
          <details>
            <summary>{title}</summary>
            {children}
          </details>
        ) : (
          children
        )}
      </article>
    </PublicDesignContext>
  );
}

export function BoundPrintButton({
  children,
  node = 'resume.body',
}: {
  children: ReactNode;
  node?: string;
}) {
  const presentation = object(
    useDesignBinding(node)?.behavior['resume.printPresentation'],
  );
  const page = presentation.paper === 'letter' ? 'letter' : 'A4';
  return (
    <>
      {presentation.margins && (
        <style media="print">{`@page{size:${page};margin:${dimension(presentation.margins)}}`}</style>
      )}
      <button
        type="button"
        className="button secondary"
        onClick={() => window.print()}
      >
        {children}
      </button>
    </>
  );
}
