# Contributing

Current execution scope is Phase 3, the backend foundation. Read the [acceptance criteria](docs/engineering/phase-3-acceptance.md), [backend setup](docs/engineering/backend.md) and [roadmap](docs/engineering/roadmap.md) before starting work. An issue or feature request does not authorize later phases.

## Propose and scope work

Use a bug report for reproducible defects, a feature request for a proposed improvement, or an engineering task for bounded delivery. Each accepted task needs an owner, dependency list, allowed paths, observable acceptance criteria and evidence location. Use `P3.1` through `P3.5` for Phase 3 tasks and link them to the phase parent issue.

The maintainer coordinates shared files and integration. Check [ownership](docs/engineering/ownership.md) before editing shared configuration, dependency files or workflows. Do not run competing installs, checkout operations or migrations in a shared checkout.

## Develop and verify

Use the repository's declared Node.js/npm versions and `npm ci`. Start development with `npm run dev`. Run these checks before requesting review:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run db:migrate
npm run test:backend
npm run build
npm run test:smoke
npm run test:backend-routing
node scripts/package-preview.mjs
npm run test:preview
```

Add focused tests for changed behavior where they provide meaningful coverage. Documentation-only changes need accurate commands, valid links and a public-content review. Record any check that could not run and its concrete cause; do not report an unobserved result as passing.

## Pull requests

Keep commits coherent and PRs independently reviewable. Describe the triggering problem, resulting behavior, linked issue, acceptance evidence and remaining limitations. Include the tested revision and environment. Capture implemented UI changes at relevant viewports when UI work is authorized.

Request maintainer review after applicable checks pass on the current PR head. If the head changes, verify the affected checks again. Merge through the repository's configured review/check controls; document unavailable hosting controls rather than implying they are enforced. The maintainer verifies merged `main` before closing the task.

## Public material

Submit only publication-safe source and evidence. Exclude secrets, database dumps, private profile/contact information, raw authenticated-session research, generated design packs and machine-local planning/runtime state. Use sanitized synthetic examples. Do not add personal achievements, screenshots, live URLs or license declarations without evidence and the applicable approval.

Report security issues through [SECURITY.md](SECURITY.md). License selection remains pending; contributors must not assume an open-source license has been granted.
