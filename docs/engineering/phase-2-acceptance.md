# Phase 2 acceptance

Historical Phase 2 gate: completed in PR #6. The later direct Phase 3 authorization is recorded in [Phase 3 acceptance](phase-3-acceptance.md); the original stop boundary below describes Phase 2's scope at its completion.

Phase 2 is authorized for the repository and engineering foundation. These are acceptance requirements, not a declaration that all checks have passed. Completion is recorded through the linked GitHub issues, PR review and actual CI evidence.

| Task | Deliverable                                                       | Required evidence                                                                                                                      |
| ---- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| P2.1 | Public repository and truthful README/About; issue/PR conventions | Verified repository URL/visibility, exemplar audit, public-content review and working documentation links                              |
| P2.2 | App/toolchain, pinned dependencies and environment examples       | Declared runtime/package-manager versions, committed lockfile, clean `npm ci`, development startup and reproducible build              |
| P2.3 | Formatting, lint, types, tests, build and CI; engineering preview | Observed command results, current-head workflow run, actual preview/health evidence with environment and limitations                   |
| P2.4 | Ownership, backlog, review and merge controls                     | Parent/subphase issues, explicit ownership/dependencies, reviewed PR, available repository controls and post-merge `main` verification |

## Evidence record

Every verification record should identify its task, source revision, timestamp/timezone, environment/runtime, command or browser action, exit code or observed response, and limitations. Sanitize logs before publication. Link CI runs and PRs directly; never substitute a generic Actions page for a passing run claim.

The foundation check contract is `npm ci`, `npm run dev`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and then `npm run test:smoke`. Development startup requires a bounded health observation and shutdown, not a claim based solely on launching a process. CI uses workflow `ci.yml`, job `quality`. Its downloadable standalone artifact is an engineering preview, not a hosted deployment; local verification and actual artifact evidence belong in the linked task/PR.

## Tracking

After the production build, package the standalone preview with `node scripts/package-preview.mjs` and run `npm run test:preview`. This verifies the packaged server and an actual JavaScript asset; record its outcome separately from source-server smoke tests.

The [Phase 2 parent issue](https://github.com/desanv01/desan-portfolio/issues/1) aggregates [P2.1 repository/docs](https://github.com/desanv01/desan-portfolio/issues/2), [P2.2 foundation](https://github.com/desanv01/desan-portfolio/issues/3), [P2.3 CI/preview](https://github.com/desanv01/desan-portfolio/issues/4) and [P2.4 coordination](https://github.com/desanv01/desan-portfolio/issues/5). Issue existence establishes tracking, not acceptance or completion.

## Review and completion

The maintainer reviews the current PR head, confirms all applicable checks, integrates through configured controls and verifies the resulting `main` revision. Required-check enforcement and independent review must be reported as actually configured or available; CODEOWNERS alone does not enforce either.

Phase 2 completion requires evidence for P2.1–P2.4 and closure of acceptance blockers. It does not accept the full portfolio. Later-phase work remains unauthorized, including schemas, authentication, media/publishing workflows, public product pages, owner editing, integrations and production launch.
