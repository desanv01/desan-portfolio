import { routeMetadata } from '@/public-data/discovery';
import Link from 'next/link';
import { getPublicSite } from '@/public-data/server';
import {
  filterRecords,
  list,
  records,
  recordsForSkill,
  text,
} from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  EmptyState,
  PageIntro,
  PublicationNotice,
  queryURL,
  SearchForm,
} from '@/components/public/primitives';
import {
  EducationRecords,
  ExperienceRecords,
  ProfessionalRecords,
  Relations,
} from '@/components/public/professional';
import { RichText } from '@/components/public/rich-text';
import { queryValue, type Query } from '@/components/public/library';
import {
  BoundSkillGrid,
  BoundSkillCard,
} from '@/components/public/bound-professional';
import { BoundFilterBar } from '@/components/public/bound-form';
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const site = await getPublicSite();
  const query = await searchParams;
  const profile = records(site, 'profile')[0];
  const experience = records(site, 'experiences');
  const education = records(site, 'education');
  const professional = records(site, 'professional-sections');
  const allSkills = records(site, 'skills');
  const q = queryValue(query, 'q');
  const category = queryValue(query, 'category');
  const skillItems = filterRecords(allSkills, { query: q, category });
  const categories = [
    ...new Set(
      allSkills.map((record) => text(record.category)).filter(Boolean),
    ),
  ];
  return (
    <PublicPage
      site={site}
      pageId="profile"
      slots={{
        'profile.hero': (
          <section
            className="content reading-content"
            id="overview"
            data-section="Overview"
            tabIndex={-1}
          >
            <PageIntro page="profile" title="Profile">
              The person <span className="expressive">behind the work.</span>
            </PageIntro>
            <PublicationNotice site={site} />
            <nav className="profile-tabs" aria-label="Profile sections">
              {[
                ['experience', experience.length],
                ['education', education.length],
                ['skills', allSkills.length],
                ['professional', professional.length],
              ]
                .filter(([, count]) => count)
                .map(([id]) => (
                  <a key={id} href={`#${id}`}>
                    {String(id).replace('professional', 'More')}
                  </a>
                ))}
            </nav>
            {profile && (
              <>
                <h2>{text(profile.displayName, profile.title)}</h2>
                <p className="lede">{text(profile.headline)}</p>
                <p className="record-meta">
                  {[text(profile.region), text(profile.availability)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p>{profile.summary}</p>
                {profile.body ? <RichText value={profile.body} /> : null}
              </>
            )}
            {!profile && (
              <EmptyState page="profile">
                The public profile is being prepared.
              </EmptyState>
            )}
          </section>
        ),
        'profile.experience': experience.length ? (
          <section
            className="section content reading-content"
            id="experience"
            data-section="Experience"
            tabIndex={-1}
          >
            <h2>Experience</h2>
            <ExperienceRecords items={experience} site={site} />
          </section>
        ) : null,
        'profile.education': education.length ? (
          <section
            className="section content reading-content"
            id="education"
            data-section="Education"
            tabIndex={-1}
          >
            <h2>Education</h2>
            <EducationRecords items={education} site={site} />
          </section>
        ) : null,
        'profile.skills': allSkills.length ? (
          <section
            className="section content reading-content"
            id="skills"
            data-section="Skills"
            tabIndex={-1}
          >
            <h2>
              Skills <span className="expressive">in context.</span>
            </h2>
            <p>Explore the work and learning connected to each skill.</p>
            <SearchForm
              action="/profile#skills"
              page="profile"
              initial={q}
              label="Search skills"
              hidden={category ? { category } : {}}
            />
            <BoundFilterBar
              node="profile.filter"
              label="Skill categories"
              options={['', ...categories].map((value) => ({
                href: `${queryURL('/profile', { q, category: value })}#skills`,
                label: value || 'All',
                selected: category === value,
              }))}
            >
              {['', ...categories].map((value) => (
                <Link
                  className="filter"
                  key={value}
                  aria-current={category === value ? 'true' : undefined}
                  href={`${queryURL('/profile', { q, category: value })}#skills`}
                >
                  {value || 'All'}
                </Link>
              ))}
            </BoundFilterBar>
            <p className="results-summary">{skillItems.length} skills</p>
            {skillItems.length ? (
              <BoundSkillGrid items={skillItems}>
                {skillItems.map((skill) => (
                  <BoundSkillCard
                    id={String(skill.id)}
                    title={text(skill.canonicalName, skill.title)}
                    key={skill.id}
                  >
                    <h3>{text(skill.canonicalName, skill.title)}</h3>
                    <small>
                      {text(skill.category)} ·{' '}
                      {recordsForSkill(site, skill.id).length} linked records
                    </small>
                    <p>{skill.summary}</p>
                    {list(skill.aliases).length > 0 && (
                      <small>
                        Also known as{' '}
                        {list(skill.aliases)
                          .map((alias) => text(alias.name))
                          .join(', ')}
                      </small>
                    )}
                    <Relations site={site} collection="skills" record={skill} />
                  </BoundSkillCard>
                ))}
              </BoundSkillGrid>
            ) : (
              <EmptyState page="profile" title="No matching skills.">
                Try another search or category.
              </EmptyState>
            )}
          </section>
        ) : null,
        'profile.professional': professional.length ? (
          <section
            className="section content reading-content"
            id="professional"
            data-section="More context"
            tabIndex={-1}
          >
            <h2>More of the journey.</h2>
            <ProfessionalRecords items={professional} site={site} />
          </section>
        ) : null,
      }}
    />
  );
}

export async function generateMetadata() {
  return routeMetadata(await getPublicSite(), '/profile');
}
