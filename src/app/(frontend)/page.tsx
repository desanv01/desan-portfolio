import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getPublicSite } from '@/public-data/server';
import { records, text } from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  Action,
  EmptyState,
  JournalRows,
  ProjectGrid,
  PublicationNotice,
} from '@/components/public/primitives';

export default async function Home() {
  const site = await getPublicSite();
  const profile = records(site, 'profile')[0];
  const projects = records(site, 'projects').filter(
    (record) => record.featured,
  );
  const posts = records(site, 'posts');
  const name = text(profile?.displayName, 'Desan Vasu').split(' ');
  return (
    <PublicPage
      site={site}
      pageId="home"
      slots={{
        'home.hero': (
          <section
            className="home-hero"
            id="home"
            data-section="Home"
            tabIndex={-1}
          >
            <div className="hero-inner">
              <PublicationNotice site={site} />
              <h1
                className="hero-name"
                data-design-node="home.title"
                style={
                  {
                    '--hero-name-fit': `${100 / (Math.max(1, ...name.map((word) => [...word].length)) * 1.3)}vw`,
                  } as CSSProperties
                }
              >
                {name[0]?.toUpperCase()}
                <span className="name-break">
                  {' '}
                  {name.slice(1).join(' ').toUpperCase()}
                </span>
              </h1>
              <h2 className="hero-heading" data-design-node="home.subtitle">
                Engineering ideas.{' '}
                <span className="expressive">Thoughtfully built.</span>
              </h2>
              <p className="hero-description" data-design-node="home.text">
                {text(
                  profile?.headline,
                  'A space for selected work, ideas and a professional journey.',
                )}
              </p>
              <div className="button-group">
                <Action href="/work" primary node="home.primary-action">
                  Explore work
                </Action>
                <Action href="/profile" node="home.secondary-action">
                  View profile
                </Action>
              </div>
              <p className="hero-tags" data-design-node="home.meta">
                {records(site, 'skills')
                  .filter((record) => record.featured)
                  .map((record) => record.title)
                  .join(' · ')}
              </p>
            </div>
          </section>
        ),
        'home.work': (
          <section
            className="section content reading-content"
            id="selected-work"
            data-section="Selected work"
            tabIndex={-1}
          >
            <div className="section-heading">
              <h2>Selected work</h2>
              <Link className="text-link" href="/work">
                All work ↗
              </Link>
            </div>
            {projects.length ? (
              <ProjectGrid items={projects} site={site} page="home" />
            ) : (
              <EmptyState page="home">
                Selected projects will appear here when published.
              </EmptyState>
            )}
          </section>
        ),
        'home.profile': (
          <section
            className="section content reading-content"
            id="profile"
            data-section="Profile"
            tabIndex={-1}
          >
            <p className="eyebrow">A little context</p>
            <h2>Behind the work.</h2>
            <p className="hero-description" style={{ margin: '0 0 28px' }}>
              {profile?.summary ||
                'Explore the professional profile and the skills behind selected projects.'}
            </p>
            <Action href="/profile" node="home.secondary-action">
              Explore profile
            </Action>
          </section>
        ),
        'home.journal': (
          <section
            className="section content reading-content"
            id="journal"
            data-section="Journal"
            tabIndex={-1}
          >
            <div className="section-heading">
              <h2>Notes &amp; ideas</h2>
              <Link className="text-link" href="/journal">
                All entries ↗
              </Link>
            </div>
            {posts.length ? (
              <JournalRows items={posts} page="home" />
            ) : (
              <EmptyState page="home">
                Published articles and updates will appear here.
              </EmptyState>
            )}
          </section>
        ),
        'home.contact': (
          <section
            className="section content reading-content"
            id="contact"
            data-section="Contact"
            tabIndex={-1}
          >
            <p className="eyebrow">Start a conversation</p>
            <h2>
              Let’s build{' '}
              <span className="expressive">something meaningful.</span>
            </h2>
            <Action href="/contact" primary node="home.primary-action">
              Get in touch
            </Action>
          </section>
        ),
      }}
    />
  );
}
