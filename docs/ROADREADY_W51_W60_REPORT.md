# RoadReady W51–W60 execution evidence

## Merge Reconciliation

Recovery baseline HEAD de05d6a08b712ff0bc750dae44324c30bccdaa6e; merge source
74182ed5b6f072427e69b98fb834a1fcdb7336c9 (`feat/w16-w30-operational-mvp`).
No unmerged index entries or conflict markers were found. The 38 staged paths
include the operational platform, its household tests, dashboard components,
syntax corrections and the documented Neon PR workflow. RoadReady overlaps
pilot, agents, package scripts, README and Playwright configuration; work is preserved.
The Neon workflow is unchanged: pinned actions, schema-only preview branches,
no checkout of untrusted PR code, no application schema migration.
Authenticated pilot implementation existed in MERGE_HEAD but the resolution had
retained the demo page. Restored that interface, preserving RoadReady's Passport card.
Original page/API backups are in ignored `data/reconciliation/`.

## Baseline Gate Recovery

| Gate | Expected | Reproduced actual | Root cause / repair |
|---|---|---|---|
| domain.test.ts:12 guardian verification | ALLOW | REQUIRE_CONSENT | Fixture omitted required guardian consent; assert denial first, then supply consent |
| domain.test.ts:97 verified-entry dispute | ALLOW | DENY | GUARD limited dispute to pending despite withdrawal contract; allow pending/verified, retain role/consent/reason and repeat-dispute denial |
| household.spec.ts:6 full journey | Account onboarding | Missing account-button timeout at helper line 3 | Merge resolution retained demo UI; restore authenticated merge-side page |
| household.spec.ts:25 isolation | Separate accounts, deny cross-household | Same missing-button timeout | Same interface restoration; no weakened access assertions |

Additional lint gate: ESLint 9 with matching Next 15.5.26 config, flat compatibility,
core-web-vitals and TypeScript rules, `--max-warnings=0`. Eleven unused declarations
removed directly. No broad rule suppression. Build/runtime/generated artifacts excluded.
The old client-selected-role POST API now returns 410; read-only legacy educational
projection retained for existing dashboard/lesson consumers.
Final automated recovery: 81/81 unit/API tests, 7/7 RoadReady browser journeys,
2/2 household browser journeys, lint, typecheck and production build PASS.
Aggregate `npm run roadready:certify` exited 0 on 2026-09-28.
The restored practice form also needed an explicit accessible name for the Supervisor
select; the unchanged full journey then passed in 29.1 seconds.
Diagnostic browser runs used shorter timeouts; final runs use the repository's existing
180-second household timeout. This changes no journey assertions.
Dependency audit reports five advisories in the pre-existing Vitest 2/Vite development
toolchain; no force upgrade applied. Hosted security certification remains separate.

## Baseline
2026-09-28. HEAD `de05d6a`; branch `mvp-integration-w100`.

## Repository state
38 staged paths predate RoadReady. Existing unstaged changes: lib/domain.ts,
lib/domain.test.ts, next-env.d.ts, deleted supabase migration, untracked NeonDB/.
No existing work discarded. Neon workflow is protected.

## Merge state
MERGE_HEAD `74182ed5b6f072427e69b98fb834a1fcdb7336c9` remains active.
COMMIT BLOCKED — EXISTING MERGE. No branch switch, commit, push or hosted mutation.

## W51
Implemented typed concepts, challenges, learning sessions/evidence, guardian evidence,
mastery and recommendations. Scout has the full machine-readable agent contract.
The deterministic action allowlist denies all requested prohibited mechanisms.
Assignments and input/result safety decisions use the existing audit/records layer.
## W52
54 US-TX concepts, 216 deterministic variants, 54 original SVG learning assets.
Jurisdiction selection fails closed for unsupported packs. Structural validation checks
duplicate IDs, references, answers, jurisdictions, explanations, sources and files.
See `ROADREADY_CONTENT_SOURCES.md` for official references and retrieval limitations.
## W53
Five modes share one service, session model, response validator and accessible form.
No timer, speed reward or competitive metric. Neutral option identifiers do not expose
the server answer key. Answers and cursor changes commit atomically and resume on reload.
## W54
Incorrect evidence produces practicing and a next-day retry time. Due weak concepts
receive recommendation priority. Subsequent sessions select another challenge variant.
Three distinct variants in separate sessions, at least 24 hours apart, demonstrate
understanding. A fourth qualifying observation or later guardian confirmation reinforces.
Immediate retries are allowed for learning but cannot meet the temporal mastery gate.
The existing journey requirement is displayed above Scout; learning does not complete it.
## W55
`/teen/roadready` provides authenticated family access, Scout recommendations, resumption,
categories, five modes, Needs Another Look, Recently Demonstrated and recent evidence.
The teen dashboard links to RoadReady. Feature flag defaults off.
## W56
The guardian dashboard links to learning and Passport evidence. Linked guardians can
select learners, inspect progress and record Completed/Needs more practice while parked.
The learner cannot create guardian evidence. Original responses remain unchanged.
## W57
Road Knowledge & Awareness groups concept evidence by category, with qualifying
observation and guardian confirmation provenance. The existing Passport gains a scoped
learning card and evidence link. No legal, insurance or driver-safety certification is made.
## W58
Reuses the existing authenticated SQLite platform: records, transactions, requests,
sessions and audit. No second datastore. Server authorization checks active membership,
own teen/linked guardian relation, consent, adult sharing, jurisdiction and active drives.
Unsupported commands, forged correctness/roles, cross-origin writes and replayed answers
are rejected. Idempotency replay is authorized again before returning saved results.
Attempts/guardian evidence are append-only at SQL level. Passport projections retain
evidence IDs. Minimal educational events remain local; no external analytics vendor.
## W59
Seven RoadReady Playwright journeys pass in the final run (44.6 seconds), including
neutral answer identifiers and native keyboard submission. Desktop screenshot was
visually inspected; mobile layout has no horizontal overflow. The dedicated configuration
enables the feature and isolates its database/port. Default Playwright discovery keeps
the legacy household suite; `test:roadready:e2e` runs the seven new journeys separately.
Multi-day Passport fixtures are explicitly inserted into an isolated local test database;
production APIs never accept supplied observation dates or mastery. Service tests exercise
the same multi-day transition through the actual command service with a controlled clock.
## W60
`npm run roadready:certify` aggregates mandatory gates and returns nonzero on any failure.
Latest typecheck and production build pass. Latest unit/API suite: 81 total, 79 pass,
2 pre-existing failures, 0 skipped. New RoadReady tests: 29/29 passing.
`npm run lint` was attempted and fails because the baseline has no lint script.
Existing household Playwright regressions: 0/2 pass (missing baseline account interface).
## Migrations
`lib/platform/migrations/002-roadready.ts`: local schema version 2, idempotent append-only
evidence triggers. Applied inside existing transactions on the first authorized learning
request, verified against isolated SQLite databases. No new tables. Evidence protection
is intentionally retained on feature rollback; disable the feature flag to roll back UI.
Hosted migrations applied: NO. Existing deleted Supabase/untracked Neon migration work
was preserved and not interpreted or applied.
## Security
Service + real SQLite tests cover own access, unrelated access, guardian authorization,
consent/revocation, adult sharing, unsupported jurisdiction, drive deferral, forged input,
replay, immutable evidence and reopen persistence. HTTP tests cover no session, CSRF and
prohibited actions. SQLite has no RLS facility: no PostgreSQL/RLS certification is claimed.
Read-only `/admin/roadready` exposes educational content only, never learner records.
## Accessibility
Native forms, fieldset/legend, labeled radio buttons, keyboard focus, >=44px controls,
text alternatives, status/alert regions, reduced-motion CSS. Browser verification covers
keyboard answer selection/submission and 390px mobile overflow. This is functional
accessibility evidence, not a comprehensive WCAG or assistive-technology certification.
## Original regression findings (historical, repaired below)
Baseline: 52 tests, 50 passing, two failing before RoadReady changes. Same failures remain:

- `GUARD and supervised progress requires a parent to verify and leaves pending time out of progress`
- `W40-W50 MVP workflow requires parent role for correction/dispute and removes disputed time from progress`

Both are in pre-existing `lib/domain.test.ts` work and were not rewritten by this task.
Existing service tests continue to cover authentication, invitations, consent, drive
logging, ledger corrections, milestones and evidence. Existing domain/OS tests cover
Passport, parked preparation, COVER, notifications, lessons and calculator boundaries.
The two existing household browser journeys fail waiting for `New here? Create an account`
on `/pilot`; the visible pilot still uses the demo interface. Full browser regression
certification for all legacy features is therefore blocked and is not claimed.
`git diff --check` reports existing trailing blank lines in lib/domain.ts and
lib/domain.test.ts; RoadReady did not modify those files.
## Browser evidence
`docs/screenshots/roadready-signin.png`: agent-browser page-load inspection, labeled
controls, no reported browser errors. Playwright captures desktop/mobile learning
screens in `docs/screenshots/roadready-{desktop,mobile}.png`.
Machine-readable unit results: `docs/ROADREADY_TEST_RESULTS.json`.
Machine-readable browser results: `docs/ROADREADY_BROWSER_RESULTS.json` (final run).
## Known limitations
Authenticated pilot integration is restored; legacy shared JSON API surfaces remain a security blocker.
RoadReady uses local platform credentials; it does not pretend these sessions are the
separate Supabase Google OAuth session. Hosted deployment and RLS remain unverified.
Content uses four structured variants per concept; it is foundational education rather
than an official permit examination or certified assessment. Source review and faithful
roadway sign installation specifications are outside automated structural validation.
The learning pack is US-TX only. The admin catalog is read-only public learning content.
## Original certification (historical)
BLOCKED. Mandatory baseline gates remain red: two unit failures, two legacy browser
failures and missing lint command. Merge prevents an independent RoadReady commit.
No commit, push, deployment or hosted data mutation was performed.

Next action: reconcile the existing merge's authenticated pilot interface and its
consent/verification fixtures, then rerun the aggregate certification command.

## Files added and modified

Added: `lib/roadready/{types,content,rules,agent,service,roadready.test}.ts`,
`lib/platform/migrations/002-roadready.ts`, `app/api/roadready/` (route, HTTP tests,
availability), `app/teen/roadready/` (page and CSS), `app/admin/roadready/page.tsx`,
`components/RoadReady.tsx`, `components/RoadReadyCard.tsx`, 54 SVGs under
`public/roadready/`, `e2e/roadready.spec.ts`, `playwright.roadready.config.ts`,
`scripts/roadready-assets.mjs`, `scripts/roadready-certify.mjs`, source/report/result
documents and three screenshots.

Modified for integration: `.env.example`, `.gitignore`, `README.md`, teen/guardian
dashboard pages, pilot Passport page, `lib/platform/agents.ts`, `package.json`,
`playwright.config.ts`, `docs/{ARCHITECTURE,BRD,AI_STRATEGY}.md`.
Next.js also added its RoadReady build-types directory to `tsconfig.json`.
Pre-existing staged/unstaged files are not attributed to RoadReady.

Final totals (unit + browser): 90 tests, 86 passing, 4 failing, 0 skipped.
Breakdown: 52 existing unit tests (50 pass, 2 fail), 29 new unit/API tests (all pass),
7 new browser journeys (all pass), 2 existing browser journeys (both fail).
No tests were skipped. RLS is not an available SQLite capability, not a skipped test.

## Current W60 / W61 gate result — 2026-09-28

All 90 unit/API/browser tests pass, zero failures or skipped tests: 52 existing
unit/API tests, 29 RoadReady tests, 7 RoadReady journeys and 2 household journeys.
Typecheck, lint (zero warnings), build and aggregate command pass. Functional
accessibility checks pass within the stated keyboard/mobile scope. Working-tree
`git diff --check` passes; the preserved staged snapshot still has pre-existing
trailing-blank-line findings and has not been restaged.

Security: BLOCKED. Unauthenticated legacy `/api/pilot` and `/api/os/status` expose
shared persisted JSON state; `/api/lessons` reads and mutates shared attempts
without authenticated learner/household scope. Authenticated workspace/RoadReady
isolation checks pass but do not certify these legacy endpoints. Production
package audit is clean; five development-toolchain advisories remain.

The aggregate JSON uses AUTOMATED_GATES_PASSED to avoid implying that its six
commands establish application security or hosted certification. Its recorded
exit codes and timings are unchanged. Final status: BLOCKED — LOCAL CERTIFICATION
INCOMPLETE (security). Original failures above are historical, not current failures.

Active merge and its 38 staged paths remain preserved. No commit, push, hosted
migration or deployment performed. See ROADREADY_W61_RELEASE_REPORT.md for exact
security findings and the separate SQLite/hosted persistence gap.

Next action: migrate or retire the legacy shared-state API surfaces with
unauthenticated and cross-household regression tests, then rerun certification.


## W62 follow-up — local security remediation complete

The legacy API security blockers documented above have now been remediated.
See `ROADREADY_W61_RELEASE_REPORT.md`, W62 Security Certification, for current
endpoint policies and limitations. Final local totals: 111/111 tests PASS (101
unit/API + 10 browser); security:certify, roadready:certify, typecheck, lint and
isolated production build PASS. No commit, push or hosted change performed.
Hosted release remains a separate W63 gate.
