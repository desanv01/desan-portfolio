<div align="center">

# Desan Portfolio

**A configurable portfolio and publishing workspace**

[![CI](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml)

[Setup](docs/engineering/backend.md) · [Engineering docs](docs/engineering/README.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](docs/engineering/roadmap.md)

</div>

This repository contains the engineering foundation, backend and public portfolio built with Next.js, Payload and PostgreSQL. Public pages render selected content and design revisions together. The custom owner Design Studio remains a later phase.

## Current scope

| Area        | Implementation boundary                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Content     | Professional/project/skill records, typed relationships, drafts and versions                          |
| Access      | Payload owner identity/session, closed signup, explicit local bootstrap and local recovery evaluation |
| Media       | Guarded persistent images/fonts with immutable replacement identities; unsupported files rejected     |
| Publication | Selected content/design revisions and assets in a coherent public snapshot                            |
| Design data | Versioned arbitrary themes, typography, geometry, layouts, responsive/state and motion values         |
| Validation  | Pinned toolchain, migration/integration tests, lint/types/build and preview verification              |
| Product UI  | Responsive Home, Work/case studies, Profile, Journal/articles, Contact, Resume, Search and errors; configured Payload administration |
| Deployment  | No production deployment or live site URL                                                             |

Acceptance belongs to an exact source revision and its observed checks. See the [backend acceptance contract](docs/engineering/phase-3-acceptance.md) and [public renderer contract](docs/engineering/public-site.md).

## Local development

Use Node.js **24.22.1** and npm **11.19.1**, as declared in [.nvmrc](.nvmrc) and [package.json](package.json). Run `npm ci`, then follow [backend setup](docs/engineering/backend.md) for private configuration, PostgreSQL, migrations and optional owner bootstrap.

Run `npm run dev` and open [localhost:3000](http://localhost:3000). The server binds to loopback. `/admin` is configured Payload administration, not the final designed workspace. `/api/health` reports process liveness only. Stop with Ctrl+C.

Never put personal content into synthetic fixtures or publish environment files. Seeds contain explicitly synthetic drafts only.

## Validation and preview

With private local configuration and a dedicated test database:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run db:migrate
npm run test:backend
# Optional isolated evaluation data: set ALLOW_SYNTHETIC_PUBLICATION=1 first.
npm run fixture:public
npm run build
npm run test:smoke
npm run test:backend-routing
npm run test:public
node scripts/package-preview.mjs
npm run test:preview
npm run test:public-preview
```

CI uses isolated PostgreSQL, synthetic credentials and required job `quality`. It applies migrations twice, runs integration checks and verifies the standalone package before uploading it. The package guard rejects environment/runtime files and configured secret values.

Successful runs link a Linux preview artifact with seven-day retention. It requires your own matching migrated database, private runtime configuration and media storage; database rows, credentials and uploads are excluded. It is not a hosted deployment. The internal `tmp/phase2-preview` folder name is retained from foundation packaging; current artifacts are named for Phase 4.

## Project layout

| Path                | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `src/app/`          | Public pages, Payload routes and guarded publication/media APIs |
| `src/cms/`          | Content/access/media/publication configuration and migrations  |
| `src/design/`       | Validated design schema, inheritance and CSS/runtime compilation |
| `src/public-data/`  | Published snapshot projection, search and typed relationship helpers |
| `src/components/public/` | Public templates, configurable components and accessible interactions |
| `tests/`            | Unit, integration, HTTP and package-safety checks              |
| `scripts/`          | Backend CLI and preview packaging                              |
| `compose.yaml`      | Isolated loopback PostgreSQL service                           |
| `.github/`          | CI, issue/PR conventions and ownership                         |
| `docs/engineering/` | Setup, architecture, acceptance and ownership contracts        |

One Payload identity system governs editing. Public data comes from selected publication snapshots; drafts are not automatically live. The public renderer consumes arbitrary validated palettes, licensed fonts, layouts, responsive/state settings and motion. The complete visual Design Studio UI, scheduling, approved personal content migration and deployment remain later work. See [architecture](docs/engineering/architecture.md) and [roadmap](docs/engineering/roadmap.md).

## License and credits

The repository license has not been selected. Public visibility implies no license grant. Dependencies retain their licenses; personal content/media rights are separate decisions.

README organization was informed by [OmniForge](https://github.com/desanv01/omniforge) and [Flight Controller V2](https://github.com/desanv01/Flight-Controller-V2). Their licenses, assets, claims and implementation are not incorporated by that reference.
