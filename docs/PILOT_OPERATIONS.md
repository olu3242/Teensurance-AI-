# Pilot operations

Status: local automated gates passed; hosted certification blocked. No hosted pilot has launched.

## Enrollment and onboarding

Use Neon project `icy-tree-05791271` for hosted operational PostgreSQL. SQLite is development/testing only. Configure a dedicated runtime login with membership in `teensurance_runtime`; never use the migration owner as the hosted application login.

Set `PILOT_ENABLED=true` only after release gates pass. Explicit server-side `TEENSURANCE_ADMIN_USER_IDS` authorize `/admin/operations`. Create a cohort and an email-bound, seven-day guardian invitation. An operator delivers the returned token through the approved pilot process; the application does not send invitations automatically. Invitation redemption is one-use and idempotent. Referral codes grant no membership or pilot access.

Guardians authenticate, create a household in `/pilot`, link a teen using the trusted household invitation, complete profiles and consent, and visit `/pilot/onboarding`. Confirm Texas (US-TX), read the safety, Scout Learning, driving-log and Passport introductions, and acknowledge the pilot expectations. The learner completes orientation on their own account. The guardian activates the pilot. Unsupported jurisdictions are rejected explicitly. Existing learners cannot join another household by accepting an invitation.

Lifecycle: invitation -> onboarding -> active -> paused/completed/withdrawn. A paused pilot can resume; completed/withdrawn enrollments cannot reactivate through this flow. Pausing blocks Scout Learning and new driving sessions; existing drive completion remains available. Adult learners control family sharing. No teen can grant themselves guardian privileges.

## Operations and support

`/api/health` returns only `{status: "ok"}` or HTTP 503 `{status: "unavailable"}`. It proves database reachability, not an end-to-end workflow or successful writes.

Unexpected API exceptions return a random `TS-` support reference. Minimal server logs and `operational_errors` correlate reference, category and timestamp; no exception text, database URL or learner identity is included. During a database outage the server log remains the fallback. The initial unexpected-error path uses `PERSISTENCE_FAILURE`; the shared taxonomy also defines auth, membership, household, content, Passport and invitation categories. Detailed subsystem classification and retention automation remain follow-up work.

`/admin/operations` requires the explicit admin allowlist. It exposes aggregate record/event/status counts, recent support references and a bounded content-feedback review queue. Feedback omits household/learner IDs; operators must treat submitted free text as potentially sensitive. Never copy it into public incident reports. No private learner answer history is returned.

Mutations retain idempotency keys on network retries. Persistence transactions commit evidence and projections together; failures roll back. Domain parity checks cover concurrent invite redemption, duplicate commands, transaction rollback and expired sessions.

## Analytics and governance

Educational product operations are not insurance underwriting data. No risk score, insurance probability, driving leaderboard or speed score is generated. Event counts are occurrences with distinct household counts, not a claim of unique learners or a fully validated conversion funnel. The operations view includes distinct-household funnel stages, seven-day activity, incorrect-attempt, demonstration, reinforcement and Scout completion rates, plus a distinct permit-topic count. Rates use explicit denominators and return null when no denominator exists. This is aggregate operational evidence; longitudinal cohort retention and detailed per-topic/hazard retry analysis remain future refinements.

Guardians/learners report content issues from onboarding while enrolled and parked. Feedback enters `review_required`; administrators record triage decisions. These actions never alter publication. Content revisions require separate digest-bound review at `/admin/scout`, with the explicit reviewer allowlist, human source attestation, approve/publish/retire transitions and immutable review events. Existing content approvals are not fabricated; the exported review packet remains REVIEW REQUIRED. Scout/coach templates and Texas rule snapshots also need human review before launch.

## Rollback and launch controls

- Feature: set `PILOT_ENABLED=false` to block enrolled/hosted pilot activity. Disable `SCOUT_LEARNING_ENABLED` to stop learning. Neither deletes evidence.
- Application: return to a recorded compatible deployment SHA. The pre-conversion SHA is not a safe PostgreSQL application rollback; use a PostgreSQL-compatible verified release or stop pilot traffic.
- Database: take a provider backup/branch before migration. Applied migration checksums are immutable. Prefer forward fixes; never drop learner evidence to roll back an application. Migration runner currently permits only loopback dry runs.
- Content: retire a problematic digest; preserve evidence and review history. A changed digest requires new review.

Launch requires configured Neon runtime/migration roles, reviewed migrations, backup/restore proof, human content approvals, all local gates, a reviewed committed SHA, hosted family E2E and hostile authorization checks, and verified deployment identity. None of the local test accounts are actual pilot families.
