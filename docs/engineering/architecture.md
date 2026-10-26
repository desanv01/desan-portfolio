# Architecture boundaries

The application uses Next.js, Payload and PostgreSQL. Phase 2 established the engineering foundation; Phase 3 implements backend persistence and authorization. Package presence alone is not evidence of a verified workflow. See the Phase 3 acceptance record for actual tests and limitations.

## Foundation

The application may expose a minimal placeholder and health endpoint for local/build verification. Validation covers formatting, lint, static types, focused tests and a production build. Exact package versions, executable scripts and environment examples are owned by the toolchain files; documentation must track them.

No production deployment is included in this phase. No paid service provisioning is authorized. Local preview evidence should identify the source revision, startup method, URL, observed response and limitations without implying a public deployment exists.

## Backend and later interface boundaries

Phase 3 covers explicit migrations, a single owner identity, guarded local media, private editing records, selected-version publication snapshots, owner preview and redirect mappings. Public snapshot responses are revisioned and no-store; publication commits are transactional. Database migrations are serialized under one owner. Local storage and recovery capture do not establish production storage or email delivery.

Public routes will eventually render approved published content. Owner editing will include structured themes, typography, sizing, layouts, component settings, responsive overrides and design version recovery. These contracts need implementation and end-to-end verification before they can be advertised as available.

Credentials belong in private environment configuration. Browser-visible values must be intentionally public. Environment examples explain current backend requirements. Local evaluation uses isolated PostgreSQL; no provisioned production service is needed. PDF ingestion is currently unsupported, while images/fonts follow the explicit backend media policy.
