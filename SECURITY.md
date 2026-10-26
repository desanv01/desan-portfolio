# Security

This project is an engineering foundation under development. There is no production release or supported release series yet. Maintainer review currently targets the latest `main` revision.

## Reporting

If GitHub displays **Report a vulnerability** under this repository's Security tab, use that private reporting channel. Private reporting availability must be checked in the repository; this document does not claim it is enabled.

If private reporting is unavailable, open a minimal issue requesting a private contact channel. Include only a general component name and impact category. Do not publish exploit details, credentials, private data or sensitive logs while arranging contact. No response-time commitment or bounty program is offered.

For a report through a private channel, include the affected revision, environment, reproduction steps, expected/actual behavior and impact. Use synthetic data where possible. For an accidentally disclosed credential, revoke or rotate it with its provider before sharing sanitized evidence.

## Current boundaries

Phase 3 adds owner authentication, authorization, draft isolation, guarded uploads and selected-version publishing. Acceptance requires dedicated database/API tests and independent review on the actual revision. Local recovery capture and media storage are evaluation facilities, not production services. Unsupported upload formats are rejected. A dependency scan or successful build alone does not establish these controls.
