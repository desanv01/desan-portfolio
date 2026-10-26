# Public site and renderer contract

Phase 4 provides the public portfolio on top of the Phase 3 publication system. It does not implement the custom owner workspace, scheduled publication executor or production deployment.

## Data boundary

Every route reads the selected immutable publication through a request-scoped loader. Content and design come from the same snapshot. There is no draft/latest-record fallback. The projection fails closed for invalid relationships or private fields. Public media URLs serve only selected asset identities; replacement uploads cannot silently replace published bytes.

Home, Work, case study, Profile, Journal, article, Contact, Resume and Search use the selected records. Work filtering, journal pagination, text search and old-slug redirects are deterministic. Professional records preserve organization/role nesting, date precision, optional sections and reciprocal skill/project context. Empty optional sections are hidden. Rich text renders safe semantic elements and reports an explicit unavailable state when its structural limit is exceeded.

No personal biography or asset is inferred from synthetic examples. Missing resume PDFs remain explicitly unavailable with Profile and print alternatives. Preview metadata is noindex; detail metadata uses selected titles/summaries and the configured CMS origin for canonical URLs. Production SEO and verified content migration remain separate work.

The Node routing proxy checks selected public slugs and redirects before rendering detail or unknown public routes. Missing routes rewrite internally to a normal rendered error page with HTTP 404, preserving the visitor's URL. This avoids the current Next error-recovery shell, which otherwise supplies useful content only after client rendering. Index routes, API/admin routes and known static resources bypass the publication check. The proxy performs no Host-based HTTP fetch or raw editing-record read; unavailable publication storage returns an explicit noncached 503.

## Design and interactions

The public runtime resolves validated theme, page, template, component, record, breakpoint and interaction settings. It compiles safe CSS and binds behavior to actual DOM controls. Supported values include arbitrary colors, uploaded licensed WOFF2 fonts, typography, spacing, layouts, section order, card/media presentation, navigation, focus treatment and motion. Defaults use project-local Syne, Fraunces, Source Sans 3 and IBM Plex Mono; licenses and hashes are in `public/fonts`.

The percentage rail supports document geometry updates, pointer seeking and keyboard navigation. Section links preserve browser history and explicit focus. Mobile navigation supports Escape and focus return. Appearance preferences persist between pages; System follows the OS. Reduced-motion preferences disable authored animation. Design values do not execute arbitrary scripts, HTML or CSS.

The runtime inventory describes mapped public properties. The visual owner editor and its import/export/undo workflow are documented in [Owner workspace](OWNER-WORKSPACE.md) and `src/owner-design/HANDBACK.md`, with a property-to-control traceability map. Extension-only `advanced.unmapped` data is not executed. Broader application-wide customization validation remains Phase 7.

## Local synthetic evaluation

Use the pinned Node/npm versions and backend setup first. `npm run fixture:public` requires `ALLOW_SYNTHETIC_PUBLICATION=1`, a local development/test database and the explicit publish/bootstrap flags in the script. It refuses to replace an unrelated published site. The fixture creates labelled synthetic records, public/private canaries, selected media and a long article. Running it again updates the same fixture identities.

For the alternate layout/palette/uploaded-font evaluation, append `-- --alternate` to that command. Run the normal command to restore the copper baseline. These fixtures are for isolated local/CI evaluation only.

`npm run test:public` starts an owned ephemeral production server, checks actual HTML, filtering, pagination, search, relationships, redirects, useful missing pages, privacy and exact media MIME/hash, then stops it. `npm run test:public-preview` runs the same contract against the standalone package with media outside the package. Both require the synthetic publication. Database rows, private configuration and uploaded media are deliberately excluded from downloadable artifacts.

Browser verification additionally covers responsive layouts, uploaded-font rendering, alternate settings, scroll/navigation/focus behavior and reduced motion. Pure schema/unit checks alone do not establish those behaviors. CI requires formatting, lint, types, unit/backend/HTTP checks, a production build and standalone safety verification.
