'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ownerApi,
  type OwnerRecord,
  type OwnerRecordPage,
  type OwnerWorkspaceData,
} from './client';
import { OwnerHeading, OwnerShell } from './owner-shell';
import { ContentLibrary } from './content-library';
import { RecordEditor } from './record-editor';
import { MediaLibrary } from './media-library';
import { Publishing } from './publishing';
import { DesignStudio, type StudioRoute } from './design-studio';
import { assertValidDesign } from '@/design/model';
import { createCopperDesign } from '@/design/runtime';

function DesignHost({ workspace }: { workspace: OwnerWorkspaceData }) {
  const [records, setRecords] = useState<OwnerRecord[]>([]),
    [selected, setSelected] = useState<OwnerRecord | null>(null),
    [error, setError] = useState('');
  const [routes, setRoutes] = useState<StudioRoute[]>([
    { pageId: 'home', label: 'Home', path: '/' },
    { pageId: 'work', label: 'Work', path: '/work' },
    { pageId: 'profile', label: 'Profile', path: '/profile' },
    { pageId: 'journal', label: 'Journal', path: '/journal' },
    { pageId: 'contact', label: 'Contact', path: '/contact' },
    { pageId: 'resume', label: 'Resume', path: '/resume' },
    { pageId: 'search', label: 'Search', path: '/search' },
    { pageId: 'not-found', label: 'Missing page', path: '/not-found' },
  ]);
  useEffect(() => {
    let active = true;
    (async () => {
      const output: OwnerRecord[] = [];
      let page = 1,
        total = 1;
      do {
        const result = await ownerApi<OwnerRecordPage>(
          `/api/owner/records/design-themes?page=${page}&limit=100`,
        );
        output.push(...result.docs);
        total = result.totalPages;
        page++;
      } while (page <= total);
      if (active) {
        setRecords(output);
        setSelected(
          output.find(
            (record) =>
              String(record.id) ===
              String(workspace.publication?.designRecordId),
          ) ||
            output[0] ||
            null,
        );
      }
      const pub = await ownerApi<{
        content?: Record<string, { slug: string }[]>;
      }>('/api/publication');
      if (active)
        setRoutes((previous) => [
          ...previous,
          ...(pub?.content?.projects?.[0]
            ? [
                {
                  pageId: 'case-study',
                  label: 'Case study',
                  path: `/work/${pub.content.projects[0].slug}`,
                },
              ]
            : []),
          ...(pub?.content?.posts?.[0]
            ? [
                {
                  pageId: 'article',
                  label: 'Article',
                  path: `/journal/${pub.content.posts[0].slug}`,
                },
              ]
            : []),
        ]);
    })().catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => {
      active = false;
    };
  }, [workspace.publication?.designRecordId]);
  let document;
  try {
    document = selected
      ? assertValidDesign(selected.data.data)
      : createCopperDesign();
  } catch {
    return (
      <p role="alert">
        This saved design is invalid. Restore a valid version in the configured
        CMS before opening it.
      </p>
    );
  }
  return (
    <>
      <div className="owner-toolbar">
        <label className="owner-field">
          <span className="owner-label">Design draft</span>
          <select
            value={selected?.id || ''}
            onChange={(e) => {
              if (
                window.confirm(
                  'Switch design draft? Save or export unsaved changes first.',
                )
              )
                setSelected(
                  records.find((item) => String(item.id) === e.target.value) ||
                    null,
                );
            }}
          >
            <option value="">New design from copper baseline</option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {String(record.data.title || record.id)}
              </option>
            ))}
          </select>
        </label>
        <Link className="owner-button" href="/owner/publishing">
          Publishing →
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      <DesignStudio
        key={selected?.id || 'new'}
        initial={{
          document,
          revision: selected?.revision || '',
          recordId: String(selected?.id || ''),
          versionId: selected?.versionId ?? undefined,
          liveRevision: workspace.publication?.revision || undefined,
        }}
        previewRoutes={routes}
      />
    </>
  );
}

function Overview({ workspace }: { workspace: OwnerWorkspaceData }) {
  return (
    <>
      <OwnerHeading
        eyebrow="Owner workspace"
        title="Your content, in one place."
        description="Choose what to work on. Draft edits stay private until you publish a reviewed selection."
      />
      <div className="owner-grid">
        <section className="owner-panel">
          <h2>Profile</h2>
          <p className="owner-muted">
            Update your introduction, grouped experience, education and skills.
          </p>
          <Link
            className="owner-button owner-primary"
            href="/owner/content/profile"
          >
            Edit profile →
          </Link>
        </section>
        <section className="owner-panel">
          <h2>Design Studio</h2>
          <p className="owner-muted">
            Customize colors, typography, layouts, breakpoints and motion.
          </p>
          <Link className="owner-button" href="/owner/design">
            Open studio →
          </Link>
        </section>
      </div>
      <section className="owner-panel">
        <h2>Content collections</h2>
        {workspace.collections
          .filter(
            (collection) =>
              !['design-themes', 'media'].includes(collection.slug),
          )
          .map((collection) => (
            <div className="owner-row" key={collection.slug}>
              <div>
                <strong className="owner-row-title">{collection.label}</strong>
                <span className="owner-row-meta">
                  Private drafts · saved versions
                </span>
              </div>
              <Link
                className="owner-button"
                href={`/owner/content/${collection.slug}`}
              >
                Manage →
              </Link>
            </div>
          ))}
      </section>
      <div className="owner-notice">
        <strong>
          {workspace.publication
            ? 'A selected publication is live.'
            : 'Nothing is published yet.'}
        </strong>
        <p>
          Saving a draft does not change the live site. Review exact content and
          design versions in <Link href="/owner/publishing">Publishing</Link>.
        </p>
      </div>
    </>
  );
}

export function OwnerWorkspace({
  segments,
  email,
}: {
  segments: string[];
  email: string;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OwnerWorkspaceData | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    ownerApi<OwnerWorkspaceData>('/api/owner/workspace')
      .then((data) => {
        if (active) setWorkspace(data);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function refresh() {
    setWorkspace(await ownerApi<OwnerWorkspaceData>('/api/owner/workspace'));
  }
  const path = '/owner' + (segments.length ? '/' + segments.join('/') : '');
  const collection = workspace?.collections.find(
    (item) => item.slug === segments[1],
  );
  return (
    <OwnerShell
      path={path}
      email={email}
      onLogout={async () => {
        await ownerApi('/api/owners/logout', { method: 'POST' });
        router.replace('/owner/login');
        router.refresh();
      }}
    >
      {error ? (
        <p className="owner-notice" data-tone="error" role="alert">
          {error} <Link href="/owner/login">Sign in again</Link>
        </p>
      ) : !workspace ? (
        <p role="status">Loading your private workspace…</p>
      ) : !segments.length ? (
        <Overview workspace={workspace} />
      ) : segments[0] === 'design' ? (
        <DesignHost workspace={workspace} />
      ) : segments[0] === 'media' ? (
        <MediaLibrary limits={workspace.limits} />
      ) : segments[0] === 'publishing' ? (
        <Publishing workspace={workspace} onRefresh={refresh} />
      ) : segments[0] === 'content' && collection ? (
        segments[2] ? (
          <RecordEditor
            key={`${collection.slug}:${segments[2]}`}
            collection={collection}
            id={segments[2]}
          />
        ) : (
          <ContentLibrary
            key={collection.slug}
            collection={collection}
            collections={workspace.collections}
          />
        )
      ) : (
        <>
          <OwnerHeading title="Workspace page not found" />
          <Link href="/owner">Return to content</Link>
        </>
      )}
    </OwnerShell>
  );
}
