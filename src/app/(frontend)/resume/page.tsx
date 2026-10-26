import { routeMetadata } from '@/public-data/discovery';
import { getPublicSite } from '@/public-data/server';
import { records, text } from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import { Action, PageIntro } from '@/components/public/primitives';
import { PrintButton } from '@/components/public/site-chrome';
import {
  EducationRecords,
  ExperienceRecords,
} from '@/components/public/professional';
export default async function Resume() {
  const site = await getPublicSite();
  const profile = records(site, 'profile')[0];
  return (
    <PublicPage
      site={site}
      pageId="resume"
      slots={{
        'resume.hero': (
          <section
            className="content reading-content"
            id="resume"
            data-section="Resume"
            tabIndex={-1}
          >
            <PageIntro page="resume" title="Resume">
              A concise view of <span className="expressive">the journey.</span>
            </PageIntro>
            <div className="error-banner">
              <h2>PDF unavailable</h2>
              <p>
                A downloadable resume has not been published. You can explore
                the full profile or print the public summary below.
              </p>
              <div className="button-group">
                <Action href="/profile">View full profile</Action>
                <PrintButton />
              </div>
            </div>
          </section>
        ),
        'resume.body': (
          <section
            className="section content reading-content"
            id="summary"
            data-section="Public summary"
            tabIndex={-1}
          >
            <h2>{text(profile?.displayName, 'Public profile')}</h2>
            <p>{text(profile?.headline)}</p>
            <p>{profile?.summary}</p>
            {records(site, 'experiences').length > 0 && (
              <>
                <h2>Experience</h2>
                <ExperienceRecords
                  page="resume"
                  site={site}
                  items={records(site, 'experiences')}
                />
              </>
            )}
            {records(site, 'education').length > 0 && (
              <>
                <h2>Education</h2>
                <EducationRecords
                  page="resume"
                  site={site}
                  items={records(site, 'education')}
                />
              </>
            )}
          </section>
        ),
      }}
    />
  );
}

export async function generateMetadata() {
  return routeMetadata(await getPublicSite(), '/resume');
}
