<div align="center">

# Desan Portfolio

**Backend foundation for an editable portfolio and publishing workspace**

[![CI](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml)

[Setup](docs/engineering/backend.md) · [Engineering docs](docs/engineering/README.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](docs/engineering/roadmap.md)

</div>

This repository contains the Phase 2 engineering foundation and Phase 3 backend work using Next.js, Payload and PostgreSQL. The public homepage remains an engineering placeholder. The approved portfolio frontend and custom owner Design Studio belong to later phases.

## Current scope

| Area        | Implementation boundary                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Content     | Professional/project/skill records, typed relationships, drafts and versions                          |
| Access      | Payload owner identity/session, closed signup, explicit local bootstrap and local recovery evaluation |
| Media       | Guarded persistent images/fonts with immutable replacement identities; unsupported files rejected     |
| Publication | Selected content/design revisions and assets in a coherent public snapshot                            |
| Design data | Versioned arbitrary themes, typography, geometry, layouts, responsive/state and motion values         |
| Validation  | Pinned toolchain, migration/integration tests, lint/types/build and preview verification              |
| Product UI  | Placeholder and configured Payload administration; finished public/custom owner screens remain later  |
| Deployment  | No production deployment or live site URL                                                             |

Acceptance belongs to an exact source revision and its observed checks. See the [Phase 3 acceptance contract](docs/engineering/phase-3-acceptance.md); dependency installation alone does not establish working workflows.

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
npm run build
npm run test:smoke
npm run test:backend-routing
node scripts/package-preview.mjs
npm run test:preview
```

CI uses isolated PostgreSQL, synthetic credentials and required job `quality`. It applies migrations twice, runs integration checks and verifies the standalone package before uploading it. The package guard rejects environment/runtime files and configured secret values.

Successful runs link a Linux preview artifact with seven-day retention. It requires your own matching migrated database, private runtime configuration and media storage; database rows, credentials and uploads are excluded. It is not a hosted deployment. The internal `tmp/phase2-preview` folder name is retained from foundation packaging; current artifacts are named for Phase 3.

## Project layout

| Path                | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `src/app/`          | Placeholder, Payload routes and guarded publication/media APIs |
| `src/cms/`          | Content/access/media/publication configuration and migrations  |
| `src/design/`       | Validated design schema and inheritance contracts              |
| `tests/`            | Unit, integration, HTTP and package-safety checks              |
| `scripts/`          | Backend CLI and preview packaging                              |
| `compose.yaml`      | Isolated loopback PostgreSQL service                           |
| `.github/`          | CI, issue/PR conventions and ownership                         |
| `docs/engineering/` | Setup, architecture, acceptance and ownership contracts        |

One Payload identity system governs editing. Public data comes from selected publication snapshots; drafts are not automatically live. Phase 3 stores and validates arbitrary owner design settings. The public renderer and complete Design Studio UI remain later work. See [architecture](docs/engineering/architecture.md) and [roadmap](docs/engineering/roadmap.md).

## License and credits

The repository license has not been selected. Public visibility implies no license grant. Dependencies retain their licenses; personal content/media rights are separate decisions.

README organization was informed by [OmniForge](https://github.com/desanv01/omniforge) and [Flight Controller V2](https://github.com/desanv01/Flight-Controller-V2). Their licenses, assets, claims and implementation are not incorporated by that reference.
