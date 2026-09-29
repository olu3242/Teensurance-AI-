# Hosted persistence architecture — W69

Status: DECISION CONFIRMED; asynchronous adapter integrated; final certification in progress.

## Decision

Neon project `icy-tree-05791271` owns Teensurance operational PostgreSQL. The user
confirmed this provider, project and purpose explicitly. SQLite is development,
local testing and fixtures only. There will be one authoritative operational store.

Repository evidence: .github/workflows/neon-pr-branches.yml provisions schema-only
Neon preview branches; GitHub NEON_PROJECT_ID matches this project; a NEON_API_KEY
secret name exists (its value was not read). Neither is an application connection
string. The existing NeonDB identity SQL actually requires Supabase auth.users and
roles; its directory name does not make it a portable Neon migration.

## Inventory and mapping

| Domain | Current store | Hosted mapping | Ownership |
|---|---|---|---|
| Operational accounts/password hashes | SQLite users | teensurance.users | authenticated user |
| Operational sessions | SQLite sessions | teensurance.sessions | user foreign key, hashed token |
| Households | records: household | teensurance.records: household | creator, household |
| Memberships | records: member | teensurance.records: member | household + user + trusted role |
| Learner/consent/sharing | records: profile | teensurance.records: profile | household + learner |
| Guardians/supervisors | records: relationship | teensurance.records: relationship | household + adult + learner |
| Invitations | records: invite | teensurance.records: invite | issuing guardian + household |
| Driving logs/attestations | records: drive; ledger | same record kind; teensurance.ledger | household + learner + supervisor |
| Milestones/COVER | records: evidence; computed journey | same record kind, deterministic projection | household + learner; COVER guardian-only |
| Reminders | records: reminder | same record kind | household + owner + learner |
| Agent assignments/safety decisions | records: assignment; audit | same record kind; teensurance.audit | actor + household |
| RoadReady sessions | records: roadready_session | same record kind | household + learner |
| Learning/hazard evidence | records: roadready_attempt | same record kind, immutable | household + learner |
| Guardian reinforcement | records: roadready_guardian | same record kind, immutable | guardian + household + learner |
| Mastery/Passport | records: roadready_mastery | same record kind, derived | household + learner |
| Scout | roadready_recommendation, scout_plan | same record kinds | household + learner |
| Permit/hazard/review sessions | intelligence_session | same record kind | household + learner |
| Permit evidence | permit_attempt | same record kind, immutable | household + learner |
| Guardian Coach | coach_activity | same record kind | guardian + household + learner |
| RoadReady events | roadready_event | same record kind | household + learner |
| Idempotency/rate limiting | requests, rate_limits | same tables in private schema | authenticated actor / limit key |
| Governed content | versioned TypeScript/SVG | versioned catalog + planned persisted review manifest | explicit reviewer; no learner writes |
| Legacy Google login/code routes | Supabase client | retire or bridge deliberately before release | NOT an operational identity today |
| Legacy pilot.json store | lib/store.ts; unused by active routes | do not migrate | obsolete shared fixture |
| Tests/in-memory rule results | temporary SQLite/pure functions | remain fixtures/computed state | never import into production |

The JSON record envelope is retained for behavioral parity; indexes, ownership
checks and append-only triggers are added at the database boundary. Creating one
table for each concept would add a second domain model without improving parity.

## Authentication and authorization

Preserve the operational server-authenticated user/session model during the storage
migration. Browser roles and IDs only select resources; persisted membership and
relationships authorize them. Supabase Google sessions must not be treated as
operational sessions. Consolidating the competing login/invitation UI is a release
gate. No public PostgREST/Data API is planned for the private teensurance schema.

The application uses a least-privilege server database role, distinct from the
migration owner. Public/client roles receive no schema/table privileges. RLS is
fail-closed for ungranted roles; tenant authorization remains in scoped domain
services. Direct SQL access through the trusted server role is privileged and must
never be exposed to a browser or LLM. Append-only triggers and constraints provide
defense in depth; this is not a claim that a server-role SQL injection is tenant-safe.

## Adapter contract and transactions

An asynchronous Database/Statement contract is drafted in lib/platform/persistence.
It is wired into operational authentication, domain services and API callers. PostgreSQL uses pg with a bounded pool.
Each transaction must retain one checked-out client through commit/rollback. Domain
services retain validation, GUARD, idempotency and evidence projections. SQLite
transactions need serialized async callbacks to avoid connection interleaving.

The user explicitly approved the security-sensitive async caller conversion after
initial automated-review rejection. Database operations and domain calls are now
awaited. Relationship filtering uses preloaded data rather than async predicates.
SQLite operations serialize through the same transaction boundary; PostgreSQL
acquires a client and assumes the restricted server role for each transaction.

A conservative transaction advisory lock is proposed for initial parity with
SQLite serialization; it is a documented throughput limitation to measure during
pilot readiness, not a long-term scale claim. Retry only complete transactions;
never retry individual evidence writes outside their idempotency boundary.

## Alternatives

Supabase PostgreSQL could host the same data but is not the selected project; adding
it would preserve competing identity and membership authorities. Hosted SQLite on
serverless ephemeral storage is rejected for operational durability. Neon is selected
by explicit user direction and repository infrastructure, not convenience.

## Migration and data handling

Use reviewed versioned PostgreSQL migrations with recorded checksum, before/after
state and a direct migration connection. Runtime uses a pooled Neon connection.
No remote migration has run. Local Docker PostgreSQL is disposable test infrastructure.
Only reviewed catalog versions may be seeded. Do not copy test accounts, fixtures,
local households, passwords, tokens or learner evidence into production blindly.
Any real-data import requires classification, backup and a separately reviewed plan.

## Release gates and rollback

Require adapter parity, complete authorization attacks on PostgreSQL, immutable
history tests, concurrent invitation/idempotency tests, real reviewer approval,
exact-SHA deployment and hosted family journeys. Production must fail closed when
PostgreSQL/configuration/review evidence is missing. Local success is not hosted proof.

Rollback application to certified baseline 2271211 only in its supported local
SQLite environment; it is not a known-good hosted deployment. Disable RoadReady/
pilot as needed. Preserve database history; prefer additive forward fixes. Never
remove evidence triggers or delete learner history as feature rollback.

References: [pg transactions](https://node-postgres.com/features/transactions),
[pg pooling](https://node-postgres.com/features/pooling),
[PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

## Verified infrastructure inventory

Vercel CLI can inspect project prj_XOrRLCpZZc3ILdkYfRSR9sBeoe2A under
eduradiusllc. Its production environment contains no configured variables. The
listed production URL is https://teensurance.vercel.app; it is not a certification
claim. No Neon database connection has been obtained or remote migration run.
The local migration runner rejects non-loopback targets while hosted review remains
incomplete. Its local runs record checksum history and all-or-nothing transactions.

## Runtime role boundary

Migration 002 creates NOLOGIN teensurance_runtime with no superuser, role-creation,
database-creation or BYPASSRLS privilege. Provision a dedicated login as a member
of that role separately; never deploy the migration owner credential. The adapter
uses SET ROLE after connection checkout. RLS permits this trusted server role's
operations; unauthorized database roles remain denied. Domain ownership checks,
not an identity GUC controlled by the browser, enforce household isolation.
Audit and ledger grants are append/read only. Evidence and ownership triggers
remain effective against the runtime role. Security tests run the same domain
contract through this role; owner credentials are confined to disposable setup.

## Content and identity integration

Operational sign-in and invitation routes now use operational users/sessions and
trusted domain invitations. The legacy OAuth callback redirects to operational
login. Referral codes provide attribution identifiers only, never memberships.
Migration 003 revokes unsafe legacy direct membership writes where that old schema
exists; historical migrations are not silently rewritten.

Hosted content requires a digest-matched published human-review record. The digest
includes a concept's questions. Production review is enforced automatically on
Vercel; local review testing can enable ROADREADY_REQUIRE_HUMAN_REVIEW. Explicit
reviewer IDs are server configuration, not client roles. No reviewers or approvals
have been provisioned. Existing local demo content remains available for regression
fixtures. Review transitions retain immutable event history and source snapshots.
