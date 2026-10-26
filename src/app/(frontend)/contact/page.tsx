import { routeMetadata } from '@/public-data/discovery';
import { getPublicSite } from '@/public-data/server';
import { list, records, safeHref, text } from '@/public-data';
import { PublicPage } from '@/components/public/public-page';
import {
  Action,
  EmptyState,
  PageIntro,
  PublicationNotice,
} from '@/components/public/primitives';
export default async function Contact() {
  const site = await getPublicSite();
  const profile = records(site, 'profile')[0];
  const contacts = list(profile?.contact)
    .filter((item) => item.public === true)
    .map((item) => ({
      label: text(item.label),
      value: text(item.value),
      href:
        safeHref(item.value) ||
        (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(item.value))
          ? `mailto:${text(item.value)}`
          : null),
    }));
  const links = list(profile?.links).map((item) => ({
    label: text(item.label),
    value: text(item.label, text(item.url)),
    href: safeHref(item.url),
  }));
  return (
    <PublicPage
      site={site}
      pageId="contact"
      slots={{
        'contact.hero': (
          <section
            className="content reading-content"
            id="contact"
            data-section="Contact"
            tabIndex={-1}
          >
            <PageIntro
              page="contact"
              title={
                <span className="contact-title">
                  Connect with{' '}
                  <span className="expressive">
                    {text(profile?.displayName, 'Desan')}.
                  </span>
                </span>
              }
              left
            >
              Have a question, an idea, or something to build?
            </PageIntro>
            <PublicationNotice site={site} />
            {profile?.availability ? <p>{text(profile.availability)}</p> : null}
          </section>
        ),
        'contact.links': (
          <section
            className="section content reading-content"
            id="links"
            data-section="Find me"
            tabIndex={-1}
          >
            {contacts.length || links.length ? (
              <div className="contact-list">
                {[...contacts, ...links].map((item, index) => (
                  <div
                    className="contact-row"
                    key={index}
                    data-design-node="contact.record"
                  >
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    {item.href && (
                      <Action
                        href={item.href}
                        small
                        node="contact.secondary-action"
                      >
                        {item.href.startsWith('mailto:') ? 'Email' : 'Visit'}
                      </Action>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                page="contact"
                title="Contact details are being prepared."
                href="/profile"
                action="Explore profile"
              >
                Public contact links will appear here when selected.
              </EmptyState>
            )}
            <p className="record-meta">
              Messages open in your own email app or the linked service.
            </p>
          </section>
        ),
      }}
    />
  );
}

export async function generateMetadata() {
  return routeMetadata(await getPublicSite(), '/contact');
}
