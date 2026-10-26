import {
  BoundRecord,
  BoundRecordDetails,
  BoundRecordSummary,
  BoundRelationGroups,
} from './bound-professional';
import Link, { PublicAnchor } from './public-link';
import {
  list,
  recordPath,
  relatedRecords,
  safeHref,
  text,
  type PublicCollection,
  type PublicRecord,
  type PublicSite,
} from '@/public-data';
import { dateRange, formatDate } from './primitives';
import { RichText } from './rich-text';

export function Relations({
  site,
  collection,
  record,
  roleKey,
}: {
  site: PublicSite;
  collection: PublicCollection;
  record: PublicRecord;
  roleKey?: string;
}) {
  const related = relatedRecords(site, { collection, id: record.id, roleKey });
  const groups = [...new Set(related.map((item) => item.collection))];
  const labels: Partial<Record<PublicCollection, string>> = {
    skills: 'Skills',
    projects: 'Projects',
    experiences: 'Experience',
    education: 'Education',
    posts: 'Journal',
    'professional-sections': 'Credentials & context',
  };
  return (
    <BoundRelationGroups
      skill={collection === 'skills'}
      groups={groups.map((group) => ({
        id: group,
        children: (
          <div className="record-relations" key={group}>
            <span>{labels[group] || group}</span>
            <ul className="tag-list">
              {related
                .filter((item) => item.collection === group)
                .map((item) => (
                  <li key={`${item.record.id}-${item.roleKey || ''}`}>
                    <Link
                      className="tag"
                      href={recordPath(
                        item.collection,
                        item.record,
                        item.roleKey,
                      )}
                      title={item.kind?.replaceAll('-', ' ')}
                    >
                      {item.record.title}
                      {item.roleKey &&
                        ` · ${text(list(item.record.roles).find((role) => role.roleKey === item.roleKey)?.role)}`}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ),
      }))}
    />
  );
}
export function ExperienceRecords({
  items,
  site,
  page = 'profile',
}: {
  items: PublicRecord[];
  site: PublicSite;
  page?: string;
}) {
  return (
    <>
      {items.map((record) => (
        <BoundRecord
          page={page}
          key={record.id}
          collection="experiences"
          id={record.id}
        >
          <div className="record-organization">
            {safeHref(record.organizationURL) ? (
              <PublicAnchor href={safeHref(record.organizationURL)!}>
                {text(record.organization, record.title)}
              </PublicAnchor>
            ) : (
              text(record.organization, record.title)
            )}
            <small>
              {list(record.roles).length}{' '}
              {list(record.roles).length === 1 ? 'role' : 'roles'}
            </small>
          </div>
          <div className="record-body">
            {list(record.roles).map((role) => (
              <div
                className="record-role"
                key={text(role.roleKey)}
                id={`experiences-${record.id}-${text(role.roleKey)}`}
                tabIndex={-1}
              >
                <h3>{text(role.role)}</h3>
                <p className="record-meta">
                  {[
                    text(role.employmentType),
                    dateRange(role),
                    text(role.location),
                    text(role.locationType),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {role.responsibilities ? (
                  <BoundRecordSummary
                    node={`${page}.record`}
                    text={text(role.responsibilities)}
                    label="Read full responsibilities"
                  />
                ) : null}
                {role.outcomes || role.contribution ? (
                  <BoundRecordDetails
                    node={`${page}.record`}
                    title="Outcomes & contribution"
                  >
                    {role.outcomes ? <p>{text(role.outcomes)}</p> : null}
                    {role.contribution ? (
                      <p>{text(role.contribution)}</p>
                    ) : null}
                  </BoundRecordDetails>
                ) : null}
                <Relations
                  site={site}
                  collection="experiences"
                  record={record}
                  roleKey={text(role.roleKey)}
                />
              </div>
            ))}
            {record.body ? (
              <BoundRecordDetails
                node={`${page}.record`}
                title="More about this experience"
              >
                <RichText value={record.body} />
              </BoundRecordDetails>
            ) : null}
          </div>
        </BoundRecord>
      ))}
    </>
  );
}
export function EducationRecords({
  items,
  site,
  page = 'profile',
}: {
  items: PublicRecord[];
  site: PublicSite;
  page?: string;
}) {
  return (
    <>
      {items.map((record) => (
        <BoundRecord
          page={page}
          key={record.id}
          collection="education"
          id={record.id}
        >
          <div className="record-organization">
            {text(record.institution, record.title)}
          </div>
          <div className="record-body">
            <h3>{text(record.qualification, record.title)}</h3>
            <p>{text(record.fieldOfStudy)}</p>
            <p className="record-meta">
              {[dateRange(record), text(record.completionStatus)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {record.showGrade && record.grade ? (
              <p>Grade: {text(record.grade)}</p>
            ) : null}
            {record.summary && (
              <BoundRecordSummary
                node={`${page}.record`}
                text={record.summary}
              />
            )}
            {record.activities || record.coursework || record.body ? (
              <BoundRecordDetails
                node={`${page}.record`}
                title="Activities, coursework & details"
              >
                {record.activities ? (
                  <>
                    <h4>Activities</h4>
                    <p>{text(record.activities)}</p>
                  </>
                ) : null}
                {record.coursework ? (
                  <>
                    <h4>Coursework</h4>
                    <p>{text(record.coursework)}</p>
                  </>
                ) : null}
                {record.body ? <RichText value={record.body} /> : null}
              </BoundRecordDetails>
            ) : null}
            <Relations site={site} collection="education" record={record} />
          </div>
        </BoundRecord>
      ))}
    </>
  );
}
const professionalFields: Record<string, string[]> = {
  credential: ['issuer', 'issueDate', 'expiryDate', 'credentialId'],
  course: ['provider', 'courseCode', 'completionStatus'],
  award: ['issuer', 'issueDate'],
  volunteering: ['organization', 'role', 'cause', 'contribution'],
  publication: [
    'authors',
    'publisher',
    'issueDate',
    'identifier',
    'contribution',
  ],
  patent: [
    'authors',
    'identifier',
    'jurisdiction',
    'patentStatus',
    'contribution',
  ],
  'test-score': ['issuer', 'issueDate', 'result', 'scale'],
  language: ['proficiency'],
  organization: ['organization', 'role'],
  cause: ['cause', 'contribution'],
  'career-break': ['scope'],
  service: ['scope', 'deliveryMode', 'price'],
  featured: ['provider'],
  testimonial: ['author', 'relationship'],
};
const fieldLabels: Record<string, string> = {
  issueDate: 'Issued',
  expiryDate: 'Expires',
  credentialId: 'Credential ID',
  courseCode: 'Course',
  completionStatus: 'Status',
  patentStatus: 'Status',
  deliveryMode: 'Delivery',
};
export function ProfessionalRecords({
  items,
  site,
  page = 'profile',
}: {
  items: PublicRecord[];
  site: PublicSite;
  page?: string;
}) {
  return (
    <>
      {items.map((record) => (
        <BoundRecord
          page={page}
          key={record.id}
          collection="professional-sections"
          id={record.id}
        >
          <div className="record-organization">
            {text(record.kind).replaceAll('-', ' ')}
            <small>{dateRange(record)}</small>
          </div>
          <div className="record-body">
            <h3>{record.title}</h3>
            {record.summary && (
              <BoundRecordSummary
                node={`${page}.record`}
                text={record.summary}
              />
            )}
            <dl className="professional-details">
              {(professionalFields[text(record.kind)] || [])
                .filter(
                  (key) =>
                    record[key] &&
                    (key !== 'credentialId' || record.showCredentialId) &&
                    (key !== 'price' || record.showPrice),
                )
                .map((key) => (
                  <div key={key}>
                    <dt>{fieldLabels[key] || key}</dt>
                    <dd>
                      {key.endsWith('Date')
                        ? formatDate(record[key])
                        : text(record[key])}
                    </dd>
                  </div>
                ))}
              {record.noExpiry && record.kind === 'credential' ? (
                <div>
                  <dt>Expiry</dt>
                  <dd>No expiry</dd>
                </div>
              ) : null}
            </dl>
            {record.quote ? (
              <blockquote>{text(record.quote)}</blockquote>
            ) : null}
            {record.body ? (
              <BoundRecordDetails node={`${page}.record`} title="Read details">
                <RichText value={record.body} />
              </BoundRecordDetails>
            ) : null}
            {safeHref(record.url) && (
              <PublicAnchor href={safeHref(record.url)!} className="text-link">
                View source ↗
              </PublicAnchor>
            )}
            <Relations
              site={site}
              collection="professional-sections"
              record={record}
            />
          </div>
        </BoundRecord>
      ))}
    </>
  );
}
