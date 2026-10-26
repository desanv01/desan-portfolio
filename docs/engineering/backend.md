# Local backend setup and operating boundary

Phase 3 uses Payload, PostgreSQL and local private storage. This guide covers free local evaluation. Production services, real email delivery and personal content publication require later work.

## Private configuration

Use the root README's Node/npm versions and run `npm ci`. Copy `.env.example` to private `.env.local` and provide:

- `POSTGRES_PASSWORD`: a randomly generated local password.
- `DATABASE_URI`: `postgresql://desan:<password>@127.0.0.1:55433/desan_dev`.
- `TEST_DATABASE_URI`: the same host with a separate disposable `desan_test` database.
- `PAYLOAD_SECRET`: a separately generated random value of at least 32 characters.
- `CMS_SERVER_URL`: the exact local origin, normally `http://127.0.0.1:3000`.
- `MEDIA_DIRECTORY`: private persistent storage outside `public/`; default ignored `tmp/phase3-media`.

Do not reuse CI/sample values elsewhere. Scripts support `.env.local` and optional ignored `tmp/phase3-runtime.env`; existing process environment values take precedence. Avoid conflicting private files. Database/secret configuration is required. Never use `NEXT_PUBLIC_` for credentials.

## Database and seed

Compose pins official PostgreSQL by digest, publishes loopback only and retains data in a named volume.

```sh
docker compose --env-file .env.local up -d postgres
docker compose --env-file .env.local exec postgres pg_isready -U desan -d desan_dev
docker compose --env-file .env.local exec postgres createdb -U desan desan_test
npm run db:migrate
npm run db:migrate:status
npm run db:seed
```

Create the test database once. Never point tests at real content. Schema push is disabled; migrations are explicit and serialized. Reapply `npm run db:migrate` to verify already-applied migrations are not duplicated. The repeatable seed creates a synthetic hidden draft without importing private research or overwriting edits.

The original evaluation checkout may use separately started `desan-phase3-postgres` on the same port. Stop that project-owned instance before switching to Compose, or choose another port/URI. Never run two PostgreSQL processes on one data directory. Leave unrelated containers untouched.

## Owner setup and recovery

Privately supply `OWNER_EMAIL` and a strong `OWNER_PASSWORD` of at least 16 characters, then explicitly run `npm run owner:bootstrap`. Public signup/browser first-user registration are closed. Bootstrap uses a trusted local create capability and database singleton constraint; an existing owner causes refusal. Remove bootstrap password values from persistent configuration afterward. No default account/password is published.

Run `npm run dev` and visit `/admin`. This is configured Payload administration; the designed owner workspace remains Phase 5. Access/session acceptance depends on tests, not hidden menu items.

For local recovery evaluation, `LOCAL_RECOVERY_SPOOL=1` captures mail to ignored `tmp/phase3-recovery`; `RECOVERY_SPOOL_DIRECTORY` can select another private location. These files contain sensitive tokens and must never be served or packaged. Unavailable delivery returns the same response before account lookup; later delivery failures do not expose account existence or tokens. Local capture is not real email delivery. Production email is later operational work.

## Data and media policy

Collections cover profile, grouped experience roles, education, projects, posts, skills, typed skill associations, project context links, optional professional sections and site settings. Stable role keys retain exact role context within a grouped employer. Selected hidden roles cannot become public through an association. Private source fields are excluded from the publication projection. Published counts and reciprocal associations derive from the selected graph, not research totals. Dates support documented precision and validate calendar values and effective partial updates.

PNG/JPEG/WebP images are decoded and re-encoded; WOFF2 fonts are parsed and validated. Byte/MIME/resource limits apply. PDF, SVG, executable, arbitrary URL and unsupported uploads are rejected. Resume PDF ingestion/sanitization is not implemented by this policy; a later resume feature must remain unavailable until its supported file workflow exists.

Files live outside `public/`. Raw CMS files are owner-only; public media requires the active publication manifest and pinned bytes. Replacement creates a new resource identity. Draft metadata does not silently replace a live snapshot. Deliberate withdrawal must use the publication lifecycle.

## Publication and design

The backend selects exact content/design version IDs, validates relationship/asset references, stores an immutable resolved snapshot and transactionally switches the active pointer. Newer drafts remain private. Slug mappings are backend data for the later frontend router; public product routes are not implemented here.

Custom publication/preview mutations require owner authentication and the configured request origin. Preview is private/no-store. Public responses use no-store and a revision identity. Restore revalidates retained selected versions; revoke activates an empty snapshot and removes its public media eligibility. Conflict and injected-failure tests verify that unsuccessful activation does not change the active snapshot.

Every publication snapshot records its activation time. A continuously published record retains its publication date through design-only or content republishing; newly public records receive the activation time. This is not a claim of first-ever publication after withdrawal. Posts can separately use an optional owner-supplied editorial date. Raw content and design versions are retained without automatic pruning and deletion is denied, preserving restore dependencies.

Design persistence supports arbitrary valid presentation values rather than three fixed presets. The pure model does not implement a renderer or visual editor. Schema/version/reference and inheritance tests are separate from later browser customization acceptance.

## Verify and stop

Run the README validation commands against the dedicated test database. Backend acceptance requires real PostgreSQL and relevant HTTP failure paths; a successful build or process health response alone is insufficient.

The pinned Payload PostgreSQL adapter retains a connection after its destroy routine. The local CLI explicitly exits after the awaited command and cleanup; errors still exit nonzero. The backend test runner uses `--test-force-exit` after tests and awaited cleanup. These address CLI/test process handles, not runtime database shutdown or production operations.

The Linux preview excludes configuration, database rows, uploads and recovery mail. Supply your own migrated database/runtime values. If build-local environment files enter standalone output, packaging refuses upload; do not bypass that guard or upload private files manually.

Stop dev with Ctrl+C. Stop Compose while preserving data with `docker compose --env-file .env.local stop`. Do not delete volumes as routine cleanup. Production backups/restores, adapters, email, host hardening and deployment remain later work. See [Phase 3 acceptance](phase-3-acceptance.md).
