# Architecture boundaries

The application uses Next.js, Payload and PostgreSQL. Phase 2 established the engineering foundation; Phase 3 implements backend persistence and authorization, and Phase 4 adds the configurable public frontend. Package presence alone is not evidence of a verified workflow. See the backend acceptance and public-site contracts for tests and limitations.

## Foundation

The application exposes public portfolio routes and a health endpoint for local/build verification. Validation covers formatting, lint, static types, focused tests, PostgreSQL/HTTP integration and a production build. Exact package versions, executable scripts and environment examples are owned by the toolchain files; documentation must track them.

No production deployment is included in this phase. No paid service provisioning is authorized. Local preview evidence should identify the source revision, startup method, URL, observed response and limitations without implying a public deployment exists.

## Backend and later interface boundaries

Phase 3 covers explicit migrations, a single owner identity, guarded local media, private editing records, selected-version publication snapshots, owner preview and redirect mappings. Public snapshot responses are revisioned and no-store; publication commits are transactional. Database migrations are serialized under one owner. Local storage and recovery capture do not establish production storage or email delivery.

Public routes render only selected published content and its coherent design snapshot. The renderer consumes structured themes, typography, sizing, layouts, component settings and responsive overrides. The custom owner editor and its design recovery workflow still require later implementation and end-to-end verification.

Credentials belong in private environment configuration. Browser-visible values must be intentionally public. Environment examples explain current backend requirements. Local evaluation uses isolated PostgreSQL; no provisioned production service is needed. PDF ingestion is currently unsupported, while images/fonts follow the explicit backend media policy.
