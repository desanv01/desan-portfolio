# Phase 3 acceptance

Phase 3 authorizes backend/content foundations only. These are requirements, not declarations that unobserved tests passed. Completion requires reviewed source, actual checks and verified merged main.

| Task | Required evidence                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3.1 | Matching Payload pins; empty PostgreSQL forward migration/reapplication; idempotent synthetic drafts; content richness, typed relationships and constraints       |
| P3.2 | Closed anonymous first-owner/signup; explicit local bootstrap; owner login/logout/session/recovery; anonymous/nonowner denial; no token/secret disclosure         |
| P3.3 | Persistent guarded files; byte/type/resource rejection; private direct URLs; immutable replacements; correct published access/withdrawal                          |
| P3.4 | Published A remains public while newer B is draft; exact-version preview/publication; restore/unpublish; slug mappings; coherent conflict/rollback/cache behavior |
| P3.5 | Arbitrary design values/schema migration; inheritance including zero/false; unsafe import rejection; pinned font/media refs; coherent content/design publication  |

[Parent #7](https://github.com/desanv01/desan-portfolio/issues/7) tracks [schema #8](https://github.com/desanv01/desan-portfolio/issues/8), [auth #9](https://github.com/desanv01/desan-portfolio/issues/9), [media #10](https://github.com/desanv01/desan-portfolio/issues/10), [publication #11](https://github.com/desanv01/desan-portfolio/issues/11) and [design #12](https://github.com/desanv01/desan-portfolio/issues/12).

Main owns CI/Git/local database infrastructure. Backend serializes packages/schema; design owns its model/tests; an independent reviewer checks source/evidence. The PR must record sanitized ownership, real command results, limits, exact revision and CI links. Verify protected integration and merged main before closing accepted issues.

This does not implement or accept Phase 4 public frontend, Phase 5 custom owner workspace, Phase 6 real content or Phase 8 operations. Supported media and local recovery limits must remain explicit. Installing Payload or opening its admin page does not prove custom editing workflows.
