# Roadmap and authorization boundary

Phases 2 and 3 are complete. Phase 4 now implements the public frontend and publication-driven design renderer. Phase 5 and later remain planning only. A roadmap entry, dependency installation or approved design does not authorize starting a later phase.

| Phase                    | Planned outcome                                                                                              | Key acceptance boundary                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 3 — Backend/content      | Schema, migrations, owner auth, media, drafts, versions, preview/publishing and versioned design data        | Authorized mutations only; public draft isolation; coherent publication and recovery |
| 4 — Public frontend      | Responsive shell, home, work/case studies, profile, journal, contact/resume/search and configurable renderer | Approved design implementation using verified published data                         |
| 5 — Owner workspace      | Content editors, media, settings, scheduling and visual Design Studio                                        | Owner can edit, preview, publish, recover and restore without source changes         |
| 6 — Integrations/content | GitHub metadata, LinkedIn link/share bridge, approved migration and SEO                                      | Provenance and privacy review; failure behavior; no implied private-network sync     |
| 7 — Validation           | End-to-end, security, responsive/accessibility/performance and customization testing                         | Independent evidence and regression closure across visitor/owner flows               |
| 8 — Launch/handover      | Production config, backup/restore, domain/release checks and owner guide                                     | Explicit deployment authorization, verified operating costs and release acceptance   |

Production deployment, paid services, personal-content publication and unresolved license decisions remain separate gates. Phase 4 completion stops at the public frontend; it does not silently advance this roadmap.
