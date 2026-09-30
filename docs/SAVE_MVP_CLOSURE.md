# SAVE MVP closure

## Phase 25 — local regression and build certification
Required:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build:cert`
- `npm run save:certify`

Local certification must pass before merge.

## Phase 26 — PostgreSQL/Neon persistence validation
SAVE uses the canonical `records` persistence abstraction rather than a second datastore. The PostgreSQL parity suite now includes SAVE household-scoped persistence coverage.

Run locally against a disposable PostgreSQL database:
`npm run persistence:certify`

Hosted Neon certification additionally requires the production `DATABASE_URL` and existing Teensurance hosted schema/runtime role. No destructive hosted test is permitted.

## Phase 27 — parent SAVE browser certification
Run:
`npm run test:save:e2e`

The browser journey verifies:
- guardian access to the SAVE workspace;
- guardian-only insurance ownership;
- teen denial from SAVE APIs;
- teen-facing parent-ownership messaging;
- responsive parent SAVE workspace.

Live quote and email provider behavior remain separate integration certification because they require external credentials.

## Phase 28 — merge readiness
A SAVE merge is ready only when:
1. typecheck, lint, unit tests and build pass;
2. SAVE unit and browser tests pass;
3. PostgreSQL persistence parity passes;
4. no live carrier/email/Neon dependency is falsely reported as certified;
5. parent ownership and non-binding COVER boundaries remain intact;
6. the working branch is clean and PR review checks are green.

### External blockers
These are configuration dependencies, not code defects:
- hosted Neon `DATABASE_URL`;
- `CRON_SECRET`;
- Resend email credentials;
- carrier adapter definitions and provider credentials.
