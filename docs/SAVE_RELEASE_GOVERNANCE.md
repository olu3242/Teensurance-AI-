# SAVE release governance

## Phase 29 — CI enforcement
The dedicated `save-mvp-certify.yml` workflow runs on SAVE-related pull requests and pushes. It certifies typecheck, lint, unit tests, production build, SAVE-specific tests and the parent SAVE Playwright journey.

A merge should require this workflow to be green.

## Phase 30 — hosted readiness gate
`scripts/save-hosted-readiness.mjs` reports whether external dependencies are configured without printing values or mutating hosted systems.

Expected gates:
- Neon/PostgreSQL connection;
- cron secret;
- transactional email configuration;
- carrier adapter configuration.

A missing external integration is reported as BLOCKED, not silently treated as certified.

## Phase 31 — admin observability
The operations console surfaces SAVE runtime readiness via the admin-only `/api/admin/save-health` endpoint. It displays configuration state and SAVE record counts only.

It must never surface:
- carrier credentials;
- policyholder secrets;
- underwriting scores;
- individual teen driving-risk conclusions.

## Phase 32 — merge governance
Before merging SAVE:
1. dedicated SAVE CI is green;
2. general branch/build certification is green;
3. PostgreSQL persistence parity has passed on a disposable database;
4. parent/guardian ownership tests remain green;
5. non-binding COVER boundary remains green;
6. hosted readiness blockers are documented;
7. no credential values are present in commits, logs or PR discussion;
8. the PR remains draft until the above checks have evidence.

After merge, production promotion should follow the existing Vercel deployment process. Do not promote a preview with failed SAVE certification.
