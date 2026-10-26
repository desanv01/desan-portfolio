import type { ReactNode } from 'react';
import { PublicAnchor } from './public-link';
import { safeHref } from '@/public-data';

/** Only semantic Lexical nodes are rendered; source markup and private fields are never HTML. */
export function RichText({ value }: { value: unknown }) {
  let inspected = 0;
  function withinBounds(item: unknown, depth = 0): boolean {
    if (++inspected > 10000 || depth > 40) return false;
    if (!item || typeof item !== 'object') return true;
    if (Array.isArray(item))
      return item.every((child) => withinBounds(child, depth + 1));
    const node = item as Record<string, unknown>;
    return node.root
      ? withinBounds(node.root, depth + 1)
      : Array.isArray(node.children)
        ? withinBounds(node.children, depth + 1)
        : true;
  }
  if (!withinBounds(value))
    return (
      <div className="error-banner" role="status">
        This content cannot be displayed right now. Please try another page.
      </div>
    );
  let budget = 0;
  function render(
    value: unknown,
    depth = 0,
    key: number | string = 0,
  ): ReactNode {
    if (++budget > 10000 || depth > 40) return null;
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return null;
    if (Array.isArray(value))
      return value.map((child, index) => render(child, depth + 1, index));
    const node = value as Record<string, unknown>;
    if (node.root) return render(node.root, depth + 1, key);
    const children = Array.isArray(node.children)
      ? node.children.map((child, index) => render(child, depth + 1, index))
      : null;
    if (node.type === 'text') {
      let content: ReactNode = typeof node.text === 'string' ? node.text : '';
      const format = typeof node.format === 'number' ? node.format : 0;
      if (format & 1) content = <strong>{content}</strong>;
      if (format & 2) content = <em>{content}</em>;
      if (format & 4) content = <s>{content}</s>;
      if (format & 8) content = <u>{content}</u>;
      if (format & 16) content = <code>{content}</code>;
      if (format & 32) content = <sub>{content}</sub>;
      if (format & 64) content = <sup>{content}</sup>;
      return <span key={key}>{content}</span>;
    }
    switch (node.type) {
      case 'root':
        return <div key={key}>{children}</div>;
      case 'paragraph':
        return <p key={key}>{children}</p>;
      case 'heading': {
        const Heading =
          node.tag === 'h3' ? 'h3' : node.tag === 'h4' ? 'h4' : 'h2';
        return <Heading key={key}>{children}</Heading>;
      }
      case 'quote':
        return <blockquote key={key}>{children}</blockquote>;
      case 'list':
        return node.listType === 'number' ? (
          <ol
            key={key}
            start={typeof node.start === 'number' ? node.start : undefined}
          >
            {children}
          </ol>
        ) : (
          <ul key={key}>{children}</ul>
        );
      case 'listitem':
        return <li key={key}>{children}</li>;
      case 'linebreak':
        return <br key={key} />;
      case 'code':
        return (
          <pre key={key}>
            <code>{children}</code>
          </pre>
        );
      case 'code-highlight':
        return (
          <span key={key}>
            {typeof node.text === 'string' ? node.text : children}
          </span>
        );
      case 'link':
      case 'autolink': {
        const fields =
          node.fields && typeof node.fields === 'object'
            ? (node.fields as Record<string, unknown>)
            : {};
        const href = safeHref(fields.url || node.url);
        return href ? (
          <PublicAnchor key={key} href={href}>
            {children}
          </PublicAnchor>
        ) : (
          <span key={key}>{children}</span>
        );
      }
      case 'horizontalrule':
        return <hr key={key} />;
      case 'table':
        return (
          <table key={key}>
            <tbody>{children}</tbody>
          </table>
        );
      case 'tablerow':
        return <tr key={key}>{children}</tr>;
      case 'tablecell':
        return node.headerState ? (
          <th key={key}>{children}</th>
        ) : (
          <td key={key}>{children}</td>
        );
      default:
        return <span key={key}>{children}</span>;
    }
  }
  return <div className="article-content">{render(value)}</div>;
}
