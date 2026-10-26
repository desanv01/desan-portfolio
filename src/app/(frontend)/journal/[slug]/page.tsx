import { ShareLinks } from '@/components/public/share-links';
import { siteOrigin, publicOrigin } from '@/public-data/discovery';
import { routeMetadata } from '@/public-data/discovery';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSite } from '@/public-data/server';
import {
  plainText,
  recordBySlug,
  records,
  resolveRedirect,
  text,
} from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  formatDate,
  JournalRows,
  PageIntro,
} from '@/components/public/primitives';
import { Relations } from '@/components/public/professional';
import { RichText } from '@/components/public/rich-text';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return routeMetadata(await getPublicSite(), '/journal/' + slug);
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getPublicSite();
  const redirect = resolveRedirect(site, `/journal/${slug}`);
  if (redirect) permanentRedirect(redirect);
  const post = recordBySlug(site, 'posts', slug);
  if (!post) notFound();
  const related = records(site, 'posts').filter(
    (record) => record.id !== post.id,
  );
  const minutes = Math.max(
    1,
    Math.ceil(plainText(post.body).split(/\s+/).length / 220),
  );
  return (
    <PublicPage
      site={site}
      pageId="article"
      record={post}
      slots={{
        'article.hero': (
          <section
            className="content reading-content"
            id="overview"
            data-section="Overview"
            tabIndex={-1}
          >
            <p className="eyebrow" style={{ paddingTop: 32 }}>
              <Link href="/journal">← Journal</Link>
            </p>
            <PageIntro
              page="article"
              title={post.title}
              eyebrow={text(post.kind, 'Article')}
            >
              {post.summary}
            </PageIntro>
            <div className="article-meta">
              <span>{formatDate(post.editorialDate || post.publishedAt)}</span>
              <span>{minutes} min read</span>
            </div>
          </section>
        ),
        'article.body': (
          <article
            className="section content reading-content"
            id="article"
            data-section="Article"
            tabIndex={-1}
            data-design-node="article.article"
            data-design-content-collection="posts"
            data-design-content-id={String(post.id)}
          >
            {post.body ? <RichText value={post.body} /> : <p>{post.summary}</p>}
            <Relations site={site} collection="posts" record={post} />
            <ShareLinks
              url={siteOrigin() + '/journal/' + post.slug}
              publicURL={publicOrigin(siteOrigin())}
            />
          </article>
        ),
        'article.related': related.length ? (
          <section
            className="section content reading-content"
            id="related"
            data-section="More to read"
            tabIndex={-1}
          >
            <h2>More to read.</h2>
            <JournalRows items={related} page="article" />
          </section>
        ) : null,
      }}
    />
  );
}
