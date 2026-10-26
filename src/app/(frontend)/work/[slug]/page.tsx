import { GitHubMetadata } from '@/components/public/github-metadata';
import { ShareLinks } from '@/components/public/share-links';
import { siteOrigin, publicOrigin } from '@/public-data/discovery';
import { routeMetadata } from '@/public-data/discovery';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSite } from '@/public-data/server';
import {
  list,
  recordBySlug,
  records,
  resolveRedirect,
  safeHref,
  text,
} from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  Action,
  dateRange,
  Media,
  PageIntro,
  ProjectGrid,
} from '@/components/public/primitives';
import { Relations } from '@/components/public/professional';
import { RichText } from '@/components/public/rich-text';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return routeMetadata(await getPublicSite(), '/work/' + slug);
}
export default async function CaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getPublicSite();
  const redirect = resolveRedirect(site, `/work/${slug}`);
  if (redirect) permanentRedirect(redirect);
  const project = recordBySlug(site, 'projects', slug);
  if (!project) notFound();
  const other = records(site, 'projects').filter(
    (record) => record.id !== project.id,
  );
  const blocks = [
    ['problem', 'The problem'],
    ['contribution', 'My contribution'],
    ['approach', 'Approach'],
    ['architecture', 'Architecture'],
    ['results', 'Results'],
    ['limitations', 'Limitations'],
    ['lineage', 'Origin & lineage'],
    ['credits', 'Credits'],
  ] as const;
  return (
    <PublicPage
      site={site}
      pageId="case-study"
      record={project}
      slots={{
        'case-study.hero': (
          <section
            className="content reading-content"
            id="overview"
            data-section="Overview"
            tabIndex={-1}
          >
            <p className="eyebrow" style={{ paddingTop: 32 }}>
              <Link href="/work">← All work</Link>
            </p>
            <PageIntro
              page="case-study"
              title={project.title}
              eyebrow={text(project.discipline)}
              left
            >
              {project.summary}
            </PageIntro>
            <dl className="case-meta">
              {[
                ['Role', text(project.role)],
                ['Status', text(project.workStatus)],
                ['Timeline', dateRange(project)],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <Media site={site} value={project.media} page="case-study" />
          </section>
        ),
        'case-study.body': (
          <section
            className="section content reading-content"
            id="case-study"
            data-section="Case study"
            tabIndex={-1}
            data-design-content-collection="projects"
            data-design-content-id={String(project.id)}
          >
            {blocks
              .filter(([field]) => project[field])
              .map(([field, label]) => (
                <div className="case-block" key={field} id={field}>
                  <h2>{label}</h2>
                  <p data-design-node="case-study.text">
                    {text(project[field])}
                  </p>
                </div>
              ))}
            {project.body ? <RichText value={project.body} /> : null}
            {project.collaborators ? (
              <div className="case-block">
                <h2>Collaboration</h2>
                <p>{text(project.collaborators)}</p>
              </div>
            ) : null}
            <Relations site={site} collection="projects" record={project} />
            <ShareLinks
              url={siteOrigin() + '/work/' + project.slug}
              publicURL={publicOrigin(siteOrigin())}
            />
            <GitHubMetadata project={project} />
            <div className="button-group">
              {list(project.links)
                .filter((link) => safeHref(link.url))
                .map((link, index) => (
                  <Action
                    key={index}
                    href={text(link.url)}
                    node="case-study.secondary-action"
                  >
                    {text(link.label, 'View link')}
                  </Action>
                ))}
            </div>
          </section>
        ),
        'case-study.related': other.length ? (
          <section
            className="section content reading-content"
            id="related"
            data-section="More work"
            tabIndex={-1}
          >
            <h2>Keep exploring.</h2>
            <ProjectGrid site={site} items={other} page="case-study" />
          </section>
        ) : null,
      }}
    />
  );
}
