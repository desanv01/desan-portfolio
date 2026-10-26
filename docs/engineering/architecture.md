# Architecture boundaries

The selected target is a Next.js application using Payload for owner content/design editing and PostgreSQL for persistent data. Phase 2 establishes the engineering foundation only. Package presence is not evidence of a working CMS or database integration.

## Foundation

The application may expose a minimal placeholder and health endpoint for local/build verification. Validation covers formatting, lint, static types, focused tests and a production build. Exact package versions, executable scripts and environment examples are owned by the toolchain files; documentation must track them.

No production deployment is included in this phase. No paid service provisioning is authorized. Local preview evidence should identify the source revision, startup method, URL, observed response and limitations without implying a public deployment exists.

## Planned integration

Later phases must establish schema/migrations, owner authentication and authorization, durable media storage, draft/live separation, versioned publication, preview access, cache invalidation and slug redirects. Database migrations are serialized under one owner.

Public routes will eventually render approved published content. Owner editing will include structured themes, typography, sizing, layouts, component settings, responsive overrides and design version recovery. These contracts need implementation and end-to-end verification before they can be advertised as available.

Credentials belong in private environment configuration. Browser-visible values must be intentionally public. Environment examples use placeholders and must explain which values are required by the current implementation. The Phase 2 app must not require a provisioned production database merely to verify the placeholder.
