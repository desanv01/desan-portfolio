# Production operations and recovery

The chosen launch path uses Vercel for the application and the owner's new Supabase project for PostgreSQL/private object storage. Self-hosting remains a future option described separately. This guide does not establish that deployment or a restore drill passed: use the release's dated verification receipts for that evidence.

## Runtime configuration

Keep `PAYLOAD_SECRET`, `DATABASE_URI`, Supabase server key, `JOBS_SECRET` and recovery password files private. Never put them in `NEXT_PUBLIC_`, repository files, build logs, browser code or backup manifests. Store a separate encrypted copy of the application secret and provider credentials; losing that escrow is different from losing database/media bytes.

The production configuration uses:

- `CMS_SERVER_URL`: exact public HTTPS origin, without credentials/path/query. HTTPS owner cookies are Secure, HttpOnly, host-only and SameSite=Lax. Local HTTP evaluation remains supported.
- `PUBLIC_SITE_URL`: matching canonical HTTPS origin. Indexing is a separate explicit setting; analytics remains off unless the owner chooses otherwise.
- `DATABASE_URI`: the selected session-pooler/direct database connection. Remote/cloud connections enforce certificate/hostname verification regardless of missing SSL flags or weakening URI parameters. Supply the verified provider certificate as `DATABASE_SSL_CA` (PEM), or `DATABASE_SSL_CA_FILE` locally. No `rejectUnauthorized:false` fallback is supported. Serverless pool maximum defaults to3; local default10. The pinned adapter's retained initial checkout is a known connection-budget limitation, not a claimed fix.
- `MEDIA_STORAGE=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (preferred opaque secret), or legacy `SUPABASE_SERVICE_ROLE_KEY`, plus private `SUPABASE_MEDIA_BUCKET` and `SUPABASE_CACHE_BUCKET`.
- `GITHUB_METADATA_CACHE_STORAGE=supabase`. Only explicit project repository roots are cached; requests read durable cached observations and do not fetch GitHub. A cache outage cannot replace a previously good object with an unknown empty state.
- `SCHEDULE_MODE=managed`, random `JOBS_SECRET` of at least32 characters, and the owner-controlled native scheduler setup.
- `OWNER_RECOVERY_MODE=operator`, `LOCAL_RECOVERY_SPOOL=0` until a real, verified email adapter is deliberately configured.

Run configuration-only checks with `node --import tsx scripts/phase8-readiness.ts --production` under the private runtime environment. Output contains check IDs/statuses, never raw values. This does not verify live RLS, bucket settings, TLS connectivity, owner identity, Cron delivery, deployment or backup destination; those are acceptance actions.

Supabase Data API stays disabled. Application tables/sequences/default privileges are not granted to browser `anon`/`authenticated` roles, and RLS is enabled. Storage buckets remain private without public browser policies. The server key has elevated access; application owner/selected-publication checks remain mandatory before using it. No public/signed object URL is emitted for media. Generated immutable filenames and checksums survive a storage migration.

The hosted owner upload limit is **4 MiB**, including transformed image bytes; multipart requests have limited overhead below the provider's4.5 MB non-streaming limit. Local evaluation retains its10 MiB policy. PNG/JPEG/WebP are decoded/re-encoded, WOFF2 is structurally validated, and unsupported/active formats are rejected. An empty/octet-stream browser MIME can be inferred from allowed magic bytes; explicit mismatches fail. Replacement creates a new resource, never overwrites published bytes.

## Scheduled publication

`POST /api/internal/jobs` accepts only the dedicated `x-desan-job-secret` header. It cannot accept a new publication selection or arbitrary action. It reloads the enabled owner, processes at most3 due persisted jobs per invocation and keeps transactional/revision/replay checks. A timeout cannot commit a partial publication; pending work can be delivered again.

Native Cron invokes HTTP only when a pending job is actually due. Do not add keeper/health pings to keep a free project awake. The owner UI distinguishes configured managed delivery from recent execution; `lastActualDelivery` is not a continuous health guarantee.

Keep only the narrowly scoped jobs secret in Vault/queued HTTP headers. The managed platform's `pg_net` queue headers may be readable by database login roles; do not claim unsupported queue ACL/RLS hardening. Never put a database password, Supabase elevated key or owner session in that queue. Restrict the invocation function/schema to the intended operator role and do not expose it through the Data API. Rotate the jobs secret in both runtime and Vault if exposed, then verify unauthorized/replay behavior. Main's scheduler SQL/receipts are the authority for the exact deployment setup.

## Owner recovery

Browser signup and first-user registration are closed. The owner uses the approved private login. The local mail spool is an evaluation tool containing sensitive reset tokens, not production email delivery. Until a real adapter is verified, browser recovery reports unavailable equally for known/unknown accounts; operator recovery is the supported fallback.

A trusted operator with the private runtime configuration creates a one-line strong password file readable only by that operator (POSIX0600; restrict Windows ACLs). Keep it outside public directories, exports and Git. Then run:

```sh
node --import tsx scripts/phase8-owner-recovery.ts reset --confirm-owner-recovery --password-file /private/one-time-password --database-name EXPECTED_DATABASE
```

The command requires exactly one enabled existing owner, updates the password, clears lockout/reset state and revokes prior sessions. It never creates/enables an account or prints credentials. Remove the one-time file explicitly after success, verify HTTPS login and the Secure cookie, and verify an older session/reset token fails. Database access is an operator privilege: this is not an HTTP bypass or delegated browser recovery. Rehearse on an isolated restored database before relying on it operationally.

## Database and private-storage backups

Backups contain private source notes, password hashes and session rows even though runtime secrets/recovery mail are excluded. Store them outside serving roots and Git, restrict filesystem access and move copies only to the owner's chosen encrypted destination. Checksums detect corruption; they do not authenticate an untrusted dump. Restore only a trusted operator backup, because PostgreSQL restoration executes its schema/function definitions.

Quiesce owner writes, uploads and due job delivery during the matching database/storage capture. Visitors can continue reading if the operator can guarantee no writers. Do not silently overwrite approved local data with fixtures. Do not delete volumes or live buckets as routine cleanup.

Cloud object export is read-only and covers both private media and cache:

```sh
node --import tsx scripts/phase8-cloud-export.ts export --directory /private/NEW-storage-export --quiesced
node --import tsx scripts/phase8-cloud-export.ts verify --directory /private/NEW-storage-export
```

The new directory contains `media/`, `cache/` and a checksummed `cloud-storage-manifest.json`; no keys are included and live objects are not changed. Keep the cache export with the database/media backup even though metadata can be refreshed later. Recheck the manifest after an off-device copy.

Capture the public Payload schema with matching PostgreSQL client tools:

```sh
node scripts/phase8-backup.mjs backup --directory /private/NEW-db-backup --media-directory /private/NEW-storage-export/media --quiesced
node scripts/phase8-backup.mjs verify --directory /private/NEW-db-backup
```

The source connection comes from private `DATABASE_URI`; passwords are passed through the child environment, not shell/URI arguments. Native clients verify remote TLS. The explicit local Docker-container adapter is for the local drill only; cloud client execution can use the release's reviewed operator runner with secret environment inheritance and a copied public provider CA. Do not relax the loopback-container guard or certificate checks. Capture/retain both cloud-storage and database manifests together; record their hashes in the private release ledger. Managed Supabase schemas, platform credentials, Vault secrets and Cron provisioning are not portable Payload data and need their separate configuration/escrow.

The backup command refuses an existing destination, hashes the binary dump/all media and checks the active publication receipt before/after capture. A manifest is written only on successful completion. Keep failed `.pending`/partial captures separate; they are not accepted backups.

## Isolated restore rehearsal

Provision an empty, separate local database named `*_restore` (or `*_restore_SUFFIX`), with no existing tables/functions/types/extensions/custom schemas. Privately set `RESTORE_DATABASE_URI` to it and keep the original source URI for the refusal guard. Choose a new private media directory:

```sh
node scripts/phase8-backup.mjs restore --directory /private/NEW-db-backup --media-directory /private/NEW-restored-media --confirm-isolated-restore
```

The tool refuses the source/live database, nonempty targets, reused media folders, public paths, path traversal and symlink/junction aliases into protected paths. It never uses `--clean`, drops a schema or overwrites user objects. Its restore TOC omits only creation/comment of the already-existing empty default `public` schema; all archived table/function/data entries remain. Restoration is one transaction. Container mode transfers a generated private TOC list, not credentials. Failed partial media/list files remain for private diagnosis; use a fresh media destination for a retry.

Acceptance requires exact active revision/payload fingerprint, all media SHA-256 checks, selected public graph/content, anonymous draft denial, authenticated owner access/recovery and the complete public HTTP routes against the isolated runtime. A valid archive or green mock test alone is insufficient. No script promotes the isolated runtime or modifies the live bucket/database during restore. Cutover/rollback remains an explicit main/operator action after the release checks.

## Recovery archive download and maintenance

The owner recovery export preserves editable records/history/snapshots/schedules and omits credentials/media bytes. Its authenticated JSON response is explicitly streamed, with `X-Archive-SHA256` and `X-Archive-Bytes` covering the decoded JSON representation. Verify a real deployed response larger than4.5 MB end-to-end before launch; local streaming proof does not establish provider behavior. The browser may reformat its downloaded JSON, so byte proof should inspect the raw response. Large archive downloads do not change the inbound import/upload caps.

After meaningful publication changes and before upgrades, take and verify a backup. Agree an encrypted off-device destination, retention and restoration responsibility before automating deletions or claiming disaster recovery complete. Preserve exact release versions/migrations and secret escrow. Watch provider quota/status, failed scheduled releases, storage errors and login/recovery failures; do not log raw tokens, request bodies, private source or dump contents. Free-only service limits remain an operating constraint; no paid fallback or unapproved provision is implied.

References: [PostgreSQL17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html), [Supabase private storage/access control](https://supabase.com/docs/guides/storage/security/access-control), [Supabase server keys](https://supabase.com/docs/guides/getting-started/api-keys), and [Vercel streaming response guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions#streaming-responses).
