# RoadReady W61 release preparation

## W62 Security Remediation

Current W62 verification supersedes the historical W61/W63 blocker sections below.
W62 is local-only: no merge completion, staging changes, commit, push, hosted
migration or deployment is authorized in this wave.

### Inspection and root causes

| Endpoint | Original methods / access | Original data source | Callers | W62 policy |
|---|---|---|---|---|
| `/api/pilot` | GET unprotected; POST already retired | Shared `data/pilot.json` | Teen/parent dashboards, lessons page | GET authenticated learner projection; POST 410 |
| `/api/os/status` | GET unprotected global workflows/inbox | Shared JSON store | Admin console | 410; admin page shows unavailable notice |
| `/api/lessons` | GET/POST unprotected private progress | Shared JSON store | Lessons page | GET/POST scoped private progress; separate public `/api/lessons/catalog` |

The old routes had no session, membership or relationship authorization and
persisted every family's progress into one JSON record. Neither client role
selection nor filtering a shared response establishes authorization.

### Authorization and service boundary

`requestUser` authenticates the existing `teensurance_session` cookie against
hashed, expiring SQLite sessions. `authorizeLearner` resolves active membership
from the authenticated user's ID, validates a requested household against that
membership, verifies own-teen or linked-guardian access, then loads the requested
profile. Adult sharing remains required. Supervisors receive no learning access;
no role is implicitly treated as admin. RoadReady reuses this helper and retains
its consent, active-drive, jurisdiction, feature-flag and mutation-specific checks.

`legacy-learning.ts` validates scope and commands with strict schemas and repeats
authorization at the service boundary. Private profile/progress reads use SQL
household and owner predicates. Client IDs select resources but never grant
access. Unknown body/query fields (role, guardianId, userId, id) are rejected;
identity headers are ignored and cannot override the session. No legacy endpoint
has an ID-bearing path route. Unknown paths retain framework 404 behavior.

Lesson definitions are public; private attempts are stored as `lesson_progress`
records scoped by household and learner in the existing transactional database.
Only the learner can answer or complete lessons. Guardians can read linked
progress. Mutations require same-origin JSON requests and enforce prerequisites,
consent and parked state. Successful actions and authenticated denials are audited.
No shared JSON history is automatically assigned to a family because it lacks
trustworthy ownership provenance. The old file is left intact but has no API caller.

Dashboard callers now handle authorization/setup errors with a workspace link.
The compatibility projection includes scoped drives and lesson progress; it does
not fabricate legacy safety checks or Passport evidence. Mixed night-minute totals
are preserved. Global admin data is retired, not merely hidden in the UI.

### Security coverage and certification commands

20 new unit/API tests cover unauthenticated reads/writes, public catalog separation,
retired operations, persisted own progress, linked guardian access, unrelated
households, same-household siblings, direct service IDOR, forged role/guardian/user
IDs, query/body tampering, forged headers, CSRF, guardian answer impersonation,
revoked relationships, consent, adult sharing and active-drive denial. A source
invariant rejects API imports of the old shared JSON store. A projection regression
checks mixed night minutes.

`security:certify` executes 57 real tests: the new suite plus platform service,
workspace HTTP and RoadReady service/HTTP authorization suites. Failures return a
nonzero exit status. `roadready:certify` now includes this security gate, followed
by typecheck, strict lint, all unit/API tests, production build and both browser
suites. Build uses the existing `.next-cert-build` output isolation to avoid
colliding with a development server's `.next` artifacts.

The additional browser/API journey verifies lesson completion and refresh,
linked-guardian visibility, unrelated access denial, dashboard rendering and the
retired admin page without browser runtime errors. Existing journey assertions
remain intact.

## W62 Security Certification

Result: SECURITY CERTIFIED LOCALLY for the W62 household-authorization scope.
Final `roadready:certify` exited 0; all seven command gates passed, including
`security:certify`. Evidence timestamp: 2026-09-28T16:19:13.835Z.

| Gate | Result |
|---|---|
| Focused security suite | 57/57 PASS |
| Complete unit/API suite | 101/101 PASS |
| Original household journeys | 2/2 PASS |
| Original RoadReady journeys | 7/7 PASS |
| New legacy security browser journey | 1/1 PASS |
| Typecheck | PASS |
| ESLint, zero-warning gate | PASS |
| Isolated production build | PASS |
| security:certify | PASS |
| roadready:certify | PASS |
| Working-tree diff whitespace check | PASS |

Previous tests: 90. Added tests: 20 unit/API security/projection checks and one
browser security journey. Total unique tests: 111; passing 111, failing 0, skipped 0.
The focused security suite overlaps the complete suite and is not counted twice.
Functional keyboard/mobile accessibility checks remain green; no comprehensive
assistive-technology certification is claimed.

The initial default-directory build failed with missing generated `/_document`.
The final build uses the repository's isolated certification output and passes.
A pre-existing nonblocking Autoprefixer warning about `align-items: end` remains;
strict ESLint reports zero warnings. Vitest's CJS deprecation and the browser
NO_COLOR/FORCE_COLOR notices are also nonblocking.

Machine-readable results: `ROADREADY_CERTIFICATION.json`,
`ROADREADY_TEST_RESULTS.json`, `ROADREADY_BROWSER_RESULTS.json`. The aggregate
reports AUTOMATED_GATES_PASSED; this reviewed section establishes the narrower
W62 local authorization result, not a hosted release claim.

No API imports `lib/store.ts`; shared JSON APIs are no longer exposed. Unauthenticated,
cross-household, cross-teen, guardian-only mutation, role escalation, ID tampering
and RoadReady authorization regressions all pass. The active merge source and all
38 staged paths are preserved. No commit, push, hosted migration or deployment.

Next action: resume W63 from Phase 1, retaining the hosted blockers below.

### Remaining boundaries

Local authorization certification is not hosted certification or a comprehensive
penetration-test claim. Hosted SQLite/PostgreSQL adapter and migration work remains
for W63. Supabase invitation/referral routes retain their separate authenticated
provider path; their deployed RLS is not certified by these SQLite tests. The local identity SQL
contains `members_self_insert` checking only `user_id = auth.uid()`, without
proving invitation or household authority. This is a W63 hosted-schema blocker:
validate and replace that policy through the approved migration path before any
hosted release. No hosted schema was changed in W62. Public
help/rules/catalog routes contain definitions rather than learner state.

Five previously recorded Vitest/Vite development-toolchain advisories remain
outside this household-authorization repair; production dependency audit was clean
in the preceding review. Global admin operations remain deliberately unavailable
until explicit admin authorization exists. Legacy unowned JSON history requires
an explicit provenance-reviewed migration if recovery is desired.



## W63 precondition verification — 2026-09-28

BLOCKED — LOCAL SECURITY CERTIFICATION INCOMPLETE.

The newly supplied W63 brief requires W62 `SECURITY CERTIFIED LOCALLY` and a
passing `security:certify` before any commit, push, migration or deployment.
Repository inspection confirms that `package.json` has no `security:certify`
script and no W62 security certification report was found in docs. The three
legacy routes described below still read shared JSON state without household
authorization; lessons still permits unauthenticated writes.

HEAD remains `de05d6a08b712ff0bc750dae44324c30bccdaa6e`; active merge source remains
`74182ed5b6f072427e69b98fb834a1fcdb7336c9`. Existing staged and working-tree code
was preserved. No new test run was needed to establish the missing prerequisite;
the passing automated results below are from the previous recovery run.

W63 release operations were not started. W64–W70 implementation was not started
because its explicit W63 hosted-certification/resolved-blockers precondition is
also unmet. No commit, push, hosted migration, deployment or hosted test occurred
during this precondition check.

Next action: complete W62 household security remediation and its certification
before resuming W63. The attached execution briefs contain W61, W63 and W64–W70;
they do not contain a W62 execution brief or evidence of W62 completion.

Status: BLOCKED — LOCAL CERTIFICATION INCOMPLETE (security review).

Baseline: de05d6a. Branch: mvp-integration-w100.
Merge source: 74182ed, feat/w16-w30-operational-mvp.
No commit, push, hosted migration or deployment performed during recovery.

Local recovery has restored the merge-side authenticated pilot and retired its
client-selected-role mutation endpoint. Unit/API tests: 81/81 pass. ESLint gate
passes with Next core-web-vitals and TypeScript recommended rules, zero warnings.
Baseline browser journeys pass (2/2); RoadReady browser journeys pass (7/7).
Production build and typecheck pass. Aggregate rerun results are recorded in
`ROADREADY_CERTIFICATION.json`. Its automated gates do not include a complete
application security review and do not authorize release on their own.

## Mandatory security blocker

Code review found unauthenticated legacy shared-state endpoints:

- `GET /api/pilot` returns persisted `data/pilot.json` state.
- `GET /api/os/status` returns that state's operational inbox, events and context.
- `GET /api/lessons` returns shared lesson attempts; `POST /api/lessons` writes
  those attempts without authenticated household/learner scope.

The repaired pilot mutation endpoint returns 410 and authenticated workspace /
RoadReady isolation tests pass, but they do not cover these legacy paths.
Do not classify application security as PASS until legacy data access is retired
or migrated to authenticated, household-scoped domain services, with regression tests.
This is broader than the four baseline failures; no auth-system rewrite was made.
Production dependency audit reports zero vulnerabilities. The development dependency
audit reports five findings in the existing Vitest/Vite chain, including a critical
Vitest development-server advisory. No force upgrade was applied.

## Release record

Local certification commit: none; checks exercised the working tree.
Merge commit: none; active merge preserved.
RoadReady commit: none. Push SHA / remote branch: not pushed / mvp-integration-w100.
Committed-state certification: not run; release precondition failed.
Hosted database target: not established for the operational platform.
Hosted migration IDs/results: none applied; no hosted migration history changed.
Deployment ID/URL: none created. Hosted feature flag: not changed or verified.
Hosted teen, guardian, Passport and authorization journeys: NOT RUN.
Household isolation: local workspace and RoadReady tests PASS; legacy paths block security.
Regression smoke: local automated checks only; no hosted certification claimed.

Hosted preflight must account for the fact that current platform/RoadReady
persistence is node:sqlite. Neon PR workflow only provisions schema-only branches;
it neither supplies a hosted application adapter nor migrates SQLite records.
No hosted certification is claimed.

## Persistence impact identified locally

| RoadReady object | Local | Migration exists | Hosted target |
|---|---|---|---|
| Concepts / challenges | Versioned TypeScript content | No database object needed locally | Bundled content |
| Sessions | `records`, kind `roadready_session` | SQLite base schema | Unmapped |
| Attempts | `records`, kind `roadready_attempt` | SQLite migration 2 append-only trigger | Unmapped |
| Guardian reinforcement | `records`, kind `roadready_guardian` | SQLite migration 2 append-only trigger | Unmapped |
| Mastery / Passport section | `records`, kind `roadready_mastery` | SQLite base schema | Unmapped |
| Scout recommendations | `records`, kind `roadready_recommendation` | SQLite base schema | Unmapped |
| Events / assignments | `records`, kinds `roadready_event`, `assignment` | SQLite base schema | Unmapped |
| Safety decisions / idempotency | `audit` / `requests` | SQLite base schema | Unmapped |

The existing identity migration relocation from `supabase/migrations` to
`NeonDB/migrations` is byte-equivalent after newline normalization. It does not
provide a hosted adapter or migration for these operational records. The Neon
workflow remains unchanged. Formal hosted preflight follows the unmet local gate.

## Rollback and next action

No hosted changes require rollback. Baseline local commit: de05d6a; previous
known-good hosted deployment is unverified. RoadReady defaults off and can be
disabled with `ROADREADY_LEARNING_ENABLED=false` in a future intended environment.
SQLite migration 2 is data-preserving and forward-fix only; retain evidence and
append-only protections. Do not delete learner history to roll back the feature.

Next action: migrate or retire the three legacy shared-state API surfaces and add
cross-household/unauthenticated regression coverage before rerunning the local gate.


## W63–W68 continuation (supersedes earlier next-action entries)

W63 merge dc66bdf5ae27e38e5d362cb988d169e67ebb34ac completed, passed committed-state
certification (111 baseline tests plus typecheck/lint/build) and was pushed normally
to origin/mvp-integration-w100. W64–W68 implementation and final certification are
tracked in [ROADREADY_W63_W68_REPORT.md](ROADREADY_W63_W68_REPORT.md).

The three legacy shared-state surfaces are now isolated/retired with authorization
regression coverage. Hosted release is still blocked: operational persistence is
SQLite without a hosted mapping, the legacy membership insert policy is unsafe,
no intended Teensurance project appears in connected Supabase inventory, and the
Vercel project-detail connector fails its idOrName schema validation. No unrelated
project was touched. Local passing tests do not certify hosted persistence or RLS.
