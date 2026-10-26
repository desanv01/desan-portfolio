# Deployment and recovery

The selected hosted deployment uses Vercel Hobby, Supabase Free PostgreSQL and private Supabase Storage. Application owner authentication remains Payload, with closed signup. Supabase Auth is not the owner login. The web server, durable publication worker and PostgreSQL use one reviewed source revision. Uploaded media must persist across restarts and releases. Deploying only the web build to ephemeral storage does not provide the supported owner workflows.


## Hosted deployment

Set the canonical HTTPS origin in CMS_SERVER_URL and PUBLIC_SITE_URL. Keep PUBLIC_SITE_INDEXABLE=0 until live acceptance passes. Put DATABASE_URI, PAYLOAD_SECRET, SUPABASE_SECRET_KEY and JOBS_SECRET in sensitive production environment settings. Do not send the bootstrap owner password to the hosting environment. Retain PAYLOAD_SECRET across deployments. Set MEDIA_STORAGE=supabase, GITHUB_METADATA_CACHE_STORAGE=supabase and SCHEDULE_MODE=managed. Configure two distinct private buckets, desan-media and desan-cache. The application refuses a public bucket. Cloud owner uploads are limited to 4 MiB, with a separate bounded multipart envelope. Local uploads retain their 10 MiB cap.

Remote database connections verify TLS even when an explicit SSL flag is omitted. Supply the trusted provider CA using DATABASE_SSL_CA (PEM text) or DATABASE_SSL_CA_FILE. URI parameters cannot disable certificate validation. The cloud pool defaults to three connections. Apply the existing Payload migrations once and run scripts/deployment/supabase-hardening.sql after migrations to remove unnecessary browser-role privileges. Keep the Data API disabled and row security enabled; browser clients do not query CMS tables.

The managed job endpoint is POST /api/internal/jobs. It accepts only the private x-desan-job-secret header, processes bounded batches of due jobs and preserves existing revision/conflict/idempotency controls. Configure a provider scheduler to check for pending due records before invoking it; do not run artificial keepalive requests. A configured scheduler and an observed successful delivery are distinct states. No due work means no delivery heartbeat. Exact provider setup and execution evidence belong in the private operational handoff.

Initialize the single production owner and import only reviewed content. Never restore QA owners or synthetic publications into production. Run public/owner HTTP flows, private upload and selected-public media tests, repeat delivery, backup/restore and large recovery-export checks against the deployed build. Keep private exports, database dumps, media inventories and secrets out of Git.

Email recovery is not configured in the free launch configuration. The owner recovery screen states this explicitly. The trusted operator recovery command in OPERATIONS.md changes the existing owner password and revokes old sessions; it requires private database access and an explicit target confirmation. Never claim that a recovery email was sent.

## Deferred self-hosting reference

The owner deferred laptop self-hosting until after this project is complete. The following container files are preparatory references, not a tested or accepted deployment. Revalidate them against the final release before use.

The deferred `scripts/deployment/Dockerfile` is a draft Linux image recipe with the pinned Node/npm toolchain. Its allowlisted build context excludes private environment files, database dumps, local media, research and design files. Build from the repository root:

```sh
docker build -f scripts/deployment/Dockerfile -t desan-portfolio:REVIEWED_SHA .
```

Keep production environment files outside Git with restricted permissions. Set `DATABASE_URI` to the private `database:5432/desan` service with the matching unique password, `PAYLOAD_SECRET` to a stable random secret, and `CMS_SERVER_URL`/`PUBLIC_SITE_URL` to the final HTTPS origin. Keep `PUBLIC_SITE_INDEXABLE=0` until live checks pass. Never use the synthetic QA owner or build placeholders in production. Confirm recovery delivery/operator procedures before launch.

The compose definition requires `POSTGRES_PASSWORD`, `DESAN_IMAGE` and `DESAN_RUNTIME_ENV` (an absolute private env-file path). It binds web HTTP only to loopback port3009; PostgreSQL is never published to the host. Place a separately configured HTTPS reverse proxy in front. Restrict request size, timeouts and login abuse at that boundary. Provider/domain selection and TLS certificates are deployment-specific; this definition alone does not claim an internet deployment.

```sh
docker compose --env-file /private/deployment.env -f scripts/deployment/compose.yaml up -d database
docker compose --env-file /private/deployment.env -f scripts/deployment/compose.yaml run --rm web node --import tsx scripts/backend-cli.ts migrate
docker compose --env-file /private/deployment.env -f scripts/deployment/compose.yaml up -d web jobs
```

Use an explicitly reviewed content migration or the tested database/media restore procedure; never seed synthetic fixtures into production. Bootstrap the real owner through the existing single-owner CLI with private environment input. Owner credentials and recovery secrets must not enter command history or public logs.

Before each upgrade, stop writes and scheduled jobs, create and verify a complete database/media backup, retain the prior image, apply migrations once, and check public routes, owner login, private preview, upload, publication and scheduled execution. Resume jobs only after verification. Image rollback alone cannot reverse schema/data changes: restore the matching backup into an isolated target and verify it before switching traffic. Do not delete volumes during rollback.

See `OPERATIONS.md` for backup/recovery and `OWNER-WORKSPACE.md` for editing workflows. Backup destination, encryption/retention, monitoring, recovery delivery, HTTPS address and actual hosting cost must be recorded in the private deployment handoff.
