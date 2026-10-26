<div align="center">

# Desan Portfolio

**Engineering foundation for an editable portfolio and publishing workspace**

[![CI](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/desanv01/desan-portfolio/actions/workflows/ci.yml)

[Setup](#local-development) · [Engineering docs](docs/engineering/README.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](docs/engineering/roadmap.md)

</div>

This repository is in **Phase 2: repository and engineering foundation**. The current deliverable establishes local development, validation and contribution conventions. It is not a finished portfolio, CMS, owner workspace or production service.

The selected architecture is Next.js with Payload and PostgreSQL. Payload integration, database schemas, authentication, media storage and publishing are later work. Installing a dependency does not establish that its workflows are implemented or tested.

## Current scope

| Area                   | Phase 2 scope                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| Application            | Minimal engineering placeholder and health verification                 |
| Toolchain              | Pinned dependencies, reproducible installation and environment examples |
| Validation             | Formatting, lint, types, focused tests and production build             |
| Collaboration          | Issue forms, PR conventions, ownership and acceptance criteria          |
| Product UI and content | Planned; no finished public pages or personal claims published          |
| Deployment             | No production deployment or live site URL                               |

## Local development

Use Node.js **24.22.1** from [.nvmrc](.nvmrc) and npm **11.19.1** from [package.json](package.json). Install the pinned dependency graph from [package-lock.json](package-lock.json):

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000) after the development server reports that it is ready. The server binds to `127.0.0.1`. [The health route](http://localhost:3000/api/health) reports process liveness only, with `{"status":"ok","scope":"process"}`; it does not check database or CMS readiness. Stop the server with Ctrl+C.

Phase 2 requires no environment file, credentials, database or external service. [.env.example](.env.example) reserves blank server-only database/CMS/storage values for future integration. Keep them blank for this foundation. Database and CMS setup will be documented when their integration is authorized and implemented.

## Validation

Run the foundation checks before requesting review:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:smoke
```

Check results belong to a specific revision and environment. A successful build does not verify future authentication, content publication, accessibility or production readiness. See [acceptance and evidence](docs/engineering/phase-2-acceptance.md).

`test:smoke` requires the production build. It starts and stops its own local server and checks the placeholder, process health, robots policy and missing-route response. The placeholder is marked `noindex`; it is engineering verification content.

Verify the packaged standalone preview after the build:

```sh
node scripts/package-preview.mjs
npm run test:preview
```

`test:preview` checks the packaged server's responses and an actual JavaScript asset, without a database or secrets.

## Engineering preview

The [CI workflow](.github/workflows/ci.yml) runs the `quality` job and, after successful checks, packages a downloadable standalone preview. Open the successful run's summary for its artifact link. Artifacts expire after seven days; download access depends on GitHub permissions. This is a local engineering preview, not a hosted deployment.

Extract the artifact and use the pinned Node.js version in a compatible Linux environment, such as WSL. From the extracted folder, bind the standalone server to loopback:

```sh
HOSTNAME=127.0.0.1 node server.js
```

Follow its `PREVIEW-README.txt` and open `http://localhost:3000` and `/api/health`. CI packages on Ubuntu; native Windows compatibility of that artifact is not promised. Stop with Ctrl+C. For a native local production preview from source, run `npm run build` followed by `npm start`.

## Project layout

| Path                | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `src/app/`          | Minimal Next.js placeholder, metadata and process health route |
| `tests/`            | Focused health and production HTTP checks                      |
| `scripts/`          | Standalone preview packaging                                   |
| `.github/`          | CI workflow, issue/PR conventions and maintainer routing       |
| `docs/engineering/` | Public scope, architecture, acceptance and roadmap contracts   |

## Architecture and editing

Next.js is the selected application framework. Payload is intended to provide owner editing and content lifecycle primitives, with PostgreSQL as the selected persistent database. [Architecture boundaries](docs/engineering/architecture.md) distinguish this target from the foundation implementation.

The eventual owner workspace will edit content and visual design, including themes, typography, layouts and responsive settings. These are roadmap requirements; there is no usable owner editing workflow in Phase 2. [Later phases](docs/engineering/roadmap.md) require separate authorization.

## Documentation

- [Engineering index](docs/engineering/README.md)
- [Phase 2 acceptance](docs/engineering/phase-2-acceptance.md)
- [Ownership and review](docs/engineering/ownership.md)
- [Contribution guide](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

Screenshots will be added when the implemented product UI can be captured and verified. Deployment and operating instructions will follow actual integration and release work.

## License and credits

The repository license has not been selected. No license grant is implied by public visibility. Dependencies retain their respective licenses; personal content and media rights are separate decisions.

README organization was informed by the public [OmniForge](https://github.com/desanv01/omniforge) and [Flight Controller V2](https://github.com/desanv01/Flight-Controller-V2) repositories. Their licenses, assets, project claims and implementation are not incorporated by that reference.
