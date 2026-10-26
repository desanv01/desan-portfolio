# Ownership and integration

Repository maintainer: [@desanv01](https://github.com/desanv01). [CODEOWNERS](../../.github/CODEOWNERS) routes review requests to the maintainer. Actual review/check enforcement depends on GitHub repository settings and is recorded with the acceptance evidence.

## Task ownership

Each task records one delivery owner, a bounded path list, dependencies, acceptance checks and a handback. Ownership assignments belong in the linked issue/PR so contributors can inspect them without machine-local state.

| Area                                                      | Coordination rule                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| README, contribution/security docs and issue/PR templates | Keep scope, commands and public claims aligned with actual implementation       |
| Application and tests                                     | Assign non-overlapping paths; accept shared interfaces before dependent work    |
| Dependencies, lockfile and configuration                  | One integration owner; serialize installs and dependency changes                |
| CI workflows and repository controls                      | Maintainer reviews permissions, actual check names and enforcement availability |
| Git and remote integration                                | Maintainer coordinates branches, staging, PR integration and merged-main checks |
| Future migrations/releases                                | Separate authorization and one operation owner                                  |

## Review sequence

1. Open a parent phase issue and scoped issues with dependencies and acceptance criteria.
2. Assign paths before work; release ownership in the handback.
3. Review the complete diff and publication-safe evidence on the current head.
4. Require applicable successful checks and resolve review findings. Record platform limitations explicitly.
5. Integrate through the approved repository controls and verify merged `main`.
6. Close accepted scoped issues, then the phase parent when its full gate is satisfied.

Never use shared-checkout branch changes while another writer is active. A task handback is a request for review; it is not phase acceptance.
