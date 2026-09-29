# W69–W72 hosted persistence and content governance

Status: CERTIFIED LOCALLY — HOSTED BLOCKED.
Repository: C:\Cdev\Teensurance
Branch: mvp-integration-w100
Starting SHA: 22712119b7b1bd3ac61c86b86266143f81b4faa4

## W69–W70 implementation

Neon project `icy-tree-05791271` is the chosen hosted operational PostgreSQL provider. SQLite remains development/testing only. The user explicitly approved converting authentication, authorization, domain services, APIs and tests to async/await. This conversion is integrated, not a schema-only prototype.

The PostgreSQL adapter uses a bounded pool, transaction-pinned clients, a restricted runtime role and a shared advisory transaction lock. The lock preserves SQLite's serialized mutation semantics but limits pilot throughput. All domain callers await database results; synchronous-array filtering remains synchronous after necessary records are loaded. Hosted SQLite fails closed.

Operational identity, sessions, trusted memberships and invitations now share the same adapter. Legacy OAuth entry points direct users to operational authentication. Referral codes grant no permissions. The forward migration removes the unsafe historical public membership INSERT policy if that table exists. The server runtime role remains trusted; per-household isolation is enforced by authenticated scoped domain services, not falsely attributed to per-user PostgreSQL policies.

Migrations 001–004 were applied only to a disposable loopback PostgreSQL 17 fixture. Reapplication verified checksums. The runner rejects non-loopback targets pending hosted migration review. Runtime access uses `teensurance_runtime`; production must configure a dedicated login rather than the migration owner. No remote migration ran.

## W71 governance

Digest-bound review records support review -> approved -> published -> retired transitions, explicit reviewer allowlisting, actual human attestation and immutable review events. Hosted content is hidden without a current published digest. A changed digest requires new review.

The 282-item packet contains 54 concepts, 216 questions and 12 hazard scenes, all REVIEW REQUIRED. Disposable test approvals are never actual review evidence. Scout/coach templates and Texas rule snapshots also require human review. See ROADREADY_SOURCE_REVIEW.md.

## Local verification

- Full unit/API suite: 148 passed, zero failed/skipped.
- Security gate: 96 passed.
- PostgreSQL domain/API parity: 104 passed; low-level adapter/RLS: 4 passed.
- Content catalog checks: 2 passed; human-review workflow fixture: 1 passed.
- RoadReady browser suite: 12 passed; household/legacy browser suite: 3 passed.
- Pilot gate: 4 domain/operations tests and 1 browser journey passed.
- Typecheck and lint passed. Final production build passed after the link/metrics changes.

Counts overlap across certification commands and must not be summed as unique tests. The existing `roadready:intelligence:certify` script is an alias of the full RoadReady gate. No separate `release:certify` command is claimed.

## Hosted blockers and next action

Vercel project inspection succeeded for `eduradiusllc/teensurance`, but the production environment inventory had no configured runtime variables. A subsequently present local environment file contains only OIDC/project identifiers, not a database URL. No secret values were printed.

Provide Neon runtime and migration connections through secured project configuration, assign actual human reviewers, review migrations/backup/restore, then perform hosted family and hostile-authorization certification on a committed compatible SHA. Human content approvals, hosted persistence, deployment and hosted certification remain unverified. Do not deploy this working checkpoint as a certified hosted release.

Architecture and rollback: HOSTED_PERSISTENCE_ARCHITECTURE.md and PILOT_OPERATIONS.md.

## Checkpoint

Implementation commit: `69dabb4` — async PostgreSQL persistence and controlled pilot operations. Final production build passed. Hosted release remains blocked; no remote migration or deployment was performed.
