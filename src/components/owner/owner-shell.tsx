'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';

const links = [
  ['Content', '/owner', '▤'],
  ['Profile', '/owner/content/profile', '○'],
  ['Work', '/owner/content/projects', '□'],
  ['Journal', '/owner/content/posts', '≡'],
  ['Media', '/owner/media', '▧'],
  ['Design Studio', '/owner/design', '⚒'],
  ['Publishing', '/owner/publishing', '↗'],
  ['Settings', '/owner/content/site-settings', '⚙'],
];

export function OwnerShell({
  path,
  email,
  children,
  onLogout,
}: {
  path: string;
  email: string;
  children: ReactNode;
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const menu = useRef<HTMLButtonElement>(null);
  const label =
    links.find(
      ([, href]) =>
        path === href || (href !== '/owner' && path.startsWith(href)),
    )?.[0] || 'Content';
  return (
    <div className="owner-app">
      <a className="owner-skip" href="#owner-main">
        Skip to workspace
      </a>
      <header className="owner-topbar">
        <Link className="owner-brand" href="/owner" aria-label="Owner home">
          <strong>DV</strong>
          <span>OWNER</span>
        </Link>
        <div className="owner-topbar-title">{label}</div>
        <span className="owner-private-label">Private workspace</span>
        <Link className="owner-button" href="/" target="_blank">
          View live site ↗
        </Link>
        <button
          ref={menu}
          className="owner-mobile-menu"
          aria-expanded={open}
          aria-controls="owner-navigation"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
      </header>
      <aside
        id="owner-navigation"
        className={`owner-sidebar ${open ? 'is-open' : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            menu.current?.focus();
          }
        }}
      >
        <nav aria-label="Owner navigation">
          {links.map(([title, href, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                path === href || (href !== '/owner' && path.startsWith(href))
                  ? 'page'
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">{icon}</span>
              {title}
            </Link>
          ))}
        </nav>
        <div className="owner-account">
          <span>{email}</span>
          <small>Owner access</small>
          <button
            onClick={async () => {
              try {
                await onLogout();
              } catch {
                setLogoutError('Sign out failed. Please retry.');
              }
            }}
          >
            Sign out
          </button>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </aside>
      <main id="owner-main" className="owner-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function OwnerHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="owner-heading">
      <div>
        {eyebrow && <p className="owner-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="owner-actions">{actions}</div>}
    </div>
  );
}
