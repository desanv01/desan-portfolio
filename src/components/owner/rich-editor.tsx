'use client';

import { useId } from 'react';

type Node = {
  type?: string;
  children?: Node[];
  text?: string;
  format?: string | number;
  [key: string]: unknown;
};
const leaf = (text = ''): Node => ({
  type: 'text',
  version: 1,
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
});
const block = (type = 'paragraph'): Node => ({
  type,
  version: 1,
  children: type === 'horizontalrule' ? [] : [leaf()],
  direction: null,
  format: '',
  indent: 0,
  ...(type === 'heading' ? { tag: 'h2' } : {}),
  ...(type === 'list'
    ? {
        listType: 'bullet',
        tag: 'ul',
        start: 1,
        children: [
          {
            type: 'listitem',
            version: 1,
            value: 1,
            children: [leaf()],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
      }
    : {}),
});

export function RichEditor({
  value,
  onChange,
  label,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
  label: string;
}) {
  const prefix = useId();
  const original =
    value && typeof value === 'object' ? (value as { root?: Node }) : {};
  const root = original.root || {
    type: 'root',
    version: 1,
    children: [],
    direction: null,
    format: '',
    indent: 0,
  };
  function editNode(
    node: Node,
    update: (next: Node) => void,
    path: string,
    depth = 0,
  ) {
    if (depth > 15)
      return (
        <p>
          This deeply nested block is preserved. Use the configured CMS editor
          for its structure.
        </p>
      );
    if (node.type === 'text' || node.type === 'code-highlight')
      return (
        <div className="owner-field">
          <label className="owner-label" htmlFor={`${prefix}-${path}`}>
            Text
          </label>
          <div className="owner-rich-toolbar">
            {(
              [
                ['Bold', 1],
                ['Italic', 2],
                ['Underline', 8],
                ['Code', 16],
              ] as const
            ).map(([name, bit]) => (
              <button
                type="button"
                key={name}
                aria-pressed={Boolean(Number(node.format || 0) & bit)}
                onClick={() =>
                  update({ ...node, format: Number(node.format || 0) ^ bit })
                }
              >
                {name}
              </button>
            ))}
          </div>
          <textarea
            id={`${prefix}-${path}`}
            value={node.text || ''}
            onChange={(e) => update({ ...node, text: e.target.value })}
            rows={2}
          />
        </div>
      );
    const children = node.children || [];
    return (
      <div>
        {node.type === 'heading' && (
          <label className="owner-field">
            <span className="owner-label">Heading level</span>
            <select
              value={String(node.tag || 'h2')}
              onChange={(e) => update({ ...node, tag: e.target.value })}
            >
              <option>h2</option>
              <option>h3</option>
              <option>h4</option>
            </select>
          </label>
        )}
        {node.type === 'list' && (
          <label className="owner-field">
            <span className="owner-label">List style</span>
            <select
              value={String(node.listType || 'bullet')}
              onChange={(e) =>
                update({
                  ...node,
                  listType: e.target.value,
                  tag: e.target.value === 'number' ? 'ol' : 'ul',
                })
              }
            >
              <option value="bullet">Bullets</option>
              <option value="number">Numbered</option>
            </select>
          </label>
        )}
        {(node.type === 'link' || node.type === 'autolink') && (
          <label className="owner-field">
            <span className="owner-label">Destination</span>
            <input
              value={String(
                (node.fields as Record<string, unknown>)?.url || node.url || '',
              )}
              onChange={(e) =>
                update({
                  ...node,
                  fields: {
                    ...(node.fields as object),
                    url: e.target.value,
                    linkType: 'custom',
                  },
                })
              }
            />
          </label>
        )}
        {children.map((child, index) => (
          <div className="owner-rich-block" key={index}>
            <div className="owner-array-head">
              <span className="owner-label">
                {child.type || 'Preserved block'} {index + 1}
              </span>
              <div className="owner-actions">
                <button
                  type="button"
                  disabled={!index}
                  aria-label={`Move block ${index + 1} up`}
                  onClick={() => {
                    const next = [...children];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    update({ ...node, children: next });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Remove block ${index + 1}`}
                  onClick={() =>
                    update({
                      ...node,
                      children: children.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
            {editNode(
              child,
              (next) =>
                update({
                  ...node,
                  children: children.map((item, i) =>
                    i === index ? next : item,
                  ),
                }),
              `${path}-${index}`,
              depth + 1,
            )}
          </div>
        ))}
        {node.type !== 'horizontalrule' && (
          <div className="owner-rich-toolbar">
            <button
              type="button"
              onClick={() =>
                update({
                  ...node,
                  children: [
                    ...children,
                    node.type === 'list'
                      ? {
                          type: 'listitem',
                          version: 1,
                          value: children.length + 1,
                          children: [leaf()],
                          format: '',
                          indent: 0,
                          direction: null,
                        }
                      : leaf(),
                  ],
                })
              }
            >
              {node.type === 'list' ? 'Add list item' : 'Add text'}
            </button>
            {node.type !== 'list' && (
              <button
                type="button"
                onClick={() =>
                  update({
                    ...node,
                    children: [
                      ...children,
                      {
                        type: 'link',
                        version: 3,
                        fields: { url: '', linkType: 'custom', newTab: false },
                        children: [leaf('Link text')],
                        direction: null,
                        format: '',
                        indent: 0,
                      },
                    ],
                  })
                }
              >
                Add link
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <fieldset className="owner-panel">
      <legend>{label}</legend>
      <p className="owner-muted">
        Compose paragraphs, headings, lists, quotes and code. Formatting and
        existing blocks are preserved.
      </p>
      {(root.children || []).map((node, index) => (
        <details className="owner-rich-block" key={index} open={index < 2}>
          <summary>
            {node.type || 'Block'} {index + 1}
            {node.children?.find((child) => child.text)?.text
              ? ` — ${node.children.find((child) => child.text)?.text?.slice(0, 60)}`
              : ''}
          </summary>
          <div className="owner-rich-toolbar">
            <button
              type="button"
              disabled={!index}
              onClick={() => {
                const children = [...(root.children || [])];
                [children[index - 1], children[index]] = [
                  children[index],
                  children[index - 1],
                ];
                onChange({ ...original, root: { ...root, children } });
              }}
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...original,
                  root: {
                    ...root,
                    children: root.children?.filter((_, i) => i !== index),
                  },
                })
              }
            >
              Remove block
            </button>
          </div>
          {editNode(
            node,
            (next) =>
              onChange({
                ...original,
                root: {
                  ...root,
                  children: root.children?.map((item, i) =>
                    i === index ? next : item,
                  ),
                },
              }),
            String(index),
          )}
        </details>
      ))}
      <div className="owner-rich-toolbar">
        {[
          'paragraph',
          'heading',
          'quote',
          'list',
          'code',
          'horizontalrule',
        ].map((type) => (
          <button
            type="button"
            key={type}
            onClick={() =>
              onChange({
                ...original,
                root: {
                  ...root,
                  children: [...(root.children || []), block(type)],
                },
              })
            }
          >
            + {type === 'horizontalrule' ? 'Divider' : type}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
